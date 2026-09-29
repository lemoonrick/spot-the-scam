# The database

Everything the quiz stores lives in one Supabase project. These files
build it. Each is plain SQL: open it, copy it, paste it into Supabase →
**SQL Editor** → **Run**. Every file is safe to run twice.

## Setting up a new project

Run them in number order:

| File | What it does |
|---|---|
| `001_schema.sql` | The `sessions` table: one row per finished play |
| `002_add_personalised.sql` | Whether the player gave a name (the name itself is never stored) |
| `003_impact_views.sql` | The summary figures behind `/impact` |
| `004_session_answers.sql` | One row per question answered |
| `005_answer_views.sql` | Per-question figures |
| `006_close_direct_writes.sql` | Stops browsers writing to the tables directly; adds rate limiting |
| `007_session_tickets.sql` | One-time tickets, handed out when a quiz starts |

Each should answer **"Success. No rows returned."** If one shows a red
error, stop there — later files depend on earlier ones.

Then deploy the function that saves results: see
[`functions/README.md`](functions/README.md).

### About the "run 007 before 006" note

`007` says to run it before `006`. That applied once, to the original
project, which was taking live traffic while it was upgraded: closing
direct writes before the ticket system existed would have stopped saving.
On a brand-new project nothing is being saved yet, so number order is
correct.

## Checking it worked

From outside, with the public key, the tables must give nothing away and
refuse writes. Replace the two placeholders:

```bash
# Tables: must print [] (hidden), never real rows
curl -s "https://<ref>.supabase.co/rest/v1/sessions?select=*" -H "apikey: <public key>"

# Writing: must print 401 or 403
curl -s -o /dev/null -w "%{http_code}\n" -X POST \
  "https://<ref>.supabase.co/rest/v1/sessions" \
  -H "apikey: <public key>" -H "Content-Type: application/json" -d '{}'
```

## Starting again with no data

Removes every play but keeps the structure:

```sql
TRUNCATE public.session_answers, public.sessions,
         public.session_tickets, public.rate_limits
RESTART IDENTITY CASCADE;
```
