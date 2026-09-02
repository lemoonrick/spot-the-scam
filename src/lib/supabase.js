// Vite exposes any env var prefixed with VITE_ to the browser.
// These live in .env (git-ignored) locally, and in Vercel's dashboard
// in production.
const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// The app must work perfectly with NO database configured — during local
// dev, for anyone who clones the repo, and if Supabase ever goes down.
// Measurement is a bonus; it is never a dependency.
export const isConfigured = Boolean(url && anonKey);

/**
 * Supabase puts a REST API in front of your database (PostgREST), so a
 * plain fetch is all an insert needs. We skip the official SDK on
 * purpose: it costs ~58KB gzipped, and this app is aimed at people on
 * slow rural connections. Every kilobyte is someone waiting.
 *
 * Resolves to { ok } or { ok: false, status, body }.
 */
export async function restInsert(table, row) {
  const res = await fetch(`${url}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal', // don't send the row back; we don't need it
    },
    body: JSON.stringify(row),
  });

  if (res.ok) return { ok: true };
  return { ok: false, status: res.status, body: await res.text() };
}

/**
 * Read one of the public aggregate views.
 *
 * The `sessions` table itself is unreadable with this key. These views
 * expose only counts and averages, which is what makes a public
 * dashboard possible without exposing anyone's run.
 */
export async function restSelect(view, query = 'select=*') {
  const res = await fetch(`${url}/rest/v1/${view}?${query}`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
  });
  if (!res.ok) throw new Error(`${view}: ${res.status} ${await res.text()}`);
  return res.json();
}

/**
 * Pull the offending column name out of a Postgres or PostgREST error.
 * Both name it, in different shapes:
 *   42703   column sessions.personalised does not exist
 *   PGRST204  Could not find the 'personalised' column of 'sessions' ...
 */
export function missingColumnFrom(body) {
  if (!body) return null;
  const quoted = body.match(/Could not find the '([a-z0-9_]+)' column/i);
  if (quoted) return quoted[1];
  const bare = body.match(/column [a-z0-9_]*\.?([a-z0-9_]+) does not exist/i);
  return bare ? bare[1] : null;
}
