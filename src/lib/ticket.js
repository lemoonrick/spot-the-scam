// ============================================================
//  Quiz ticket
//
//  The server hands out a ticket when a quiz begins and accepts a
//  result only if it comes with an unused one that is at least twenty
//  seconds old. This replaces the third-party bot check: without a
//  Cloudflare account we cannot ask "are you a robot", so we ask
//  something a script finds almost as annoying, namely "did you
//  actually start a quiz, and did it take you a human amount of time".
//
//  Held in memory only, like everything else here. Nothing is written
//  to the device.
// ============================================================

import { isConfigured, publicHeaders, supabaseUrl } from './supabase';

let ticket = null;
let pending = null;

/**
 * Ask for a ticket. Called when the first question appears, so by the
 * time anyone finishes it is comfortably older than the minimum.
 *
 * In a workshop, pass the room's code: the server notes the room on the
 * ticket, and that — not anything sent with the result — is what files
 * the play under the workshop.
 *
 * Resolves to the ticket, or null. Failure is quiet in the public quiz,
 * where a player with no ticket simply has their result declined at the
 * end. A workshop shows a notice instead, because there a lost result is
 * a missing participant in the facilitator's report.
 */
export function requestTicket({ room = null } = {}) {
  if (!isConfigured) return Promise.resolve(null);
  if (ticket) return Promise.resolve(ticket);
  if (pending) return pending;

  pending = fetch(`${supabaseUrl}/functions/v1/submit-session`, {
    method: 'POST',
    headers: publicHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(room ? { action: 'start', room } : { action: 'start' }),
  })
    .then((r) => (r.ok ? r.json() : null))
    .then((data) => {
      ticket = data?.ticket ?? null;
      return ticket;
    })
    .catch(() => {
      ticket = null;
      return null;
    })
    .finally(() => {
      pending = null;
    });
  return pending;
}

/** Wait for any in-flight request, then hand over whatever we have. */
export async function getTicket() {
  if (pending) await pending;
  return ticket;
}

/**
 * Forget the current ticket.
 *
 * Pass the ticket a save actually sent, and only that one is forgotten.
 * A save can still be finishing after the player has pressed Try Again
 * and the next run has fetched its own ticket; without this, the old
 * save would wipe the new run's ticket and that run would not be saved.
 */
export function clearTicket(which) {
  if (which !== undefined && which !== ticket) return;
  ticket = null;
}
