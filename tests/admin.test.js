import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cell, toCsv } from '../src/admin/csv.js';

// ── Spreadsheet export ─────────────────────────────────────────

describe('spreadsheet export', () => {
  it('leaves plain values alone', () => {
    expect(cell('Pune College Workshop')).toBe('Pune College Workshop');
    expect(cell(42)).toBe('42');
    expect(cell(null)).toBe('');
  });

  it('quotes a value that would otherwise split into two columns or rows', () => {
    expect(cell('Pune, Maharashtra')).toBe('"Pune, Maharashtra"');
    expect(cell('line one\nline two')).toBe('"line one\nline two"');
    expect(cell('the "real" one')).toBe('"the ""real"" one"');
  });

  it('never lets a value run as a spreadsheet formula', () => {
    // Opening a download should never run anything, even if a room name
    // typed by hand happened to start with "=".
    expect(cell('=HYPERLINK("x")')).toBe(`"'=HYPERLINK(""x"")"`);
    expect(cell('+91 98765')).toBe("'+91 98765");
    expect(cell('-5')).toBe("'-5");
  });

  it('keeps real numbers as numbers, negative ones included', () => {
    // A workshop where someone did worse after the red flags has an
    // improvement of -20. Turned into text, a spreadsheet couldn't
    // average the column.
    expect(cell(-20)).toBe('-20');
    expect(cell(0)).toBe('0');
    expect(cell(Number.NaN)).toBe('');
  });

  it('writes a header row and one row per record, in column order', () => {
    const csv = toCsv(
      [
        { key: 'code', label: 'Room' },
        { key: 'score', label: 'Score', value: (r) => `${r.score}%` },
      ],
      [
        { code: 'RY767F', score: 80 },
        { code: 'RY767F', score: 60 },
      ],
    );
    expect(csv).toBe('Room,Score\r\nRY767F,80%\r\nRY767F,60%');
  });
});

// ── Admin login ────────────────────────────────────────────────

describe('admin login', () => {
  let store;
  let calls;
  let replies;

  beforeEach(() => {
    store = new Map();
    calls = [];
    replies = {};
    vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'sb_publishable_test');
    vi.stubGlobal('sessionStorage', {
      getItem: (k) => store.get(k) ?? null,
      setItem: (k, v) => store.set(k, v),
      removeItem: (k) => store.delete(k),
    });
    vi.stubGlobal('fetch', async (url, init) => {
      const path = new URL(url).pathname + new URL(url).search;
      calls.push({ path, auth: init.headers.Authorization });
      const key = Object.keys(replies).find((k) => path.includes(k));
      const [status, body] = replies[key] ?? [404, {}];
      return new Response(JSON.stringify(body), { status });
    });
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  const token = (exp, n = 1) => ({
    access_token: `access-${n}`,
    refresh_token: `refresh-${n}`,
    expires_at: exp,
    user: { email: 'admin@example.org' },
  });
  const inAnHour = () => Math.floor(Date.now() / 1000) + 3600;

  it('logs an admin in and keeps the login for this tab only', async () => {
    replies['grant_type=password'] = [200, token(inAnHour())];
    replies['rpc/is_admin'] = [200, true];
    const auth = await import('../src/admin/auth.js');
    expect(await auth.logIn('admin@example.org', 'pw')).toEqual({ ok: true });
    expect(auth.isLoggedIn()).toBe(true);
    expect([...store.keys()]).toEqual(['spot-the-scam-admin']);
  });

  it('turns away a real account that is not on the admins list', async () => {
    replies['grant_type=password'] = [200, token(inAnHour())];
    replies['rpc/is_admin'] = [200, false];
    const auth = await import('../src/admin/auth.js');
    const out = await auth.logIn('someone@example.org', 'pw');
    expect(out.ok).toBe(false);
    expect(out.reason).toMatch(/isn’t an admin/);
    expect(store.size).toBe(0);
    // And the login it was given is thrown away, not left lying around.
    expect(calls.some((c) => c.path.includes('/auth/v1/logout'))).toBe(true);
  });

  it('gives the same answer for a wrong email and a wrong password', async () => {
    // Otherwise this screen could be used to find out who has an account.
    replies['grant_type=password'] = [400, { error: 'invalid_grant' }];
    const auth = await import('../src/admin/auth.js');
    expect((await auth.logIn('nobody@example.org', 'pw')).reason).toBe(
      'That email and password don’t match.',
    );
  });

  it('refreshes a login that is about to run out, before using it', async () => {
    replies['grant_type=password'] = [200, token(Math.floor(Date.now() / 1000) + 30)];
    replies['rpc/is_admin'] = [200, true];
    replies['grant_type=refresh_token'] = [200, token(inAnHour(), 2)];
    const auth = await import('../src/admin/auth.js');
    await auth.logIn('admin@example.org', 'pw');
    expect(await auth.accessToken()).toBe('access-2');
  });

  it('refreshes once and retries when a request is refused', async () => {
    replies['grant_type=password'] = [200, token(inAnHour())];
    replies['rpc/is_admin'] = [200, true];
    replies['grant_type=refresh_token'] = [200, token(inAnHour(), 2)];
    const auth = await import('../src/admin/auth.js');
    const api = await import('../src/admin/api.js');
    await auth.logIn('admin@example.org', 'pw');

    let first = true;
    const realFetch = globalThis.fetch;
    vi.stubGlobal('fetch', async (url, init) => {
      if (String(url).includes('admin_rooms') && first) {
        first = false;
        return new Response('{}', { status: 401 });
      }
      if (String(url).includes('admin_rooms')) {
        return new Response(JSON.stringify([{ code: 'RY767F' }]), { status: 200 });
      }
      return realFetch(url, init);
    });
    expect(await api.select('admin_rooms')).toEqual([{ code: 'RY767F' }]);
  });

  it('sends the admin back to the login screen when the login has truly expired', async () => {
    replies['grant_type=password'] = [200, token(Math.floor(Date.now() / 1000) + 30)];
    replies['rpc/is_admin'] = [200, true];
    replies['grant_type=refresh_token'] = [400, { error: 'invalid_grant' }];
    const auth = await import('../src/admin/auth.js');
    const api = await import('../src/admin/api.js');
    await auth.logIn('admin@example.org', 'pw');
    await expect(api.select('admin_rooms')).rejects.toBeInstanceOf(api.LoggedOutError);
    expect(auth.isLoggedIn()).toBe(false);
    expect(store.size).toBe(0);
  });

  it('forgets everything on logout', async () => {
    replies['grant_type=password'] = [200, token(inAnHour())];
    replies['rpc/is_admin'] = [200, true];
    replies['/auth/v1/logout'] = [204, {}];
    const auth = await import('../src/admin/auth.js');
    await auth.logIn('admin@example.org', 'pw');
    await auth.logOut();
    expect(auth.isLoggedIn()).toBe(false);
    expect(store.size).toBe(0);
  });

  it('sends the admin’s own login with every request, never the public key alone', async () => {
    replies['grant_type=password'] = [200, token(inAnHour())];
    replies['rpc/is_admin'] = [200, true];
    replies['admin_rooms'] = [200, []];
    const auth = await import('../src/admin/auth.js');
    const api = await import('../src/admin/api.js');
    await auth.logIn('admin@example.org', 'pw');
    await api.select('admin_rooms');
    expect(calls.find((c) => c.path.includes('admin_rooms')).auth).toBe('Bearer access-1');
  });
});

// ── How rooms are described ────────────────────────────────────

describe('room status', () => {
  let labels;
  beforeEach(async () => {
    labels = await import('../src/admin/labels.js');
  });

  const inHours = (h) => new Date(Date.now() + h * 3_600_000).toISOString();

  it('tells apart a room someone closed from one whose time ran out', () => {
    expect(labels.roomStatus({ status: 'open', open_now: true }).label).toBe('Open');
    expect(labels.roomStatus({ status: 'open', open_now: false }).label).toBe('Ended');
    expect(labels.roomStatus({ status: 'closed', open_now: false }).label).toBe('Closed');
  });

  it('says when a room closes in words a facilitator can act on', () => {
    expect(labels.closesLabel({ closes_at: inHours(3) })).toBe('Closes in 3 hours');
    expect(labels.closesLabel({ closes_at: inHours(0.4) })).toBe('Closes within the hour');
    expect(labels.closesLabel({ closes_at: inHours(72) })).toBe('Closes in 3 days');
    expect(labels.closesLabel({ closes_at: inHours(-5) })).toMatch(/^Ended /);
  });

  it('shows a workshop date as the day it was, wherever the admin is', () => {
    // Parsed as-is, "2026-09-12" is midnight in London: the 11th for
    // anyone west of it.
    expect(labels.fmtDay('2026-09-12')).toMatch(/12/);
    expect(labels.fmtDay(null)).toBeNull();
  });

  it('names every one of the ten messages', () => {
    for (let id = 1; id <= 10; id++) {
      expect(labels.scamLabel(id)).not.toMatch(/^Message /);
    }
    expect(labels.scamLabel(999)).toBe('Message 999');
  });
});
