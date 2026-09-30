// ============================================================
//  Scoring rules for submit-session
//
//  Pure: no database, no network, no Deno globals. index.ts imports it
//  to handle requests, and the test suite imports it too, so these rules
//  are checked by running them rather than by reading source as text.
//
//  Everything that decides whether an answer is right, and every figure
//  worked out from the answers, lives here. index.ts is left with the
//  parts that talk to the outside world: tickets, rate limits, saving.
// ============================================================

// ── The answer key. This is the trust anchor: right and wrong are
//    decided here, never by the caller. Adding a scam to src/scams.js
//    means adding it here too, or its answers are rejected. A test
//    checks the two agree.
export const ANSWER_KEY: Record<number, { type: string; verdict: string }> = {
  1: { type: 'sms', verdict: 'phishing' },
  2: { type: 'sms', verdict: 'legitimate' },
  3: { type: 'email', verdict: 'phishing' },
  4: { type: 'email', verdict: 'legitimate' },
  5: { type: 'whatsapp', verdict: 'phishing' },
  6: { type: 'whatsapp', verdict: 'legitimate' },
  7: { type: 'instagram', verdict: 'phishing' },
  8: { type: 'popup', verdict: 'phishing' },
  9: { type: 'email', verdict: 'legitimate' },
  10: { type: 'upi', verdict: 'phishing' },
};

export const EXPECTED_ANSWERS = 10;
export const MAX_RESPONSE_MS = 30 * 60 * 1000;

// Which version of the ten questions this key describes. Change a
// scam's wording, verdict or flags and this goes up by one, so answers
// to the old version are never mixed in with answers to the new one.
export const CONTENT_VERSION = 1;

// A workshop is the public quiz plus a before and after, so it has two
// halves. The public quiz has none.
export type Mode = 'normal' | 'workshop';

// Room codes never contain a vowel (so they can't spell a word) or a
// character easily misread (0 O 1 I L). Must match the database's
// new_room_code() in 008_modes_and_rooms.sql.
export const ROOM_CODE_ALPHABET = 'BCDFGHJKMNPQRSTVWXYZ23456789';
const ROOM_CODE = new RegExp(`^[${ROOM_CODE_ALPHABET}]{6}$`);

/**
 * Tidy a code as typed — "kft r9m", "KFT-R9M" — into "KFTR9M", or null
 * if it can't be a real code. Checked before the database is asked, so
 * nonsense never costs a lookup.
 */
export function normaliseRoomCode(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const code = raw.toUpperCase().replace(/[\s-]/g, '');
  return ROOM_CODE.test(code) ? code : null;
}

// The fastest a person can plausibly judge a message they actually
// read. Anything quicker across the whole quiz is a script.
export const MIN_PLAUSIBLE_TOTAL_MS = 8000;

// A kind of message seen once cannot be a "blind spot": one wrong answer
// is a slip, not a pattern. Must match src/session.js, which applies the
// same rule on the results screen; a test checks they agree.
export const MIN_QUESTIONS_FOR_BLIND_SPOT = 2;

export const pct = (n: number, d: number) =>
  d > 0 ? Math.round((n / d) * 100) : 0;

export function median(nums: number[]) {
  if (!nums.length) return 0;
  const s = [...nums].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
}

export type CleanAnswer = {
  scam_id: number;
  scam_type: string;
  position: number;
  round: number | null;
  chosen: string;
  actual: string;
  correct: boolean;
  response_ms: number | null;
};

export type Checked =
  | { ok: true; clean: CleanAnswer[]; totalMs: number }
  | { ok: false; status: number; error: string };

/**
 * Check what the browser says it observed, and mark it.
 *
 * Only which message, what was chosen and how long are read from each
 * answer. Anything else the caller includes — a `correct` flag, a score,
 * which half it thinks a question was in — is ignored.
 *
 * Answers arrive in the order they were shown, so the order *is* the
 * position. In a workshop, positions 1 to 5 are the first half and 6 to
 * 10 the second: the server decides what counts as "before", rather than
 * taking the browser's word for it.
 */
export function validateAnswers(answers: unknown, mode: Mode): Checked {
  const list = Array.isArray(answers) ? answers : [];
  if (list.length !== EXPECTED_ANSWERS) {
    return { ok: false, status: 400, error: `Expected ${EXPECTED_ANSWERS} answers` };
  }

  const seen = new Set<number>();
  const clean: CleanAnswer[] = [];

  for (const a of list) {
    const scamId = Number(a?.scamId);
    const key = ANSWER_KEY[scamId];
    if (!key) return { ok: false, status: 400, error: `Unknown message ${scamId}` };
    if (seen.has(scamId)) return { ok: false, status: 400, error: 'Duplicate message' };
    seen.add(scamId);

    const chosen = a?.chosen;
    if (chosen !== 'phishing' && chosen !== 'legitimate') {
      return { ok: false, status: 400, error: 'Invalid answer' };
    }

    const position = clean.length + 1;
    const round =
      mode === 'workshop' ? (position <= EXPECTED_ANSWERS / 2 ? 1 : 2) : null;

    const ms = Number(a?.responseMs);
    const responseMs =
      Number.isFinite(ms) && ms >= 0 && ms <= MAX_RESPONSE_MS ? Math.round(ms) : null;

    clean.push({
      scam_id: scamId,
      scam_type: key.type,
      position,
      round,
      chosen,
      actual: key.verdict,
      // Decided here, against our own key. The caller does not get a say.
      correct: chosen === key.verdict,
      response_ms: responseMs,
    });
  }

  // A before/after comparison is only honest if both halves are equally
  // hard. The quiz deals them that way; refuse a result claiming
  // otherwise rather than store a measurement that isn't one.
  if (mode === 'workshop') {
    const half = EXPECTED_ANSWERS / 2;
    const scams = (list: CleanAnswer[]) =>
      list.filter((a) => a.actual === 'phishing').length;
    if (scams(clean.slice(0, half)) * 2 !== scams(clean)) {
      return { ok: false, status: 400, error: 'The two halves do not match' };
    }
  }

  // Do the reported timings describe a person?
  const totalMs = clean.reduce((sum, a) => sum + (a.response_ms ?? 0), 0);
  if (totalMs < MIN_PLAUSIBLE_TOTAL_MS) {
    return { ok: false, status: 422, error: 'That was too quick to be a real attempt' };
  }

  return { ok: true, clean, totalMs };
}

/**
 * Every figure stored against a play, worked out from marked answers.
 *
 * A normal play has no halves, so its before, after and improvement are
 * empty rather than zero. Zero would read as a real score, and an
 * "improvement" of minus sixty.
 */
export function summarise(clean: CleanAnswer[], totalMs: number, mode: Mode) {
  const measured = mode === 'workshop';
  const first = clean.filter((a) => a.round === 1);
  const second = clean.filter((a) => a.round === 2);
  const correct = clean.filter((a) => a.correct).length;

  const baseline = pct(first.filter((a) => a.correct).length, first.length);
  const trained = pct(second.filter((a) => a.correct).length, second.length);

  const byType: Record<string, { type: string; seen: number; correct: number }> = {};
  for (const a of clean) {
    const t = (byType[a.scam_type] ??= { type: a.scam_type, seen: 0, correct: 0 });
    t.seen += 1;
    if (a.correct) t.correct += 1;
  }
  const typeBreakdown = Object.values(byType).map((t) => ({
    ...t,
    accuracy: pct(t.correct, t.seen),
  }));

  // Worst kind first, but only among kinds seen often enough to count.
  const missed = typeBreakdown
    .filter((t) => t.accuracy < 100 && t.seen >= MIN_QUESTIONS_FOR_BLIND_SPOT)
    .sort((a, b) => a.accuracy - b.accuracy);

  return {
    score: pct(correct, clean.length),
    correct,
    total: clean.length,
    baseline_score: measured ? baseline : null,
    trained_score: measured ? trained : null,
    improvement: measured ? trained - baseline : null,
    median_response_ms_baseline: measured
      ? median(first.map((a) => a.response_ms ?? 0).filter(Boolean))
      : null,
    median_response_ms_trained: measured
      ? median(second.map((a) => a.response_ms ?? 0).filter(Boolean))
      : null,
    total_time_ms: totalMs,
    scams_waved_through: clean.filter((a) => !a.correct && a.actual === 'phishing')
      .length,
    weakest_type: missed[0]?.type ?? null,
    type_breakdown: typeBreakdown,
  };
}
