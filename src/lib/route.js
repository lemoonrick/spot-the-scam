// ============================================================
//  Which page to show
//
//  Three destinations do not justify a router and the kilobytes it
//  costs, so a plain path check decides, once per page load.
//
//  Two spellings are accepted for each page, so the app works wherever
//  it is hosted:
//    /impact     needs the server to send unknown paths to index.html
//                (.htaccess on Apache, vercel.json on Vercel)
//    #/impact    needs nothing at all, so it still works if a host
//                ignores .htaccess or rewrites cannot be enabled
//
//  A workshop room is not a page: it is `?room=CODE` on the quiz.
// ============================================================

const PAGES = ['impact', 'admin'];

/**
 * @param {{ pathname: string, hash: string }} location
 * @param {string} base  the app's folder, e.g. "/spot-the-scam/"
 * @returns {'quiz' | 'impact' | 'admin'}
 */
export function routeFor(location, base = '/') {
  const hash = location.hash.replace(/^#\/?/, '').replace(/\/$/, '');
  if (PAGES.includes(hash)) return hash;

  const root = base.replace(/\/$/, '');
  const path = location.pathname.replace(/\/$/, '');
  for (const page of PAGES) {
    if (path === `${root}/${page}`) return page;
  }
  return 'quiz';
}
