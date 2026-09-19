# Putting this on a web server

The app is a set of static files. There is no server to run, no Node on
the host, and no build step on the host: you build on your laptop and
upload the result.

## Hostinger, in a subfolder

Say the app should live at `https://myfactree.org/spot-the-scam/`.

**1. Say where it will live.** In `.env`:

```
VITE_BASE_PATH=/spot-the-scam/
```

Both slashes matter. This is the one setting people get wrong, and the
symptom is a blank page with missing-file errors.

**2. Build.**

```
npm run build
```

**3. Upload everything inside `dist/`** into the `spot-the-scam` folder on
the server. Upload the *contents*, not the `dist` folder itself.

**4. Check `.htaccess` actually arrived.** It starts with a dot, so
Hostinger's File Manager hides it by default: turn on "show hidden
files" and confirm it is there. Without it the quiz works but
`/spot-the-scam/impact` returns 404.

**5. Open the site.** The quiz at `/spot-the-scam/`, the dashboard at
`/spot-the-scam/impact`.

If the host will not honour `.htaccess`, the dashboard is also reachable
at `/spot-the-scam/#/impact`, which needs no server configuration at
all.

## Things worth knowing

**The Supabase keys are baked into the JavaScript at build time.** So
`.env` has to be filled in on the machine doing the build. Anyone can
read the key out of the uploaded files; that is expected.

What makes that safe is that the key now grants nothing at all. Browsers
used to write results straight into the database with it, which meant a
short script could have flooded the public figures with invented plays.
Those write permissions are gone. Results go to a checkpoint function
instead, which issues a one-time ticket at the start of a quiz, refuses
anything submitted impossibly fast, limits how much can arrive from one
place in an hour, and marks the answers against its own copy of the key
so the score cannot be misreported. The browser key can no longer read,
add, change or delete a single row.

**Changing the folder name means rebuilding.** The folder is written
into every asset path.

**Updating later:** rebuild, then re-upload the contents of `dist/`.
Delete the old `assets/` folder first so stale files do not pile up.

## A domain of its own

Leave `VITE_BASE_PATH` blank, build, and upload `dist/` to the web root.

## Vercel

Unchanged. `vercel.json` handles the routing there, and the keys go in
Settings → Environment Variables rather than `.env`. Remember that
environment variables only take effect on a fresh deploy.
