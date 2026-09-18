// Vite exposes any env var prefixed with VITE_ to the browser.
// These live in .env (git-ignored) locally, and in the host's dashboard
// in production.
const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// The app must work perfectly with NO database configured — during local
// dev, for anyone who clones the repo, and if the database is down.
// Measurement is a bonus; it is never a dependency.
export const isConfigured = Boolean(url && anonKey);

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
    headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
  });
  if (!res.ok) throw new Error(`${view}: ${res.status} ${await res.text()}`);
  return res.json();
}
