import { isConfigured } from './supabase';
import { getTurnstileToken } from './turnstile';
import { clearTicket, getTicket, requestTicket } from './ticket';

const FUNCTION_NAME = 'submit-session';

/**
 * Hand a finished quiz to the server.
 *
 * The browser reports only what it observed: which message, what the
 * player picked, which half it was in, how long they took. It does not
 * send a score. The server marks each answer against its own answer key
 * and works out every figure itself, so nothing on /impact rests on a
 * number the browser supplied.
 *
 * Anonymous as before: no name, no email, no account. The server sees
 * the IP address any web request carries, and uses a salted one-way
 * hash of it purely to count requests. The address is never stored and
 * is never attached to a result.
 *
 * Never throws and never blocks the UI. If saving fails the player
 * still sees their full results.
 */
export async function saveSession(summary, results = []) {
  if (!isConfigured) return { saved: false, reason: 'not-configured' };

  const url = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  try {
    const [turnstileToken, ticket] = await Promise.all([
      getTurnstileToken(),
      getTicket(),
    ]);

    const res = await fetch(`${url}/functions/v1/${FUNCTION_NAME}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Identifies the project. The function does the real checking.
        Authorization: `Bearer ${anonKey}`,
        apikey: anonKey,
      },
      body: JSON.stringify({
        ticket,
        turnstileToken,
        personalised: Boolean(summary.personalised),
        device: summary.device,
        language: summary.language,
        answers: results.map((r) => ({
          scamId: r.scamId,
          round: r.round,
          chosen: r.verdictChosen,
          responseMs: r.responseMs,
        })),
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.warn('[spot-the-scam] session not saved:', res.status, body);
      return { saved: false, reason: body };
    }
    // Spent. A second run needs a new one.
    clearTicket();
    requestTicket();
    return { saved: true };
  } catch (err) {
    // Offline, DNS failure, blocked by an extension.
    console.warn('[spot-the-scam] session not saved:', err.message);
    return { saved: false, reason: err.message };
  }
}
