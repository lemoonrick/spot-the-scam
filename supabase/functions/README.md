# Turning off direct database writes

Do these in order. Running the migration first breaks saving, because
the function it hands over to would not exist yet.

## 1. Get a Turnstile widget

At `dash.cloudflare.com` → Turnstile → Add widget.

- Domain: `myfactree.org`
- Mode: Managed

You get two keys. The **site key** is public and goes in `.env`:

```
VITE_TURNSTILE_SITE_KEY=0x4AAAA...
```

The **secret key** never goes near the frontend. It goes to the function
in step 3.

## 2. Install the Supabase CLI and link the project

```
npm install -g supabase
supabase login
supabase link --project-ref <your-project-ref>
```

The project ref is the part of your Supabase URL before `.supabase.co`.

## 3. Give the function its secrets

```
supabase secrets set TURNSTILE_SECRET_KEY=<the secret key from step 1>
supabase secrets set IP_HASH_SALT=$(openssl rand -hex 32)
```

`IP_HASH_SALT` is what makes the stored fingerprints irreversible. Any
long random string works; generate it once and leave it alone. Changing
it just resets the rate-limit counters.

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are provided
automatically. Do not set them yourself, and never put the service role
key in `.env`.

## 4. Deploy the function

```
supabase functions deploy submit-session
```

Check it is alive. A request with no bot token should be refused, which
is the correct answer:

```
curl -i -X POST \
  "https://<project-ref>.supabase.co/functions/v1/submit-session" \
  -H "apikey: <your anon key>" \
  -H "content-type: application/json" \
  -d '{"answers":[]}'
```

Expect `403` and "Could not verify this came from a browser". A `503`
means `TURNSTILE_SECRET_KEY` did not get set.

## 5. Rebuild and upload the site

The site key is compiled into the JavaScript, so the frontend must be
rebuilt after step 1.

```
npm run build
```

Upload the contents of `dist/` as usual.

## 6. Close the old door

Only now, in the SQL Editor, run `supabase/006_close_direct_writes.sql`.

After this the public key cannot write to `sessions` or
`session_answers` at all. Play one round and confirm a new row appears.

## 7. Housekeeping (optional)

Rate-limit rows expire on their own but are not deleted automatically.
Either run this occasionally:

```sql
select public.prune_rate_limits();
```

or add it as a scheduled job under Database → Cron.

## If saving stops working

Check the function's logs under Edge Functions → submit-session → Logs.

| What you see | What it means |
|---|---|
| `403` for everyone | Site key and secret key are from different widgets |
| `503` | `TURNSTILE_SECRET_KEY` is not set |
| `429` | The rate limit is doing its job; 20 per hour per address |
| `401` before reaching the function | The anon key in `.env` is wrong |
