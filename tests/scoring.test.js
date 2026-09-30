import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { MIN_QUESTIONS_FOR_BLIND_SPOT as CLIENT_MIN } from '../src/session.js';
import {
  ANSWER_KEY,
  MIN_PLAUSIBLE_TOTAL_MS,
  MIN_QUESTIONS_FOR_BLIND_SPOT as SERVER_MIN,
  ROOM_CODE_ALPHABET,
  normaliseRoomCode,
  summarise,
  validateAnswers,
} from '../supabase/functions/submit-session/scoring.ts';

// These rules decide what reaches the public figures. They used to be
// checked by searching the function's source for particular words; now
// they are run.

const ids = (pred) =>
  Object.keys(ANSWER_KEY).map(Number).filter((id) => pred(ANSWER_KEY[id]));
const SCAMS = ids((k) => k.verdict === 'phishing');
const GENUINE = ids((k) => k.verdict === 'legitimate');

/**
 * A believable full round, in the order given. By default each half gets
 * half the scams and half the genuine messages, as the quiz deals them.
 * `round` is filled in the way the old browser code sent it; the server
 * is meant to ignore it.
 */
function round({ wrong = [], ms = 2000, order } = {}) {
  const dealt = order ?? [
    ...SCAMS.slice(0, SCAMS.length / 2),
    ...GENUINE.slice(0, GENUINE.length / 2),
    ...SCAMS.slice(SCAMS.length / 2),
    ...GENUINE.slice(GENUINE.length / 2),
  ];
  return dealt.map((id, i) => {
    const key = ANSWER_KEY[id];
    const flip = key.verdict === 'phishing' ? 'legitimate' : 'phishing';
    return {
      scamId: id,
      round: i < dealt.length / 2 ? 1 : 2,
      chosen: wrong.includes(id) ? flip : key.verdict,
      responseMs: ms,
    };
  });
}

const firstHalf = () => round().slice(0, 5).map((a) => a.scamId);

describe('marking answers', () => {
  it('accepts a believable round in either mode', () => {
    expect(validateAnswers(round(), 'normal').ok).toBe(true);
    expect(validateAnswers(round(), 'workshop').ok).toBe(true);
  });

  it('decides correctness against its own key, not the caller', () => {
    // A caller claiming every answer is correct gets no say: only which
    // message, the choice and the timing are read.
    const answers = round({ wrong: [1, 3] }).map((a) => ({ ...a, correct: true }));
    const out = validateAnswers(answers, 'normal');
    expect(out.ok).toBe(true);
    expect(out.clean.filter((a) => !a.correct).map((a) => a.scam_id).sort()).toEqual([1, 3]);
  });

  it('ignores a score the caller slips in', () => {
    const answers = round({ wrong: [1, 3, 5] });
    const out = validateAnswers(Object.assign(answers, { score: 100 }), 'normal');
    expect(summarise(out.clean, out.totalMs, 'normal').score).toBe(70);
  });

  it('rejects a round answered faster than a person could read it', () => {
    const tooFast = Math.floor(MIN_PLAUSIBLE_TOTAL_MS / 10) - 1;
    expect(validateAnswers(round({ ms: tooFast }), 'normal')).toMatchObject({
      ok: false,
      status: 422,
    });
  });

  it('rejects anything other than exactly ten answers', () => {
    expect(validateAnswers(round().slice(0, 9), 'normal')).toMatchObject({ ok: false, status: 400 });
    expect(validateAnswers(undefined, 'normal')).toMatchObject({ ok: false, status: 400 });
  });

  it('rejects a message it has never heard of', () => {
    const answers = round();
    answers[0] = { ...answers[0], scamId: 999 };
    expect(validateAnswers(answers, 'normal')).toMatchObject({ ok: false, status: 400 });
  });

  it('rejects the same message answered twice', () => {
    const answers = round();
    answers[1] = { ...answers[1], scamId: answers[0].scamId };
    expect(validateAnswers(answers, 'normal')).toMatchObject({
      ok: false,
      error: 'Duplicate message',
    });
  });

  it('drops an absurd response time rather than trusting it', () => {
    const answers = round({ ms: 5000 });
    answers[0] = { ...answers[0], responseMs: 99 * 60 * 60 * 1000 };
    expect(validateAnswers(answers, 'normal').clean[0].response_ms).toBeNull();
  });
});

describe('the public quiz (normal mode)', () => {
  it('records the order shown, and no halves', () => {
    const out = validateAnswers(round(), 'normal');
    expect(out.clean.map((a) => a.position)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(out.clean.every((a) => a.round === null)).toBe(true);
  });

  it('stores no before and after — empty, not zero', () => {
    // Zero would read as a real score, and an "improvement" of minus
    // sixty: exactly the bug the old two-half maths had with one round.
    const out = validateAnswers(round({ wrong: [1] }), 'normal');
    const s = summarise(out.clean, out.totalMs, 'normal');
    expect(s.baseline_score).toBeNull();
    expect(s.trained_score).toBeNull();
    expect(s.improvement).toBeNull();
    expect(s.median_response_ms_baseline).toBeNull();
    expect(s.median_response_ms_trained).toBeNull();
    expect(s.score).toBe(90);
  });

  it('takes any order, since the public quiz is not split', () => {
    // All the scams first: a workshop would refuse this, the public quiz
    // must not.
    const out = validateAnswers(round({ order: [...SCAMS, ...GENUINE] }), 'normal');
    expect(out.ok).toBe(true);
  });

  it("still accepts what today's live site sends", () => {
    // The current site sends a `round` on every answer. The updated
    // function goes live before the new site does, so it must take that
    // shape without complaint and simply ignore the field.
    const answers = round().map((a, i) => ({ ...a, round: i < 5 ? 1 : 2 }));
    expect(validateAnswers(answers, 'normal').ok).toBe(true);
  });
});

describe('a workshop (before and after)', () => {
  it('decides the halves from the order, not from the browser', () => {
    // Every answer claims to be in round 1. The server ignores that and
    // splits by position: the first five are "before".
    const answers = round().map((a) => ({ ...a, round: 1 }));
    const out = validateAnswers(answers, 'workshop');
    expect(out.clean.map((a) => a.round)).toEqual([1, 1, 1, 1, 1, 2, 2, 2, 2, 2]);
  });

  it('refuses halves that are not equally hard', () => {
    // Four scams in the first half and two in the second would make
    // "improvement" a measure of luck. Refuse it rather than store it.
    const lopsided = [...SCAMS.slice(0, 4), GENUINE[0], ...SCAMS.slice(4), ...GENUINE.slice(1)];
    expect(validateAnswers(round({ order: lopsided }), 'workshop')).toMatchObject({
      ok: false,
      status: 400,
      error: 'The two halves do not match',
    });
  });

  it('scores each half separately and reports the gap', () => {
    // Two wrong in the first half, none in the second.
    const out = validateAnswers(round({ wrong: firstHalf().slice(0, 2) }), 'workshop');
    const s = summarise(out.clean, out.totalMs, 'workshop');
    expect(s.baseline_score).toBe(60);
    expect(s.trained_score).toBe(100);
    expect(s.improvement).toBe(40);
  });
});

describe('working out the figures', () => {
  it('counts only trusted scams as waved through, not false alarms', () => {
    const out = validateAnswers(round({ wrong: [SCAMS[0], GENUINE[0]] }), 'normal');
    expect(summarise(out.clean, out.totalMs, 'normal').scams_waved_through).toBe(1);
  });

  it('will not name a blind spot from a single question', () => {
    // Only the one Instagram message wrong: a slip, not a pattern.
    const [insta] = ids((k) => k.type === 'instagram');
    const out = validateAnswers(round({ wrong: [insta] }), 'normal');
    expect(summarise(out.clean, out.totalMs, 'normal').weakest_type).toBeNull();
  });

  it('uses the same blind-spot rule as the results screen', () => {
    // If these drift, a player is told one thing and /impact records
    // another about the same play.
    expect(SERVER_MIN).toBe(CLIENT_MIN);
  });
});

describe('room codes', () => {
  it('tidies a code however it was typed', () => {
    expect(normaliseRoomCode('kftr9m')).toBe('KFTR9M');
    expect(normaliseRoomCode(' KFT R9M ')).toBe('KFTR9M');
    expect(normaliseRoomCode('KFT-R9M')).toBe('KFTR9M');
  });

  it('refuses anything that cannot be a real code, before any lookup', () => {
    for (const bad of ['KFTR9', 'KFTR9MM', 'KFTR0M', 'KFTROM', 'AEIOU2', '', null, 42]) {
      expect(normaliseRoomCode(bad), String(bad)).toBeNull();
    }
  });

  it('uses the same alphabet as the database that makes the codes', () => {
    // If these drift, the database hands out a code the function then
    // refuses to accept.
    const sql = readFileSync('supabase/008_modes_and_rooms.sql', 'utf8');
    expect(sql).toContain(`alphabet constant text := '${ROOM_CODE_ALPHABET}'`);
  });

  it('never uses a vowel or a character that is easy to misread', () => {
    expect(ROOM_CODE_ALPHABET).not.toMatch(/[AEIOU01L]/);
    expect(ROOM_CODE_ALPHABET).toHaveLength(28);
  });
});
