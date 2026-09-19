import { useEffect, useRef } from 'react';

// The card normally sits a few pixels under the phrase, where its arrow
// says everything. The leader line is a fallback for the day something
// pushes the two far apart; at this distance the arrow alone would be
// pointing at whatever sits in between.
const LEADER_THRESHOLD = 64;

export default function FlagCard({
  flag,
  flagIndex,
  totalFlags,
  isLastFlag,
  isLastScam,
  onNext,
  coords,
  verdict,
  onMeasure, // callback(cardHeight) called after mount so ScamScreen can scroll accurately
}) {
  const isLegit = verdict === 'legitimate';
  const themeHex = isLegit ? '#22c55e' : '#ef4444';
  const wrapRef = useRef(null);

  // After the card renders, measure its real height and report it up
  useEffect(() => {
    if (wrapRef.current && onMeasure) {
      onMeasure({
        height: wrapRef.current.offsetHeight,
        width: wrapRef.current.offsetWidth,
      });
    }
  }, [flag]); // re-measure when the flag content changes (different flags have different text lengths)

  const style = {
    position: 'absolute',
    top: `${coords.top}px`,
    left: `${coords.left}px`,
    transform: 'translateX(-50%)',
    zIndex: 2000,
    '--current-theme': themeHex,
    // Slides the arrow along the card's top edge so it stays under the
    // phrase even when the card has been nudged away from the edge of
    // the screen.
    '--arrow-offset': `${coords.arrowOffset ?? 0}px`,
  };

  const gap = coords.gap ?? 0;
  const showLeader = gap > LEADER_THRESHOLD;

  return (
    <div className="flag-card-wrap" style={style} ref={wrapRef}>
      {showLeader && (
        <>
          <span
            className="flag-leader"
            style={{ height: `${gap}px`, background: themeHex }}
            aria-hidden="true"
          />
          <span
            className="flag-leader-dot"
            style={{ top: `-${gap}px`, background: themeHex }}
            aria-hidden="true"
          />
        </>
      )}
      <div className="flag-card" style={{ borderTopColor: themeHex }}>
        {totalFlags > 1 && (
          <div className="flag-dots">
            {Array.from({ length: totalFlags }).map((_, i) => (
              <span
                key={i}
                className={`flag-dot ${i === flagIndex ? 'active' : ''}`}
                style={{
                  backgroundColor: i === flagIndex ? themeHex : '#e2e8f0',
                }}
              />
            ))}
          </div>
        )}

        <div
          className="flag-card-label"
          style={{
            color: isLegit ? 'var(--green-dark)' : 'var(--red-dark)',
            backgroundColor: isLegit ? 'var(--correct-bg)' : 'var(--red-soft)',
          }}
        >
          {flag.label}
        </div>

        <p className="flag-card-text">{flag.text}</p>

        <button className="flag-next-btn" onClick={onNext}>
          {isLastFlag
            ? isLastScam
              ? 'See My Score'
              : 'Next Example →'
            : 'Next →'}
        </button>
      </div>
    </div>
  );
}
