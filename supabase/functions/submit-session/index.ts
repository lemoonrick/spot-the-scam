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
//  else. It marks each answer right or wrong against its own copy of the
//  answer key and works out the scores itself. Nothing the browser
//  claims about its score is trusted, because the browser no longer
//  sends one.
//
//  ABUSE CONTROL, WITHOUT A THIRD-PARTY BOT CHECK
//  There is no Cloudflare account available, so four cheaper things are
//  layered instead. None is impressive alone; together they turn a
//  one-line flood script into real work for no reward.
//
//    1. A ticket, issued when a quiz starts and usable exactly once.
//       No ticket, no result.
//    2. A minimum age on that ticket. Nobody reads ten messages in
//       twenty seconds, so a result arriving sooner is not a person.
//    3. Plausibility checks on the timings the browser reports.
//    4. A rate limit per address, on both issuing and submitting.
//
//  Turnstile is still supported and still checked when its secret is
//  set, so this can be tightened later without code changes. It is no
//  longer required, which means the function must NOT fail closed on a
//  missing secret the way it did before.
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
const MAX_TICKETS_PER_IP_PER_HOUR = 40; // a couple of restarts is normal
const MAX_RESPONSE_MS = 30 * 60 * 1000;

// Nobody reads ten messages, weighs each one and steps through the
// explanations in less than this. A workshop rushing through still
// takes minutes.
const MIN_QUIZ_SECONDS = 20;
const MAX_TICKET_AGE_HOURS = 6;

// The fastest a person can plausibly judge a message they actually
// read. Anything quicker across the whole quiz is a script.
const MIN_PLAUSIBLE_TOTAL_MS = 8000;

// Every header the browser actually sends has to be listed here, or the
// preflight fails and the real request is never made. The client sends
// apikey and authorization to identify the project, so both belong in
// this list; leaving them out blocked every save from a browser while
// curl, which skips preflight entirely, kept working fine.
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
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

/**
 * Count recent requests of one kind from one caller, and record this
 * one. Returns true when the caller is over the limit.
 */
async function overLimit(
  db: any,
  who: string,
  kind: string,
  max: number,
) {
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count, error } = await db
    .from('rate_limits')
    .select('*', { count: 'exact', head: true })
    .eq('fingerprint', `${kind}:${who}`)
    .gte('created_at', since);

  // A missing or unreadable table would otherwise turn rate limiting
  // off without a word, which is the worst way for a protection to
  // fail. Say so loudly in the logs. We still let the request through:
  // tickets and the timing checks are the real gate, and refusing every
  // result because a counter is broken would be worse.
  if (error) {
    console.error(
      `rate limiting is NOT active: ${error.message}. ` +
        'Has 006_close_direct_writes.sql been run? It creates rate_limits.',
    );
    return false;
  }

  if ((count ?? 0) >= max) return true;

  const { error: writeError } = await db
    .from('rate_limits')
    .insert({ fingerprint: `${kind}:${who}` });
  if (writeError) {
    console.error(`rate limit counter not recorded: ${writeError.message}`);
  }
  return false;
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

  const db = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false },
  });

  const who = ip && IP_SALT ? await fingerprint(ip, IP_SALT) : '';

  // ── Handing out a ticket at the start of a quiz ──────────────
  if (payload.action === 'start') {
    if (who && (await overLimit(db, who, 'start', MAX_TICKETS_PER_IP_PER_HOUR))) {
      return json({ error: 'Too many quizzes started from here.' }, 429);
    }
    const { data, error } = await db
      .from('session_tickets')
      .insert({})
      .select('id')
      .single();

    if (error) {
      console.error('could not issue ticket', error.message);
      return json({ error: 'Could not start' }, 500);
    }
    return json({ ticket: data.id });
  }

  // ── Optional bot check ───────────────────────────────────────
  // Only enforced where a secret is configured. It is a bonus layer,
  // not the foundation, so a missing secret must not fail closed.
  if (TURNSTILE_SECRET) {
    const ok = await passesTurnstile(
      String(payload.turnstileToken ?? ''),
      ip,
      TURNSTILE_SECRET,
    );
    if (!ok) {
      return json({ error: 'Could not verify this came from a browser' }, 403);
    }
  }

  // ── Rate limit ──────────────────────────────────────────────
  if (who && (await overLimit(db, who, 'submit', MAX_PER_IP_PER_HOUR))) {
    return json({ error: 'Too many results from here. Try later.' }, 429);
  }

  // ── Redeem the ticket ───────────────────────────────────────
  // Marking it used and checking it was unused happen in one statement,
  // so two requests racing with the same ticket cannot both win.
  const ticket = String(payload.ticket ?? '');
  if (!ticket) return json({ error: 'Missing ticket' }, 400);

  const cutoff = new Date(
    Date.now() - MAX_TICKET_AGE_HOURS * 60 * 60 * 1000,
  ).toISOString();

  const { data: redeemed, error: redeemError } = await db
    .from('session_tickets')
    .update({ used_at: new Date().toISOString() })
    .eq('id', ticket)
    .is('used_at', null)
    .gte('created_at', cutoff)
    .select('created_at')
    .maybeSingle();

  if (redeemError) {
    console.error('ticket redeem failed', redeemError.message);
    return json({ error: 'Could not save' }, 500);
  }
  if (!redeemed) {
    // Unknown, already spent, or too old.
    return json({ error: 'This quiz cannot be submitted again' }, 409);
  }

  // A quiz that finished impossibly soon after it started was not read.
  const startedSecondsAgo =
    (Date.now() - new Date(redeemed.created_at).getTime()) / 1000;
  if (startedSecondsAgo < MIN_QUIZ_SECONDS) {
    return json({ error: 'That was too quick to be a real attempt' }, 422);
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

  // ── Do the reported timings describe a person? ──────────────
  const totalMs = clean.reduce((sum, a) => sum + (a.response_ms ?? 0), 0);
  if (totalMs < MIN_PLAUSIBLE_TOTAL_MS) {
    return json({ error: 'That was too quick to be a real attempt' }, 422);
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
    total_time_ms: totalMs,
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
