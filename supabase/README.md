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
| `008_modes_and_rooms.sql` | Workshop rooms; which mode and room each play was in; the order each question was shown |
| `009_admin_and_rules.sql` | Every play must be `normal` or `workshop`; the admin list; only the admin can read plays or manage rooms |
| `010_new_views.sql` | The public summary, the per-question figures, and the admin's room reports |

Each should answer **"Success. No rows returned."** If one shows a red
error, stop there — later files depend on earlier ones.

**On a project that is already live,** `009` must wait until the
updated `submit-session` function is deployed (it requires every play to
say which mode it was in, which the old function doesn't), and it refuses
to run while plays from before the change are still stored. On a new
project, run them all in order and deploy the function afterwards.

### Making yourself the admin

1. **Authentication → Users → Add user → Create new user.** Your email, a
   strong password, *Auto Confirm User* on. Keep the password to
   yourself.
2. Run, with that email:
   ```sql
   insert into public.admins (user_id)
   select id from auth.users where email = 'you@company.org'
   on conflict do nothing;
   ```
3. Run [`checks/admin_access.sql`](checks/admin_access.sql). It pretends to
   be you and then a stranger with an account, and shows what each can
   see. You should see real numbers; the stranger should see zeros.

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
