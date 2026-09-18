// ============================================================
//  submit-session
//
//  The only way a quiz result reaches the database.
//
//  Browsers used to write straight to Postgres with the public key.
//  That key could only insert, never read or delete, but nothing stopped
//  it inserting a million times, and the endpoint accepts arrays, so one
//  request could carry thousands of rows. A scripted flood would have
//  made the public /impact page worthless.
//
//  Now the browser sends only what it observed: which message, what the
//  player chose, how long they took. This function decides everything
//  else. It checks a bot token, rate-limits by a hashed IP, marks each
//  answer right or wrong against its own copy of the answer key, and
//  works out the scores itself. Nothing the browser claims about its
//  score is trusted, because the browser no longer sends one.
// ============================================================

import { createClient } from 'jsr:@supabase/supabase-js@2';

// ── The answer key. This is the trust anchor: right and wrong are
//    decided here, never by the caller. Adding a scam to src/scams.js
//    means adding it here too, or its answers are rejected.
const ANSWER_KEY: Record<number, { type: string; verdict: string }> = {
  1: { type: 'sms', verdict: 'phishing' },
  2: { type: 'sms', verdict: 'legitimate' },
  3: { type: 'email', verdict: 'phishing' },
  4: { type: 'email', verdict: 'legitimate' },
  5: { type: 'whatsapp', verdict: 'phishing' },
  6: { type: 'whatsapp', verdict: 'legitimate' },
  7: { type: 'instagram', verdict: 'phishing' },
  8: { type: 'popup', verdict: 'phishing' },
  9: { type: 'email', verdict: 'legitimate' },
  10: { type: 'upi', verdict: 'phishing' },
};

const EXPECTED_ANSWERS = 10;
const MAX_PER_IP_PER_HOUR = 20; // generous for a workshop, useless for a flood
const MAX_RESPONSE_MS = 30 * 60 * 1000;

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'content-type': 'application/json' },
  });

/**
 * A one-way fingerprint of the caller, salted with a server-only secret.
 * We never store the address itself, the salt never leaves the server,
 * and these rows are deleted after an hour. It exists to count requests,
 * not to recognise anybody.
 */
async function fingerprint(ip: string, salt: string) {
  const data = new TextEncoder().encode(`${ip}:${salt}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 32);
}

async function passesTurnstile(token: string, ip: string, secret: string) {
  const body = new FormData();
  body.append('secret', secret);
  body.append('response', token);
  if (ip) body.append('remoteip', ip);

  const res = await fetch(
    'https://challenges.cloudflare.com/turnstile/v0/siteverify',
    { method: 'POST', body },
  );
  if (!res.ok) return false;
  const out = await res.json();
  return out.success === true;
}

const pct = (n: number, d: number) => (d > 0 ? Math.round((n / d) * 100) : 0);

function median(nums: number[]) {
  if (!nums.length) return 0;
  const s = [...nums].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405);

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const TURNSTILE_SECRET = Deno.env.get('TURNSTILE_SECRET_KEY') ?? '';
  const IP_SALT = Deno.env.get('IP_HASH_SALT') ?? '';

  const ip =
    req.headers.get('cf-connecting-ip') ??
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    '';

  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return json({ error: 'Malformed request' }, 400);
  }

  // ── Bot check ───────────────────────────────────────────────
  // Refuse to run unprotected: a missing secret is a deployment
  // mistake, and failing open would quietly restore the old hole.
  if (!TURNSTILE_SECRET) {
    console.error('TURNSTILE_SECRET_KEY is not set');
    return json({ error: 'Not accepting results right now' }, 503);
  }
  if (!(await passesTurnstile(String(payload.turnstileToken ?? ''), ip, TURNSTILE_SECRET))) {
    return json({ error: 'Could not verify this came from a browser' }, 403);
  }

  const db = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false },
  });

  // ── Rate limit ──────────────────────────────────────────────
  if (ip && IP_SALT) {
    const who = await fingerprint(ip, IP_SALT);
    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const { count } = await db
      .from('rate_limits')
      .select('*', { count: 'exact', head: true })
      .eq('fingerprint', who)
      .gte('created_at', since);

    if ((count ?? 0) >= MAX_PER_IP_PER_HOUR) {
      return json({ error: 'Too many results from here. Try later.' }, 429);
    }
    await db.from('rate_limits').insert({ fingerprint: who });
  }

  // ── Validate what the browser observed ──────────────────────
  const answers = Array.isArray(payload.answers) ? payload.answers : [];
  if (answers.length !== EXPECTED_ANSWERS) {
    return json({ error: `Expected ${EXPECTED_ANSWERS} answers` }, 400);
  }

  const seen = new Set<number>();
  const clean = [];

  for (const a of answers) {
    const scamId = Number(a?.scamId);
    const key = ANSWER_KEY[scamId];
    if (!key) return json({ error: `Unknown message ${scamId}` }, 400);
    if (seen.has(scamId)) return json({ error: 'Duplicate message' }, 400);
    seen.add(scamId);

    const chosen = a?.chosen;
    if (chosen !== 'phishing' && chosen !== 'legitimate') {
      return json({ error: 'Invalid answer' }, 400);
    }

    const round = Number(a?.round);
    if (round !== 1 && round !== 2) return json({ error: 'Invalid round' }, 400);

    const ms = Number(a?.responseMs);
    const responseMs =
      Number.isFinite(ms) && ms >= 0 && ms <= MAX_RESPONSE_MS ? Math.round(ms) : null;

    clean.push({
      scam_id: scamId,
      scam_type: key.type,
      round,
      chosen,
      actual: key.verdict,
      // Decided here, against our own key. The caller does not get a say.
      correct: chosen === key.verdict,
      response_ms: responseMs,
    });
  }

  // ── Work out the scores ourselves ───────────────────────────
  const first = clean.filter((a) => a.round === 1);
  const second = clean.filter((a) => a.round === 2);
  const correct = clean.filter((a) => a.correct).length;

  const baseline = pct(first.filter((a) => a.correct).length, first.length);
  const trained = pct(second.filter((a) => a.correct).length, second.length);

  const byType: Record<string, { type: string; seen: number; correct: number }> = {};
  for (const a of clean) {
    const t = (byType[a.scam_type] ??= { type: a.scam_type, seen: 0, correct: 0 });
    t.seen += 1;
    if (a.correct) t.correct += 1;
  }
  const typeBreakdown = Object.values(byType).map((t) => ({
    ...t,
    accuracy: pct(t.correct, t.seen),
  }));
  const missed = typeBreakdown
    .filter((t) => t.accuracy < 100)
    .sort((a, b) => a.accuracy - b.accuracy);

  const sessionId = crypto.randomUUID();

  const { error: sessionError } = await db.from('sessions').insert({
    id: sessionId,
    schema_version: 2,
    score: pct(correct, clean.length),
    correct,
    total: clean.length,
    baseline_score: baseline,
    trained_score: trained,
    improvement: trained - baseline,
    median_response_ms_baseline: median(
      first.map((a) => a.response_ms ?? 0).filter(Boolean),
    ),
    median_response_ms_trained: median(
      second.map((a) => a.response_ms ?? 0).filter(Boolean),
    ),
    total_time_ms: clean.reduce((sum, a) => sum + (a.response_ms ?? 0), 0),
    scams_waved_through: clean.filter(
      (a) => !a.correct && a.actual === 'phishing',
    ).length,
    weakest_type: missed[0]?.type ?? null,
    type_breakdown: typeBreakdown,
    personalised: payload.personalised === true,
    device: payload.device === 'mobile' ? 'mobile' : 'desktop',
    language: String(payload.language ?? '').slice(0, 20) || 'unknown',
  });

  if (sessionError) {
    console.error('session insert failed', sessionError.message);
    return json({ error: 'Could not save' }, 500);
  }

  const { error: answersError } = await db
    .from('session_answers')
    .insert(clean.map((a) => ({ ...a, session_id: sessionId })));

  if (answersError) {
    // The summary is the record that matters; a run counted without its
    // detail beats a run lost entirely.
    console.error('answers insert failed', answersError.message);
  }

  return json({ saved: true });
});
