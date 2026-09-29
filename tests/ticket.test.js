import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// The ticket is what lets a result be saved, and soon it is also how a
// workshop counts who started. These three bugs each corrupted one of
// those, silently, so each is pinned here with the network faked.

let calls;
let submitStatus;

beforeEach(() => {
  calls = [];
  submitStatus = 200;
  let n = 0;
  vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co');
  vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'sb_publishable_test');
  vi.stubEnv('VITE_TURNSTILE_SITE_KEY', '');
  vi.stubGlobal('fetch', async (_url, init) => {
    const body = JSON.parse(init.body);
    calls.push(body.action ?? 'submit');
    if (body.action === 'start') {
      n += 1;
      return new Response(JSON.stringify({ ticket: `t${n}` }), { status: 200 });
    }
    return new Response(JSON.stringify({}), { status: submitStatus });
  });
  vi.resetModules();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

async function load() {
  const ticket = await import('../src/lib/ticket.js');
  const { saveSession } = await import('../src/lib/saveSession.js');
  return { ...ticket, saveSession };
}

const summary = { personalised: false, device: 'desktop', language: 'en' };

describe('tickets', () => {
  it('drops a ticket the server refused, so the next run can save', async () => {
    // The server spends a ticket before checking the answers, so even a
    // "too quick" refusal uses it up. Holding on to it made the next play
    // from the same tab fail with "cannot be submitted again".
    const { requestTicket, getTicket, saveSession } = await load();
    requestTicket();
    expect(await getTicket()).toBe('t1');

    submitStatus = 422;
    const out = await saveSession(summary, []);
    expect(out.saved).toBe(false);
    expect(await getTicket()).toBeNull();
  });

  it('does not fetch a spare ticket after saving', async () => {
    // Every ticket should stand for a run that actually began. A spare
    // fetched after each save would count as a start nobody made.
    const { requestTicket, getTicket, saveSession } = await load();
    requestTicket();
    await getTicket();
    await saveSession(summary, []);
    expect(calls.filter((c) => c === 'start')).toHaveLength(1);
  });

  it("leaves the next run's ticket alone when an old save finishes late", async () => {
    // Try Again can be pressed while the last save is still in flight.
    // The next run fetches t2; the old save then clears the ticket it
    // actually sent, t1, and must not take t2 with it.
    const { requestTicket, getTicket, clearTicket } = await load();
    requestTicket();
    expect(await getTicket()).toBe('t1');

    clearTicket(); // the next run starts clean
    requestTicket();
    expect(await getTicket()).toBe('t2');

    clearTicket('t1'); // the old save finishing
    expect(await getTicket()).toBe('t2');
  });
});

describe('Try Again', () => {
  it('starts a fresh run rather than resetting the old one in place', () => {
    // A fresh mount deals a new order and asks for a new ticket. The old
    // in-place reset kept the same order, although the button promises
    // "a fresh set, shuffled".
    const app = readFileSync('src/App.jsx', 'utf8');
    expect(app).toMatch(/<ScamScreen\s+key=\{runId\}/);

    const screen = readFileSync('src/ScamScreen.jsx', 'utf8');
    expect(screen, 'ScamScreen should not reset a finished run in place').not.toContain(
      'setResults([])',
    );
  });
});
