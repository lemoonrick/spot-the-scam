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

  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
}
