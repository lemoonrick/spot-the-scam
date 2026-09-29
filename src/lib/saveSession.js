import { isConfigured, publicHeaders, supabaseUrl } from './supabase';
import { getTurnstileToken } from './turnstile';
import { clearTicket, getTicket } from './ticket';

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

  try {
    const [turnstileToken, ticket] = await Promise.all([
      getTurnstileToken(),
      getTicket(),
    ]);

    const res = await fetch(`${supabaseUrl}/functions/v1/${FUNCTION_NAME}`, {
      method: 'POST',
      // Identifies the project. The function does the real checking.
      headers: publicHeaders({ 'Content-Type': 'application/json' }),
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

    // Any answer from the server means the ticket has been dealt with.
    // It is redeemed before the answers are checked, so a refusal such
    // as "too quick" has spent it too. Keeping it would make the next
    // play from this tab fail with "cannot be submitted again".
    //
    // No replacement is fetched here. The next run asks for its own
    // when it starts, so every ticket stands for a run that began; a
    // spare fetched now would count as a start that never happened.
    clearTicket(ticket);

    if (!res.ok) {
      const body = await res.text();
      console.warn('[spot-the-scam] session not saved:', res.status, body);
      return { saved: false, reason: body };
    }
    return { saved: true };
  } catch (err) {
    // Offline, DNS failure, blocked by an extension.
    console.warn('[spot-the-scam] session not saved:', err.message);
    return { saved: false, reason: err.message };
  }
}
