// ============================================================
//  SESSION MODEL — the measurement layer
//
//  Every quiz run produces one anonymous "session" object.
//  Nothing here identifies a person: no name, email, IP or login.
//
//  This module is deliberately isolated from the UI: it decides the
//  order a run is dealt in and works out the figures shown at the end,
//  and none of it needs a screen to test.
// ============================================================

// A "blind spot" drawn from a single question is just one wrong answer.
// Three of the six types have only one question each, so require at
// least two before naming one. The server applies the same rule when it
// stores a play (supabase/functions/submit-session/scoring.ts); a test
// checks the two numbers agree.
export const MIN_QUESTIONS_FOR_BLIND_SPOT = 2;

/**
 * Split the scam set into two rounds with MATCHED composition.
 *
 * A before/after comparison is only honest if both halves are equally
 * hard. So instead of shuffling all 10 questions, we shuffle the
 * phishing pool and the legitimate pool separately, then deal them
 * alternately — guaranteeing each round gets the same number of
 * phishing and legitimate examples every single session.
 */
export function buildMatchedRounds(allScams) {
  const phishing = shuffle(allScams.filter((s) => s.verdict === 'phishing'));
  const legit = shuffle(allScams.filter((s) => s.verdict === 'legitimate'));

  const half = (pool) => Math.floor(pool.length / 2);
  const roundOne = shuffle([
    ...phishing.slice(0, half(phishing)),
    ...legit.slice(0, half(legit)),
  ]);
  const roundTwo = shuffle([
    ...phishing.slice(half(phishing)),
    ...legit.slice(half(legit)),
  ]);

  return [...roundOne, ...roundTwo];
}

/**
 * The order a run is dealt in.
 *
 * A workshop measures learning, so it gets two matched halves. The
 * public quiz measures nothing, so it is a plain shuffle of all ten:
 * there is no "first half" for anyone to compare against.
 *
 * @param {'normal' | 'workshop'} mode
 */
export function buildQuizOrder(allScams, mode) {
  return mode === 'workshop' ? buildMatchedRounds(allScams) : shuffle(allScams);
}

export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Which round a question index belongs to. Round 1 = baseline, 2 = trained. */
export function roundFor(index, total) {
  return index < Math.floor(total / 2) ? 1 : 2;
}

function pct(correct, total) {
  return total > 0 ? Math.round((correct / total) * 100) : 0;
}

function median(nums) {
  if (!nums.length) return 0;
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2);
}

/**
 * Turn a finished run into the numbers stakeholders actually ask for.
 * `results` is the array collected by ScamScreen.
 *
 * Only a workshop has a before and an after. In the public quiz those
 * figures are null rather than zero: zero would read as a real score,
 * and an "improvement" of minus sixty. The server applies the same rule
 * to what it stores.
 */
export function buildSessionSummary(
  results,
  { personalised = false, mode = 'normal' } = {},
) {
  const measured = mode === 'workshop';
  const total = results.length;
  const correct = results.filter((r) => r.verdictCorrect).length;

  const baseline = results.filter((r) => r.round === 1);
  const trained = results.filter((r) => r.round === 2);

  const baselineScore = pct(
    baseline.filter((r) => r.verdictCorrect).length,
    baseline.length,
  );
  const trainedScore = pct(
    trained.filter((r) => r.verdictCorrect).length,
    trained.length,
  );

  // Per scam-type accuracy — surfaces the population's blind spot.
  const byType = {};
  results.forEach((r) => {
    const t = (byType[r.type] ||= { type: r.type, seen: 0, correct: 0 });
    t.seen += 1;
    if (r.verdictCorrect) t.correct += 1;
  });
  const typeBreakdown = Object.values(byType).map((t) => ({
    ...t,
    accuracy: pct(t.correct, t.seen),
  }));

  const missed = typeBreakdown
    .filter((t) => t.accuracy < 100 && t.seen >= MIN_QUESTIONS_FOR_BLIND_SPOT)
    .sort((a, b) => a.accuracy - b.accuracy);

  // A "false trust" miss is the dangerous kind: a real scam waved through.
  const scamsWavedThrough = results.filter(
    (r) => !r.verdictCorrect && r.actualVerdict === 'phishing',
  ).length;

  return {
    schemaVersion: 1,
    completedAt: new Date().toISOString(),

    total,
    correct,
    score: pct(correct, total),

    mode,
    baselineScore: measured ? baselineScore : null,
    trainedScore: measured ? trainedScore : null,
    improvement: measured ? trainedScore - baselineScore : null,

    medianResponseMsBaseline: measured
      ? median(baseline.map((r) => r.responseMs))
      : null,
    medianResponseMsTrained: measured
      ? median(trained.map((r) => r.responseMs))
      : null,
    totalTimeMs: results.reduce((sum, r) => sum + (r.responseMs || 0), 0),

    scamsWavedThrough,
    typeBreakdown,
    weakestType: missed[0]?.type ?? null,

    // Whether the player gave a name, so we can compare how people do
    // against scams that address them personally versus generic ones.
    // The name itself is never recorded; only this true/false.
    personalised,

    // Kept minimal and non-identifying — useful for segmenting reach later.
    device: /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
    language: navigator.language || 'unknown',
  };
}
