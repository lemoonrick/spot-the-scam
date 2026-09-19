/**
 * Turn a snippet of HTML from the blog feed into plain text.
 *
 * WordPress returns titles and excerpts as HTML, entities and all
 * ("Don&#8217;t"). Those used to be injected with
 * dangerouslySetInnerHTML, which was safe only because the feed happens
 * to be our own site. Anything that ever changes about that, a
 * compromised WordPress or a swapped feed URL, would have turned into
 * script running on this page.
 */
export function htmlToText(html) {
  if (typeof html !== 'string') return '';
  const el = document.createElement('textarea');
  // Strip tags first, then let the browser decode the entities. Nothing
  // is ever parsed as markup in the live document.
  el.innerHTML = html.replace(/<[^>]*>/g, '');
  return el.value.trim();
}
