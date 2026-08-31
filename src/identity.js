// ============================================================
//  IDENTITY — a prop, not a record.
//
//  The name the player gives us exists for one reason: to make the
//  fake messages look like real ones, which very often use your name.
//
//  It lives in React state and nowhere else. It is never written to
//  localStorage, never sent to the database, never logged. Closing the
//  tab erases it. The only thing that reaches the database is a single
//  true/false: whether this run was personalised at all.
// ============================================================

export const EMPTY_IDENTITY = { name: '', email: '', personalised: false };

/** Trim, collapse whitespace, and cap length. Names are display-only. */
export function makeIdentity(rawName) {
  const name = String(rawName || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 32);

  if (!name) return EMPTY_IDENTITY;
  return { name, email: deriveEmail(name), personalised: true };
}

/**
 * Build a believable inbox address from the name, so the Gmail
 * simulations can show a recipient. We generate it rather than asking
 * for one: it is one less box to fill, and asking a person for their
 * email right before teaching them not to hand out their details
 * undercuts the lesson.
 */
export function deriveEmail(name) {
  const parts = name
    .toLowerCase()
    .replace(/[^a-z\s]/g, '')
    .split(' ')
    .filter(Boolean);

  if (!parts.length) return '';
  return `${parts.slice(0, 2).join('.').slice(0, 24)}@gmail.com`;
}

/**
 * Replace `{name|fallback}` and `{email|fallback}` tokens in scam copy.
 * The fallback keeps every message reading naturally for players who
 * skip the name screen, so no scam has to be written twice.
 */
export function fillTokens(text, identity) {
  if (typeof text !== 'string' || !text.includes('{')) return text;

  return text.replace(/\{(name|email)\|([^}]*)\}/g, (_, key, fallback) => {
    const value = identity?.[key];
    return value || fallback;
  });
}

/** Return a copy of a scam with its message text personalised. */
export function personalizeScam(scam, identity) {
  if (!identity?.personalised) {
    // Still run the tokens so fallbacks resolve.
    identity = EMPTY_IDENTITY;
  }

  return {
    ...scam,
    message: scam.message?.map((part) => ({
      ...part,
      text: fillTokens(part.text, identity),
    })),
  };
}
