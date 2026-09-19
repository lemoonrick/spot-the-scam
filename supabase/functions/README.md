# Turning off direct database writes

Do these in order. Running migration 006 first breaks saving, because
the function it hands over to would not exist yet.

**No Cloudflare account is needed.** Abuse is held off with four things
the app and the database do between themselves:

| | |
|---|---|
| A ticket | Issued when a quiz starts, usable exactly once. No ticket, no result. |
| A minimum age | Nobody reads ten messages in twenty seconds. |
| Timing checks | The reported times have to describe a person. |
| A rate limit | Per address, on both starting and submitting. |

None is impressive alone. Together they turn a one-line flood script
into real work for no reward, which for a quiz with nothing to steal is
the right amount of defence.

Turnstile is still supported if you ever get a Cloudflare account: set
`TURNSTILE_SECRET_KEY` and `VITE_TURNSTILE_SITE_KEY` and it is enforced
as an extra layer. Leave them unset and everything above still applies.

## 1. Install the Supabase CLI and link the project

```
npm install -g supabase
supabase login
supabase link --project-ref <your-project-ref>
```

The project ref is the part of your Supabase URL before `.supabase.co`.

## 2. Give the function its secret

```
supabase secrets set IP_HASH_SALT=$(openssl rand -hex 32)
```

`IP_HASH_SALT` is what makes the stored fingerprints irreversible. Any
long random string works; generate it once and leave it alone. Changing
it just resets the rate-limit counters.

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are provided
automatically. Do not set them yourself, and never put the service role
key in `.env`.

## 3. Create the tickets table

In the SQL Editor, run `supabase/007_session_tickets.sql`.

## 4. Deploy the function

```
supabase functions deploy submit-session
```

Check it is alive. Asking for a ticket should work:

```
curl -s -X POST \
  "https://<project-ref>.supabase.co/functions/v1/submit-session" \
  -H "apikey: <your anon key>" \
  -H "content-type: application/json" \
  -d '{"action":"start"}'
```

Expect a ticket id back. Then check a result with no ticket is refused:

```
curl -i -X POST \
  "https://<project-ref>.supabase.co/functions/v1/submit-session" \
  -H "apikey: <your anon key>" \
  -H "content-type: application/json" \
  -d '{"answers":[]}'
```

Expect `400` and "Missing ticket".

## 5. Rebuild and upload the site

```
npm run build
```

Upload the contents of `dist/` as usual.

## 6. Close the old door

Only now, in the SQL Editor, run `supabase/006_close_direct_writes.sql`.

After this the public key cannot write to `sessions` or
`session_answers` at all. Play one round and confirm a new row appears.

## 7. Housekeeping (optional)

Rate-limit rows and spent tickets expire on their own but are not
deleted automatically. Either run this occasionally:

```sql
select public.prune_rate_limits();
select public.prune_session_tickets();
```

or add it as a scheduled job under Database → Cron.

## If saving stops working

Check the function's logs under Edge Functions → submit-session → Logs.

| What you see | What it means |
|---|---|
| `400` Missing ticket | The browser never got one. Check `007` was run and the function can reach `session_tickets`. |
| `409` cannot be submitted again | The ticket was already spent, or is over six hours old. Normal if someone leaves a tab open all day. |
| `422` too quick | The minimum time or the timing checks rejected it. Expected when clicking through without reading; a real player will not see it. |
| `429` | The rate limit is doing its job: 20 results and 40 starts an hour per address. Raise the constants in the function if a large workshop shares one connection. |
| `401` before reaching the function | The anon key in `.env` is wrong. |
