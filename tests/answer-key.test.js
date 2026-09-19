import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { scams } from '../src/scams.js';

const FUNCTION = 'supabase/functions/submit-session/index.ts';

/**
 * The Edge Function keeps its own copy of the answer key, because it is
 * the thing deciding right from wrong and must not take the browser's
 * word for it. Duplication is the correct call at a trust boundary.
 *
 * The risk is drift. If a scam changes verdict in src/scams.js and the
 * function is not updated, every player who answers it correctly is
 * recorded as wrong, and /impact quietly reports a lie. Nothing at
 * runtime would notice, so it is checked here.
 */
function parseAnswerKey(source) {
  const block = source.slice(
    source.indexOf('const ANSWER_KEY'),
    source.indexOf('};', source.indexOf('const ANSWER_KEY')),
  );
  const key = {};
  for (const [, id, type, verdict] of block.matchAll(
    /(\d+):\s*\{\s*type:\s*'([^']+)',\s*verdict:\s*'([^']+)'\s*\}/g,
  )) {
    key[Number(id)] = { type, verdict };
  }
  return key;
}

describe('server answer key', () => {
  const key = parseAnswerKey(readFileSync(FUNCTION, 'utf8'));

  it('was parsed at all', () => {
    expect(Object.keys(key).length).toBeGreaterThan(0);
  });

  it('covers every scam in the quiz', () => {
    for (const s of scams) {
      expect(key[s.id], `scam ${s.id} is missing from ${FUNCTION}`).toBeDefined();
    }
  });

  it('agrees with the quiz on every verdict and type', () => {
    for (const s of scams) {
      expect(key[s.id].verdict, `scam ${s.id} verdict disagrees with the server`).toBe(
        s.verdict,
      );
      expect(key[s.id].type, `scam ${s.id} type disagrees with the server`).toBe(s.type);
    }
  });

  it('holds no scams the quiz does not', () => {
    const ids = new Set(scams.map((s) => s.id));
    for (const id of Object.keys(key)) {
      expect(ids.has(Number(id)), `server key has unknown scam ${id}`).toBe(true);
    }
  });
});

describe('the browser is not trusted', () => {
  const source = readFileSync(FUNCTION, 'utf8');

  it('never reads a score out of the request', () => {
    expect(source).not.toMatch(/payload\.(score|baselineScore|trainedScore|improvement)/);
  });

  it('decides correctness against its own key', () => {
    expect(source).toContain('correct: chosen === key.verdict');
  });

  // Turnstile is optional now, so these are what actually holds abuse
  // off. Each is asserted so none can be dropped unnoticed.
  it('requires a ticket before accepting a result', () => {
    expect(source).toContain("payload.ticket");
    expect(source).toContain('Missing ticket');
  });

  it('only redeems a ticket that is unused and recent', () => {
    expect(source).toContain(".is('used_at', null)");
    expect(source).toContain("gte('created_at', cutoff)");
  });

  it('rejects a quiz finished impossibly fast', () => {
    expect(source).toContain('MIN_QUIZ_SECONDS');
    expect(source).toContain('MIN_PLAUSIBLE_TOTAL_MS');
  });

  it('rate-limits both issuing and submitting', () => {
    expect(source).toContain("'start', MAX_TICKETS_PER_IP_PER_HOUR");
    expect(source).toContain("'submit', MAX_PER_IP_PER_HOUR");
  });

  // It used to refuse to run without a Turnstile secret. There is no
  // Cloudflare account, so failing closed would mean saving nothing.
  it('still checks Turnstile when configured, but does not require it', () => {
    expect(source).toContain('if (TURNSTILE_SECRET)');
    expect(source).not.toContain('if (!TURNSTILE_SECRET)');
  });
});
