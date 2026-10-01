// ============================================================
//  "How did everyone else do on this one?"
//
//  One line under each answer on the results screen, comparing the
//  player with everyone who has answered the same question. The numbers
//  come from the public question_stats view.
//
//  Kept honest by a few rules:
//
//  - Nothing until a question has 50 answers. The database withholds
//    the figure below that, so "100% of players fell for this" can never
//    mean one person.
//  - "Players", not "people". It is quiz players we have numbers for.
//  - Never "top 10%". One question is right or wrong; there is no
//    ranking to be at the top of.
//  - Never 0% or 100%. With 50 answers the true figure is only known to
//    about ±14 points, so those become "almost no" and "almost every".
//  - Being wrong about a real message means flagging it as a scam, not
//    falling for it, so genuine messages get their own wording.
//  - No line at all for an easy question answered correctly. "Most
//    players got this right too" on every row is just noise.
// ============================================================

const HIGH = 50; // at least half of players got it wrong
const LOW = 20; // fewer than one in five got it wrong

/** "38% of players", or "almost every player" at the extremes. */
function players(pct) {
  if (pct <= 0) return 'almost no players';
  if (pct >= 100) return 'almost every player';
  return `${pct}% of players`;
}

/**
 * @param {object}  o
 * @param {boolean} o.correct   did this player get it right
 * @param {string}  o.actual    'phishing' or 'legitimate'
 * @param {number}  [o.wrongPct] share of players who got it wrong, 0–100
 * @returns {string|null}  null when there is nothing worth saying
 */
export function comparisonLine({ correct, actual, wrongPct }) {
  if (typeof wrongPct !== 'number' || Number.isNaN(wrongPct)) return null;
  const scam = actual === 'phishing';
  const w = Math.min(100, Math.max(0, Math.round(wrongPct)));
  const rightPct = 100 - w;

  if (!correct) {
    if (w >= HIGH) {
      return scam
        ? `You trusted this one. So did ${players(w)} — it's a convincing fake.`
        : `You flagged this real message as a scam. So did ${players(w)}.`;
    }
    if (w >= LOW) {
      return scam
        ? `${capitalise(players(w))} trusted this one too.`
        : `${capitalise(players(w))} suspected this real message too.`;
    }
    return scam
      ? 'Most players caught this one — worth another look at the red flags.'
      : 'Most players recognised this as genuine.';
  }

  if (w >= HIGH) {
    if (rightPct <= 0) {
      return scam
        ? 'Almost no players spotted this — you did.'
        : 'Almost no players trusted this correctly — you did.';
    }
    return scam
      ? `Only ${players(rightPct)} spotted this — you did.`
      : `Only ${players(rightPct)} trusted this correctly — you did.`;
  }
  if (w >= LOW) {
    return scam
      ? `You caught what ${players(w)} missed.`
      : `${capitalise(players(w))} wrongly flagged this. You didn't.`;
  }
  return null;
}

const capitalise = (s) => s.charAt(0).toUpperCase() + s.slice(1);
