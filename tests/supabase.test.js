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
    for (const file of ['src/lib/ticket.js', 'src/lib/saveSession.js']) {
      const source = readFileSync(file, 'utf8');
      expect(source, `${file} builds its own Authorization header`).not.toMatch(
        /Bearer \$\{/,
      );
      expect(source).toContain('publicHeaders(');
    }
  });
});
