// ============================================================
//  What the admin pages ask the database
//
//  Every request carries the admin's own login, so the database's rules
//  (009) decide what comes back: everything for an admin, nothing for
//  anyone else. Nothing here is cached between logins.
// ============================================================

import { publicHeaders, supabaseUrl } from '../lib/supabase';
import { accessToken, refresh } from './auth';

export class LoggedOutError extends Error {}

async function request(path, { method = 'GET', body, prefer } = {}) {
  const send = async () => {
    const token = await accessToken();
    if (!token) throw new LoggedOutError('Logged out');
    return fetch(`${supabaseUrl}/rest/v1/${path}`, {
      method,
      headers: {
        ...publicHeaders({ 'Content-Type': 'application/json' }),
        Authorization: `Bearer ${token}`,
        ...(prefer ? { Prefer: prefer } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  };

  let res = await send();
  // A token can be refused just before it was due to run out — the
  // clock on this computer and the server's disagreeing, say. One
  // refresh and one retry, then give up.
  if (res.status === 401) {
    if (!(await refresh())) throw new LoggedOutError('Logged out');
    res = await send();
  }
  if (res.status === 401) throw new LoggedOutError('Logged out');
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`${method} ${path.split('?')[0]}: ${res.status} ${detail}`);
  }
  return res.status === 204 ? null : res.json();
}

/** Read a view or table. `query` is PostgREST's: "select=*&order=…" */
export const select = (view, query = 'select=*') => request(`${view}?${query}`);

/**
 * Create a room. The database chooses the code, so the new row is read
 * back to learn it.
 */
export async function createRoom(fields) {
  const [room] = await request('rooms', {
    method: 'POST',
    body: fields,
    prefer: 'return=representation',
  });
  return room;
}

export const updateRoom = (id, fields) =>
  request(`rooms?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: fields,
    prefer: 'return=minimal',
  });

/** Delete a room, and with it every play and ticket in it. */
export const deleteRoom = (id) =>
  request(`rooms?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE' });
