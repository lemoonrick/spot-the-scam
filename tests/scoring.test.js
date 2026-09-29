import { describe, expect, it } from 'vitest';
import { MIN_QUESTIONS_FOR_BLIND_SPOT as CLIENT_MIN } from '../src/session.js';
import {
  ANSWER_KEY,
  MIN_PLAUSIBLE_TOTAL_MS,
  MIN_QUESTIONS_FOR_BLIND_SPOT as SERVER_MIN,
  summarise,
  validateAnswers,
} from '../supabase/functions/submit-session/scoring.ts';

// These rules decide what reaches the public figures. They used to be
// checked by searching the function's source for particular words; now
// they are run.

/** A believable full round: all ten messages, first five in round 1. */
function round({ wrong = [], ms = 2000 } = {}) {
  return Object.entries(ANSWER_KEY).map(([id, key], i) => ({
    scamId: Number(id),
    round: i < 5 ? 1 : 2,
    chosen:
      wrong.includes(Number(id))
        ? key.verdict === 'phishing'
          ? 'legitimate'
          : 'phishing'
        : key.verdict,
    responseMs: ms,
  }));
}

describe('marking answers', () => {
  it('accepts a believable round', () => {
    expect(validateAnswers(round()).ok).toBe(true);
  });

  it('decides correctness against its own key, not the caller', () => {
    // A caller claiming every answer is correct gets no say: only which
    // message, the choice, the half and the timing are read.
    const answers = round({ wrong: [1, 3] }).map((a) => ({ ...a, correct: true }));
    const out = validateAnswers(answers);
    expect(out.ok).toBe(true);
    expect(out.clean.filter((a) => !a.correct).map((a) => a.scam_id)).toEqual([1, 3]);
  });

  it('ignores a score the caller slips in', () => {
    const answers = round({ wrong: [1, 3, 5] });
    const out = validateAnswers(Object.assign(answers, { score: 100 }));
    expect(summarise(out.clean, out.totalMs).score).toBe(70);
  });

  it('rejects a round answered faster than a person could read it', () => {
    const tooFast = Math.floor(MIN_PLAUSIBLE_TOTAL_MS / 10) - 1;
    const out = validateAnswers(round({ ms: tooFast }));
    expect(out).toMatchObject({ ok: false, status: 422 });
  });

  it('rejects anything other than exactly ten answers', () => {
    expect(validateAnswers(round().slice(0, 9))).toMatchObject({ ok: false, status: 400 });
    expect(validateAnswers(undefined)).toMatchObject({ ok: false, status: 400 });
  });

  it('rejects a message it has never heard of', () => {
    const answers = round();
    answers[0] = { ...answers[0], scamId: 999 };
    expect(validateAnswers(answers)).toMatchObject({ ok: false, status: 400 });
  });

  it('rejects the same message answered twice', () => {
    const answers = round();
    answers[1] = { ...answers[1], scamId: answers[0].scamId };
    expect(validateAnswers(answers)).toMatchObject({ ok: false, error: 'Duplicate message' });
  });

  it('drops an absurd response time rather than trusting it', () => {
    const answers = round({ ms: 5000 });
    answers[0] = { ...answers[0], responseMs: 99 * 60 * 60 * 1000 };
    const out = validateAnswers(answers);
    expect(out.clean[0].response_ms).toBeNull();
  });
});

describe('working out the figures', () => {
  it('scores each half separately and reports the gap', () => {
    // Two wrong in the first half, none in the second.
    const firstHalfIds = round().slice(0, 2).map((a) => a.scamId);
    const out = validateAnswers(round({ wrong: firstHalfIds }));
    const s = summarise(out.clean, out.totalMs);
    expect(s.baseline_score).toBe(60);
    expect(s.trained_score).toBe(100);
    expect(s.improvement).toBe(40);
  });

  it('counts only trusted scams as waved through, not false alarms', () => {
    const scam = Number(Object.keys(ANSWER_KEY).find((id) => ANSWER_KEY[id].verdict === 'phishing'));
    const real = Number(Object.keys(ANSWER_KEY).find((id) => ANSWER_KEY[id].verdict === 'legitimate'));
    const out = validateAnswers(round({ wrong: [scam, real] }));
    expect(summarise(out.clean, out.totalMs).scams_waved_through).toBe(1);
  });

  it('will not name a blind spot from a single question', () => {
    // Only the one Instagram message wrong: a slip, not a pattern.
    const insta = Number(Object.keys(ANSWER_KEY).find((id) => ANSWER_KEY[id].type === 'instagram'));
    const out = validateAnswers(round({ wrong: [insta] }));
    expect(summarise(out.clean, out.totalMs).weakest_type).toBeNull();
  });

  it('uses the same blind-spot rule as the results screen', () => {
    // If these drift, a player is told one thing and /impact records
    // another about the same play.
    expect(SERVER_MIN).toBe(CLIENT_MIN);
  });
});
