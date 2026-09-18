import { beforeAll, describe, expect, it } from 'vitest';
import { scams } from '../src/scams.js';
import {
  buildMatchedRounds,
  buildSessionSummary,
  roundFor,
} from '../src/session.js';

beforeAll(() => {
  // buildSessionSummary reads navigator for the device and language.
  Object.defineProperty(globalThis, 'navigator', {
    value: { userAgent: 'node', language: 'en-IN' },
    configurable: true,
  });
});

const play = (order, isCorrect) =>
  order.map((s, i) => ({
    scamId: s.id,
    type: s.type,
    round: roundFor(i, order.length),
    verdictChosen: s.verdict,
    actualVerdict: s.verdict,
    verdictCorrect: isCorrect(i),
    responseMs: 1000 * (i + 1),
  }));

describe('matched rounds', () => {
  // The whole before/after claim rests on this. If one half were easier
  // the improvement figure would be meaningless, and a funder is right
  // to ask.
  it('puts the same mix of real and fake in each half, every time', () => {
    for (let i = 0; i < 300; i++) {
      const order = buildMatchedRounds(scams);
      const half = order.length / 2;
      const fakesFirst = order.slice(0, half).filter((s) => s.verdict === 'phishing').length;
      const fakesSecond = order.slice(half).filter((s) => s.verdict === 'phishing').length;
      expect(fakesFirst).toBe(fakesSecond);
    }
  });

  it('uses every scam exactly once', () => {
    const order = buildMatchedRounds(scams);
    expect(order).toHaveLength(scams.length);
    expect(new Set(order.map((s) => s.id)).size).toBe(scams.length);
  });

  it('does not always deal the same order', () => {
    const seen = new Set(
      Array.from({ length: 20 }, () =>
        buildMatchedRounds(scams).map((s) => s.id).join(','),
      ),
    );
    expect(seen.size).toBeGreaterThan(1);
  });
});

describe('session summary', () => {
  it('reports improvement as the gap between the halves', () => {
    const order = buildMatchedRounds(scams);
    // Wrong on all of the first half, right on all of the second.
    const s = buildSessionSummary(play(order, (i) => i >= order.length / 2));
    expect(s.baselineScore).toBe(0);
    expect(s.trainedScore).toBe(100);
    expect(s.improvement).toBe(100);
  });

  it('reports a decline honestly rather than flooring at zero', () => {
    const order = buildMatchedRounds(scams);
    const s = buildSessionSummary(play(order, (i) => i < order.length / 2));
    expect(s.improvement).toBe(-100);
  });

  it('counts only trusted fakes as waved through, not false alarms', () => {
    const results = [
      { scamId: 1, type: 'sms', round: 1, verdictChosen: 'legitimate', actualVerdict: 'phishing', verdictCorrect: false, responseMs: 100 },
      { scamId: 2, type: 'sms', round: 1, verdictChosen: 'phishing', actualVerdict: 'legitimate', verdictCorrect: false, responseMs: 100 },
    ];
    const s = buildSessionSummary(results);
    expect(s.scamsWavedThrough).toBe(1);
  });

  it('records whether the run was personalised', () => {
    const order = buildMatchedRounds(scams);
    const results = play(order, () => true);
    expect(buildSessionSummary(results, { personalised: true }).personalised).toBe(true);
    expect(buildSessionSummary(results).personalised).toBe(false);
  });
});
