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

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let ticket = null;
let pending = null;

/**
 * Ask for a ticket. Called when the first question appears, so by the
 * time anyone finishes it is comfortably older than the minimum.
 *
 * Failure is quiet: the quiz must never depend on this. A player with
 * no ticket simply has their result declined at the end, which costs
 * one record and nothing else.
 */
export function requestTicket() {
  if (!url || !anonKey || ticket || pending) return;

  pending = fetch(`${url}/functions/v1/submit-session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${anonKey}`,
      apikey: anonKey,
    },
    body: JSON.stringify({ action: 'start' }),
  })
    .then((r) => (r.ok ? r.json() : null))
    .then((data) => {
      ticket = data?.ticket ?? null;
    })
    .catch(() => {
      ticket = null;
    })
    .finally(() => {
      pending = null;
    });
}

/** Wait for any in-flight request, then hand over whatever we have. */
export async function getTicket() {
  if (pending) await pending;
  return ticket;
}

/** A ticket works once, so a replay needs a fresh one. */
export function clearTicket() {
  ticket = null;
}
