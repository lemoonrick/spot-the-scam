// ============================================================
//  Cloudflare Turnstile
//
//  A bot check that runs invisibly for nearly everyone. It exists so a
//  script cannot fill the public figures with invented results.
//
//  The widget is loaded only when a quiz is actually finished, so the
//  script is never fetched by someone who just opens the page.
// ============================================================

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY;
const SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

export const turnstileConfigured = Boolean(SITE_KEY);

let loader = null;

function loadScript() {
  if (loader) return loader;
  loader = new Promise((resolve, reject) => {
    if (window.turnstile) return resolve(window.turnstile);
    const el = document.createElement('script');
    el.src = SRC;
    el.async = true;
    el.onload = () => resolve(window.turnstile);
    el.onerror = () => reject(new Error('Turnstile failed to load'));
    document.head.appendChild(el);
  });
  return loader;
}

/**
 * Resolve to a token, or null if one cannot be obtained.
 *
 * Never throws and never blocks the results screen. If the check cannot
 * run, the server refuses the result: losing one record is a fair price
 * for not leaving the door open.
 */
export async function getTurnstileToken({ timeoutMs = 12000 } = {}) {
  if (!SITE_KEY) return null;

  try {
    const turnstile = await loadScript();
    if (!turnstile) return null;

    // Rendered off-screen. Turnstile shows an interactive challenge only
    // for traffic it finds suspicious; most people see nothing at all.
    const host = document.createElement('div');
    host.style.cssText =
      'position:fixed;left:-9999px;top:-9999px;width:300px;height:65px;';
    document.body.appendChild(host);

    const token = await new Promise((resolve) => {
      const done = (value) => {
        clearTimeout(timer);
        resolve(value);
      };
      const timer = setTimeout(() => done(null), timeoutMs);

      try {
        turnstile.render(host, {
          sitekey: SITE_KEY,
          callback: done,
          'error-callback': () => done(null),
          'timeout-callback': () => done(null),
        });
      } catch {
        done(null);
      }
    });

    host.remove();
    return token;
  } catch {
    return null;
  }
}
