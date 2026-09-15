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
read the key out of the uploaded files; that is expected, and Row Level
Security is what makes it safe. The key can only add a quiz result. It
cannot read, change or delete anything.

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
