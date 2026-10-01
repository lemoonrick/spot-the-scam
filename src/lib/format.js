// Shared by the public impact page and the admin pages, so a figure
// reads the same wherever it appears. Indian digit grouping: 1,00,000.

const nf = new Intl.NumberFormat('en-IN');

/** A count, or a dash when there is no figure. */
export const num = (v) => (v == null ? '—' : nf.format(v));

/** "1 play", "2 plays". */
export const plural = (n, one, many) => `${nf.format(n)} ${n === 1 ? one : many}`;

/** "+26", "0", "−4": an improvement, signed so a gain reads as one. */
export const signed = (v) => {
  if (v == null) return '—';
  const n = Number(v);
  if (n > 0) return `+${nf.format(n)}`;
  if (n < 0) return `−${nf.format(Math.abs(n))}`;
  return '0';
};

export function fmtDate(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** "2 Sept 2026" when it all happened on one day, a range otherwise. */
export function dateRange(from, to) {
  const a = fmtDate(from);
  const b = fmtDate(to);
  if (!b) return null;
  return !a || a === b ? b : `${a} to ${b}`;
}

/**
 * Below this many plays an average is noise, not a finding. Both impact
 * pages still show the numbers, but say plainly that they are
 * provisional. Publishing a confident "+34 points" off six plays would
 * discredit every other figure on the page.
 */
export const RELIABLE_SAMPLE = 30;
