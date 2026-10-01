// ============================================================
//  Workshop rooms, from the player's side
//
//  A room is how a facilitator groups one workshop's plays together.
//  Players reach one by scanning a QR code, opening a link, or typing a
//  six-character code. Nothing here identifies a player: a room code
//  says which workshop, never which person.
// ============================================================

import { isConfigured, publicHeaders, supabaseUrl } from './supabase';

// No vowels, so a code can never spell a word; none of 0 O 1 I L, so it
// can't be misread off a slide. Must match the database's
// new_room_code() and the server's ROOM_CODE_ALPHABET; a test checks.
export const ROOM_CODE_ALPHABET = 'BCDFGHJKMNPQRSTVWXYZ23456789';
const ROOM_CODE = new RegExp(`^[${ROOM_CODE_ALPHABET}]{6}$`);

/**
 * Tidy a code as typed — "kft r9m", "KFT-R9M" — into "KFTR9M", or null
 * if it can't be a real code.
 */
export function normaliseRoomCode(raw) {
  if (typeof raw !== 'string') return null;
  const code = raw.toUpperCase().replace(/[\s-]/g, '');
  return ROOM_CODE.test(code) ? code : null;
}

/**
 * Explain what's wrong with a half-typed code, or null if nothing is.
 * Shown as the player types, so a misread character is caught before
 * they press Join rather than after.
 */
export function roomCodeProblem(raw) {
  const code = String(raw ?? '').toUpperCase().replace(/[\s-]/g, '');
  if (!code) return null;
  if (/[O0]/.test(code)) return 'Codes never contain O or 0.';
  if (/[I1L]/.test(code)) return 'Codes never contain I, 1 or L.';
  if (/[AEU]/.test(code)) return 'Codes never contain vowels.';
  if (/[^A-Z0-9]/.test(code)) return 'Codes are letters and numbers only.';
  if (code.length > 6) return 'Codes are six characters.';
  return null;
}

/** The room code in a page address (`?room=KFTR9M`), tidied, or null. */
export function readRoomParam(search = window.location.search) {
  return normaliseRoomCode(new URLSearchParams(search).get('room'));
}

/**
 * Put the room in the address bar, or take it out, without reloading.
 * Keeping it there means a refresh — or a phone that discards the tab —
 * brings the player back into the same workshop.
 */
export function setRoomParam(code) {
  const url = new URL(window.location.href);
  if (code) url.searchParams.set('room', code);
  else url.searchParams.delete('room');
  window.history.replaceState(null, '', url);
}

/** The link a facilitator shares for a room. */
export function roomLink(code, origin = window.location.origin) {
  const base = import.meta.env.BASE_URL || '/';
  return `${origin}${base}?room=${encodeURIComponent(code)}`;
}

/**
 * Ask the server about a room code before joining.
 *
 * Resolves to one of:
 *   { status: 'ok',        room: { code, name } }
 *   { status: 'closed',    room: { code, name } }   ended, or past its time
 *   { status: 'not-found' }
 *   { status: 'offline' }                            couldn't ask at all
 *
 * Never throws. Asking issues no ticket, so someone who reads the room
 * name and wanders off is not counted as having started.
 */
export async function lookupRoom(code) {
  if (!isConfigured) return { status: 'offline' };
  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/submit-session`, {
      method: 'POST',
      headers: publicHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ action: 'room', room: code }),
    });
    const body = await res.json().catch(() => ({}));
    if (res.ok && body.room) return { status: 'ok', room: body.room };
    if (res.status === 410 && body.room) return { status: 'closed', room: body.room };
    if (res.status === 404) return { status: 'not-found' };
    return { status: 'offline' };
  } catch {
    return { status: 'offline' };
  }
}
