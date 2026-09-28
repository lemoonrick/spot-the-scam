// Vite exposes any env var prefixed with VITE_ to the browser.
// These live in .env (git-ignored) locally, and in the host's dashboard
// in production.
const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// The app must work perfectly with NO database configured — during local
// dev, for anyone who clones the repo, and if the database is down.
// Measurement is a bonus; it is never a dependency.
export const isConfigured = Boolean(url && anonKey);

export const supabaseUrl = url;

/**
 * Headers that identify the project on a public request.
 *
 * Supabase has two styles of public key. The older one (starting
 * `eyJ…`) is itself a token, and was sent both as `apikey` and as
 * `Authorization: Bearer`. The newer one (starting `sb_publishable_…`)
 * is not a token at all, and a request that puts it in `Authorization`
 * is rejected as a malformed login. A newly created project may hand
 * out either, so send `Authorization` only when the key really is a
 * token. `apikey` is what identifies the project in both cases.
 */
export function publicHeaders(extra = {}) {
  const headers = { apikey: anonKey, ...extra };
  if (anonKey?.startsWith('eyJ')) headers.Authorization = `Bearer ${anonKey}`;
  return headers;
}

/**
 * Read one of the public aggregate views.
 *
 * This key is read-only now: writing goes through the submit-session
 * Edge Function instead. It cannot touch the sessions or answers tables
 * at all. These views expose only counts and averages, which is what
 * makes a public dashboard possible without exposing anyone's run.
 */
export async function restSelect(view, query = 'select=*') {
  const res = await fetch(`${url}/rest/v1/${view}?${query}`, {
    headers: publicHeaders(),
  });
  if (!res.ok) throw new Error(`${view}: ${res.status} ${await res.text()}`);
  return res.json();
}
