import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { scams } from '../src/scams.js';
import { ANSWER_KEY } from '../supabase/functions/submit-session/scoring.ts';

const FUNCTION = 'supabase/functions/submit-session/index.ts';
const SCORING = 'supabase/functions/submit-session/scoring.ts';

/**
 * The Edge Function keeps its own copy of the answer key, because it is
 * the thing deciding right from wrong and must not take the browser's
 * word for it. Duplication is the correct call at a trust boundary.
 *
 * The risk is drift. If a scam changes verdict in src/scams.js and the
 * function is not updated, every player who answers it correctly is
 * recorded as wrong, and /impact quietly reports a lie. Nothing at
 * runtime would notice, so it is checked here.
 *
 * The key used to be pulled out of the function's source with a regular
 * expression. It lives in a plain module now, so it is imported instead.
 */
describe('server answer key', () => {
  const key = ANSWER_KEY;

  it('is not empty', () => {
    expect(Object.keys(key).length).toBeGreaterThan(0);
  });

  it('covers every scam in the quiz', () => {
    for (const s of scams) {
      expect(key[s.id], `scam ${s.id} is missing from ${SCORING}`).toBeDefined();
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

  it('leaves all marking to the scoring module', () => {
    // Right and wrong are decided in scoring.ts, which never sees the
    // raw request. Its behaviour is tested directly in scoring.test.js.
    expect(source).toContain('validateAnswers(payload.answers)');
    expect(readFileSync(SCORING, 'utf8')).not.toMatch(/payload/);
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

  it('rejects a quiz finished impossibly soon after it started', () => {
    // The ticket-age half of the timing check lives here, because it
    // needs the database. The per-answer timing half is in scoring.ts.
    expect(source).toContain('MIN_QUIZ_SECONDS');
  });

  it('rate-limits both issuing and submitting', () => {
    expect(source).toContain("'start', MAX_TICKETS_PER_IP_PER_HOUR");
    expect(source).toContain("'submit', MAX_PER_IP_PER_HOUR");
  });

  // The browser sends apikey and authorization. If the preflight does
  // not allow them, every save from a browser is blocked before the
  // request is even made, while curl keeps working because it skips
  // preflight entirely. That is exactly how this shipped broken once.
  it('allows every header the client actually sends', () => {
    for (const header of ['authorization', 'apikey', 'content-type']) {
      expect(
        source,
        `CORS must allow the ${header} header`,
      ).toMatch(new RegExp(`Access-Control-Allow-Headers[\\s\\S]{0,120}${header}`));
    }
  });

  // A protection that switches itself off in silence is worse than no
  // protection, because nobody goes looking.
  it('says so in the logs if rate limiting cannot run', () => {
    expect(source).toContain('rate limiting is NOT active');
  });

  // It used to refuse to run without a Turnstile secret. There is no
  // Cloudflare account, so failing closed would mean saving nothing.
  it('still checks Turnstile when configured, but does not require it', () => {
    expect(source).toContain('if (TURNSTILE_SECRET)');
    expect(source).not.toContain('if (!TURNSTILE_SECRET)');
  });
});
