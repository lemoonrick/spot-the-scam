import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';

// supabase.js reads its settings when first imported, so each case sets
// the environment, then imports a fresh copy.
async function headersFor(key) {
  vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co');
  vi.stubEnv('VITE_SUPABASE_ANON_KEY', key);
  vi.resetModules();
  const { publicHeaders } = await import('../src/lib/supabase.js');
  return publicHeaders({ 'Content-Type': 'application/json' });
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('public request headers', () => {
  // Supabase issues two styles of public key, and a new project may hand
  // out either. Getting this wrong breaks every save and every dashboard
  // read at once, with an error that looks like a bad login.

  it('sends an old-style key as both apikey and a bearer token', async () => {
    const h = await headersFor('eyJhbGciOiJIUzI1NiJ9.test.sig');
    expect(h.apikey).toBe('eyJhbGciOiJIUzI1NiJ9.test.sig');
    expect(h.Authorization).toBe('Bearer eyJhbGciOiJIUzI1NiJ9.test.sig');
  });

  it('never puts a new-style key in Authorization', async () => {
    const h = await headersFor('sb_publishable_abc123');
    expect(h.apikey).toBe('sb_publishable_abc123');
    expect(h.Authorization).toBeUndefined();
  });

  it('keeps the extra headers it is given', async () => {
    const h = await headersFor('sb_publishable_abc123');
    expect(h['Content-Type']).toBe('application/json');
  });

  it('is the only place a key is turned into a bearer token', () => {
    // Three files used to build these headers by hand, identically. One
    // copy going stale is exactly how the new key style would break.
    for (const file of ['src/lib/ticket.js', 'src/lib/saveSession.js', 'src/lib/room.js']) {
      const source = readFileSync(file, 'utf8');
      expect(source, `${file} builds its own Authorization header`).not.toMatch(
        /Bearer \$\{/,
      );
      // Either directly, or through callFunction, which uses it.
      expect(source).toMatch(/publicHeaders\(|callFunction\(/);
    }
  });
});

describe('waking a sleeping server', () => {
  // The function sleeps when idle, and the request that wakes it can
  // fail. On a workshop day that is the first person to scan the QR code.
  async function callWith(replies) {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'sb_publishable_abc123');
    vi.resetModules();
    let n = 0;
    vi.stubGlobal('fetch', async () => {
      const r = replies[n++];
      if (r === 'drop') throw new TypeError('Failed to fetch');
      return new Response('{}', { status: r });
    });
    const { callFunction } = await import('../src/lib/supabase.js');
    const res = await callFunction({ action: 'room', room: 'KFTR9M' }, { retryAfterMs: 0 });
    vi.unstubAllGlobals();
    return { status: res.status, tries: n };
  }

  it('tries once more when the first request hits a server fault', async () => {
    expect(await callWith([500, 200])).toEqual({ status: 200, tries: 2 });
  });

  it('tries once more when the first request gets no reply', async () => {
    expect(await callWith(['drop', 200])).toEqual({ status: 200, tries: 2 });
  });

  it('does not repeat a refusal that will not change', async () => {
    // A code that doesn't exist won't start existing a second later.
    expect(await callWith([404])).toEqual({ status: 404, tries: 1 });
  });
});
