// ============================================================
//  SESSION MODEL — the measurement layer
//
//  Every quiz run produces one anonymous "session" object.
//  Nothing here identifies a person: no name, email, IP or login.
//
//  This module is deliberately isolated from the UI so that
//  Phase 2 can POST buildSessionSummary() straight to a database
//  without touching any component.
// ============================================================

export const ROUND_SIZE = 5; // questions per round (baseline / trained)

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
 */
export function buildSessionSummary(results) {
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
    .filter((t) => t.accuracy < 100)
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

    baselineScore,
    trainedScore,
    improvement: trainedScore - baselineScore,

    medianResponseMsBaseline: median(baseline.map((r) => r.responseMs)),
    medianResponseMsTrained: median(trained.map((r) => r.responseMs)),
    totalTimeMs: results.reduce((sum, r) => sum + (r.responseMs || 0), 0),

    scamsWavedThrough,
    typeBreakdown,
    weakestType: missed[0]?.type ?? null,

    // Kept minimal and non-identifying — useful for segmenting reach later.
    device: /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
    language: navigator.language || 'unknown',
  };
}
