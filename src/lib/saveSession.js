import { isConfigured, publicHeaders, supabaseUrl } from './supabase';
import { getTurnstileToken } from './turnstile';
import { clearTicket, getTicket } from './ticket';

const FUNCTION_NAME = 'submit-session';
const RETRY_AFTER_MS = 3000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Hand a finished quiz to the server.
 *
 * The browser reports only what it observed: which message, what the
 * player picked and how long they took, in the order they were shown.
 * It does not send a score, which half a question was in, or which mode
 * it was playing — the server works all of that out, and reads the mode
 * and the workshop room from the ticket it issued at the start. Nothing
 * on /impact rests on a number the browser supplied.
 *
 * Anonymous as before: no name, no email, no account. The server sees
 * the IP address any web request carries, and uses a salted one-way
 * hash of it purely to count requests. The address is never stored and
 * is never attached to a result.
 *
 * Tries twice if the connection drops — a workshop on patchy Wi-Fi
 * should not lose a participant to one bad second. Never throws and
 * never blocks the UI. If saving fails the player still sees their full
 * results.
 *
 * @returns {Promise<{ saved: boolean, reason?: string }>}
 */
export async function saveSession(summary, results = [], { isRepeat = false } = {}) {
  if (!isConfigured) return { saved: false, reason: 'not-configured' };

  const [turnstileToken, ticket] = await Promise.all([
    getTurnstileToken(),
    getTicket(),
  ]);

  const body = JSON.stringify({
    ticket,
    turnstileToken,
    // "Play again myself": a label so workshop figures count first
    // attempts only. It changes nothing about how the play is scored.
    isRepeat,
    personalised: Boolean(summary.personalised),
    device: summary.device,
    language: summary.language,
    answers: results.map((r) => ({
      scamId: r.scamId,
      chosen: r.verdictChosen,
      responseMs: r.responseMs,
    })),
  });

  let firstGotNoReply = false;

  for (let attempt = 1; attempt <= 2; attempt++) {
    let res;
    try {
      res = await fetch(`${supabaseUrl}/functions/v1/${FUNCTION_NAME}`, {
        method: 'POST',
        // Identifies the project. The function does the real checking.
        headers: publicHeaders({ 'Content-Type': 'application/json' }),
        body,
      });
    } catch (err) {
      // Offline, DNS failure, blocked by an extension. No reply, so the
      // ticket may still be good: keep it and try once more.
      if (attempt === 1) {
        firstGotNoReply = true;
        await sleep(RETRY_AFTER_MS);
        continue;
      }
      console.warn('[spot-the-scam] session not saved:', err.message);
      return { saved: false, reason: err.message };
    }

    // Any answer from the server means the ticket has been dealt with.
    // It is redeemed before the answers are checked, so a refusal such
    // as "too quick" has spent it too. Keeping it would make the next
    // play from this tab fail with "cannot be submitted again".
    //
    // No replacement is fetched here. The next run asks for its own
    // when it starts, so every ticket stands for a run that began; a
    // spare fetched now would count as a start that never happened.
    clearTicket(ticket);

    if (res.ok) return { saved: true };

    // The first try got no reply, and now the ticket is already spent:
    // that first try almost certainly arrived, and its reply was what
    // got lost. Only then — after a server fault, "already spent" means
    // the fault came after the ticket was used, so nothing was saved.
    if (attempt === 2 && res.status === 409 && firstGotNoReply) {
      return { saved: true };
    }

    // A fault on the server's side may be passing. Anything else — too
    // quick, malformed, a room that has ended — will not change.
    if (attempt === 1 && res.status >= 500) {
      await sleep(RETRY_AFTER_MS);
      continue;
    }

    const reason = await res.text();
    console.warn('[spot-the-scam] session not saved:', res.status, reason);
    return { saved: false, reason };
  }
  return { saved: false, reason: 'gave up' };
}
