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
//  TWO MODES
//  The public quiz is "normal" mode: ten questions, a score, no halves.
//  Joining a workshop room makes it "workshop" mode: the same questions
//  split into a before and an after. Which mode a play is in is decided
//  when its ticket is issued and read back from that ticket when the
//  result arrives, never from the request, so a browser can't claim to
//  be in a workshop or slip a play into a room it never joined.
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
//    4. A limit on how much can arrive. For the public quiz that is per
//       address. A workshop room is thirty people behind one Wi-Fi
//       address, so rooms are limited by their own participant cap
//       instead — a per-address limit would refuse half the room.
//
//  Turnstile is still supported and still checked when its secret is
//  set, so this can be tightened later without code changes. It is no
//  longer required, which means the function must NOT fail closed on a
//  missing secret the way it did before.
// ============================================================

import { createClient } from 'jsr:@supabase/supabase-js@2';
// The answer key, the answer checks and every score calculation live in
// scoring.ts, which has no database or network code so the tests can run
// it directly. This file handles tickets, rooms, limits and saving.
import {
  CONTENT_VERSION,
  type Mode,
  normaliseRoomCode,
  summarise,
  validateAnswers,
} from './scoring.ts';

// Public quiz, per address. A teacher who shares the public link in a
// computer lab has thirty people on one address too, so these are set
// well above what one person could want, and far below a flood.
const MAX_PER_IP_PER_HOUR = 60;
const MAX_TICKETS_PER_IP_PER_HOUR = 120;

// Wrong room codes, per address. A room of thirty making the odd typo
// stays well under this; guessing one code in 480 million at this rate
// is hopeless.
const MAX_ROOM_MISSES_PER_IP_PER_HOUR = 60;

// Tickets a room may issue per participant place. Every refresh and
// restart takes a new ticket, so it needs headroom; past this, a link
// that leaked off a slide can't flood a room's report.
const ROOM_TICKET_HEADROOM = 3;

// Nobody reads ten messages, weighs each one and steps through the
// explanations in less than this. A workshop rushing through still
// takes minutes.
const MIN_QUIZ_SECONDS = 20;
const MAX_TICKET_AGE_HOURS = 6;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

type Room = {
  id: string;
  code: string;
  name: string;
  status: string;
  closes_at: string;
  max_participants: number;
};

/**
 * Look a room up by its code. Only the columns a player may learn are
 * fetched: a room's private notes never leave the database here.
 */
async function findRoom(db: any, code: string): Promise<Room | null> {
  const { data, error } = await db
    .from('rooms')
    .select('id, code, name, status, closes_at, max_participants')
    .eq('code', code)
    .maybeSingle();
  if (error) throw new Error(`room lookup failed: ${error.message}`);
  return data;
}

// Open, and not past its close time. Closing stops new joins only: a
// ticket issued while a room was open can still be handed in afterwards.
const isOpen = (room: Room) =>
  room.status === 'open' && Date.now() < new Date(room.closes_at).getTime();

const roomFor = (room: Room) => ({ code: room.code, name: room.name });

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

  /** A code that matched no room. Counted, so codes can't be guessed. */
  const noSuchRoom = async () => {
    if (who && (await overLimit(db, who, 'room-miss', MAX_ROOM_MISSES_PER_IP_PER_HOUR))) {
      return json({ error: 'Too many wrong codes from here. Try later.' }, 429);
    }
    return json({ error: 'No workshop with that code' }, 404);
  };

  const ended = (room: Room) =>
    json({ error: 'This workshop has ended', room: roomFor(room) }, 410);

  /** Look up the room a request names, or say why it can't be joined. */
  const joinable = async (raw: unknown) => {
    const code = normaliseRoomCode(raw);
    const room = code ? await findRoom(db, code) : null;
    if (!room) return { refusal: await noSuchRoom() };
    if (!isOpen(room)) return { refusal: ended(room) };
    return { room };
  };

  try {
    // ── Checking a room code before joining ─────────────────────
    // Tells the player "You're joining: Pune College Workshop", or that
    // it has ended. Issues nothing, so someone who reads the room name
    // and wanders off is not counted as having started.
    if (payload.action === 'room') {
      const { room, refusal } = await joinable(payload.room);
      return refusal ?? json({ room: roomFor(room!) });
    }

    // ── Handing out a ticket at the start of a quiz ──────────────
    if (payload.action === 'start') {
      let fields: { mode: Mode; room_id?: string } = { mode: 'normal' };
      let room: Room | null = null;

      if (payload.room) {
        const joined = await joinable(payload.room);
        if (joined.refusal) return joined.refusal;
        room = joined.room!;

        // No per-address limit here: a whole room shares one Wi-Fi
        // address. The room's own cap is its limit.
        const { count, error } = await db
          .from('session_tickets')
          .select('*', { count: 'exact', head: true })
          .eq('room_id', room.id);
        if (error) throw new Error(`room ticket count failed: ${error.message}`);
        if ((count ?? 0) >= room.max_participants * ROOM_TICKET_HEADROOM) {
          return json({ error: 'This workshop is full', room: roomFor(room) }, 429);
        }
        fields = { mode: 'workshop', room_id: room.id };
      } else if (
        who &&
        (await overLimit(db, who, 'start', MAX_TICKETS_PER_IP_PER_HOUR))
      ) {
        return json({ error: 'Too many quizzes started from here.' }, 429);
      }

      const { data, error } = await db
        .from('session_tickets')
        .insert(fields)
        .select('id')
        .single();

      if (error) {
        console.error('could not issue ticket', error.message);
        return json({ error: 'Could not start' }, 500);
      }
      return json({ ticket: data.id, room: room ? roomFor(room) : null });
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

    const ticket = String(payload.ticket ?? '');
    if (!UUID.test(ticket)) return json({ error: 'Missing ticket' }, 400);

    // ── Which kind of quiz was this? ────────────────────────────
    // From our own record of the ticket, never from the request. An
    // unknown ticket counts as the public quiz here, and is refused a
    // moment later when it can't be redeemed.
    const { data: ticketRow } = await db
      .from('session_tickets')
      .select('mode, room_id')
      .eq('id', ticket)
      .maybeSingle();
    const mode: Mode = ticketRow?.mode === 'workshop' ? 'workshop' : 'normal';

    // ── Rate limit ──────────────────────────────────────────────
    // Public quiz only. A room is limited by its cap when tickets are
    // issued, and every result needs one of those tickets.
    if (mode === 'normal' && who && (await overLimit(db, who, 'submit', MAX_PER_IP_PER_HOUR))) {
      return json({ error: 'Too many results from here. Try later.' }, 429);
    }

    // ── Redeem the ticket ───────────────────────────────────────
    // Marking it used and checking it was unused happen in one statement,
    // so two requests racing with the same ticket cannot both win.
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

    // ── Check and mark what the browser observed ────────────────
    // Includes the plausibility check on the reported timings.
    const checked = validateAnswers(payload.answers, mode);
    if (!checked.ok) return json({ error: checked.error }, checked.status);

    const sessionId = crypto.randomUUID();

    const { error: sessionError } = await db.from('sessions').insert({
      id: sessionId,
      schema_version: 3,
      mode,
      room_id: mode === 'workshop' ? ticketRow!.room_id : null,
      content_version: CONTENT_VERSION,
      // A label the player chose ("Play again myself"), used to count
      // first attempts. It decides nothing about scoring.
      is_repeat: payload.isRepeat === true,
      ...summarise(checked.clean, checked.totalMs, mode),
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
      .insert(checked.clean.map((a) => ({ ...a, session_id: sessionId })));

    if (answersError) {
      // The summary is the record that matters; a run counted without its
      // detail beats a run lost entirely.
      console.error('answers insert failed', answersError.message);
    }

    return json({ saved: true, mode });
  } catch (err) {
    console.error(err instanceof Error ? err.message : err);
    return json({ error: 'Something went wrong' }, 500);
  }
});
