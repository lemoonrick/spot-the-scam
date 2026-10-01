// ============================================================
//  Admin login
//
//  Email and password, straight against Supabase's login service with
//  plain fetch — the same style as the rest of the app, and no login
//  library to download. The admin is the only person who logs in.
//
//  The session is kept in sessionStorage: this tab only, gone when it
//  closes. That is the one piece of browser storage in the whole app,
//  and it belongs to the admin, never to a player.
//
//  Logging in proves who you are; it does not make you an admin. The
//  database checks the admins list on every request (009), so a login
//  that isn't on the list sees nothing. This file checks the list too,
//  but only to say "Not an admin account" instead of showing empty
//  pages.
// ============================================================

import { publicHeaders, supabaseUrl } from '../lib/supabase';

const KEY = 'spot-the-scam-admin';
// Refresh a little before the token runs out, not after.
const REFRESH_MARGIN_S = 60;

let session = read();
let refreshing = null;

function read() {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function write(next) {
  session = next;
  try {
    if (next) sessionStorage.setItem(KEY, JSON.stringify(next));
    else sessionStorage.removeItem(KEY);
  } catch {
    // Private browsing can refuse storage. The login still works for
    // this page; it just won't survive a refresh.
  }
}

/** Shape what the login service returns into what we keep. */
function fromTokenResponse(t) {
  return {
    accessToken: t.access_token,
    refreshToken: t.refresh_token,
    // Seconds since 1970. Worked out locally if the service didn't say.
    expiresAt: t.expires_at ?? Math.floor(Date.now() / 1000) + (t.expires_in ?? 3600),
    email: t.user?.email ?? null,
  };
}

async function tokenRequest(grant, body) {
  const res = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=${grant}`, {
    method: 'POST',
    headers: publicHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

/** Is this login on the admins list? Asked of the database itself. */
async function checkIsAdmin(accessToken) {
  const res = await fetch(`${supabaseUrl}/rest/v1/rpc/is_admin`, {
    method: 'POST',
    headers: {
      ...publicHeaders({ 'Content-Type': 'application/json' }),
      Authorization: `Bearer ${accessToken}`,
    },
    body: '{}',
  });
  return res.ok && (await res.json()) === true;
}

/**
 * Log in. Resolves to { ok: true } or { ok: false, reason } with a
 * message fit to show on the login screen.
 */
export async function logIn(email, password) {
  let result;
  try {
    result = await tokenRequest('password', { email, password });
  } catch {
    return { ok: false, reason: "Couldn't reach the server. Check your connection." };
  }
  if (!result.ok) {
    // The service says the same thing for a wrong email and a wrong
    // password, and so do we, so this screen can't be used to find out
    // which emails have accounts.
    return { ok: false, reason: 'That email and password don’t match.' };
  }

  const next = fromTokenResponse(result.data);
  if (!(await checkIsAdmin(next.accessToken))) {
    await revoke(next.accessToken);
    return { ok: false, reason: 'This account isn’t an admin.' };
  }
  write(next);
  return { ok: true };
}

async function revoke(accessToken) {
  try {
    await fetch(`${supabaseUrl}/auth/v1/logout`, {
      method: 'POST',
      headers: { ...publicHeaders(), Authorization: `Bearer ${accessToken}` },
    });
  } catch {
    // Offline: the token still expires on its own within the hour.
  }
}

export async function logOut() {
  const current = session;
  write(null);
  if (current) await revoke(current.accessToken);
}

export const currentEmail = () => session?.email ?? null;
export const isLoggedIn = () => Boolean(session);

/**
 * Swap the refresh token for a new pair. One at a time: two requests
 * refreshing at once would each spend the same refresh token, and the
 * second would be refused.
 */
export function refresh() {
  if (!session) return Promise.resolve(false);
  refreshing ??= tokenRequest('refresh_token', { refresh_token: session.refreshToken })
    .then(({ ok, data }) => {
      if (!ok) {
        // Expired, or used by another tab. Back to the login screen.
        write(null);
        return false;
      }
      write({ ...fromTokenResponse(data), email: session?.email ?? data.user?.email });
      return true;
    })
    .catch(() => false)
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

/** A token good for the next minute at least, or null if logged out. */
export async function accessToken() {
  if (!session) return null;
  if (session.expiresAt - REFRESH_MARGIN_S <= Date.now() / 1000) {
    if (!(await refresh())) return null;
  }
  return session.accessToken;
}
