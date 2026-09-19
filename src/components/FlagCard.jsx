import { useEffect, useRef } from 'react';

// Below this the card is close enough that its arrow is clear on its own.
const LEADER_THRESHOLD = 28;

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
      onMeasure(wrapRef.current.offsetHeight);
    }
  }, [flag]); // re-measure when the flag content changes (different flags have different text lengths)

  const style = {
    position: 'absolute',
    top: `${coords.top}px`,
    left: `${coords.left}px`,
    transform: 'translateX(-50%)',
    zIndex: 2000,
    '--current-theme': themeHex,
  };

  // The card sits below the whole message so it never covers the text.
  // When the highlighted phrase is near the top of a long message that
  // leaves a real distance between the two, and the little arrow on the
  // card ends up pointing at whatever happens to be above it. Past that
  // distance, draw a line back up to the phrase so the pairing is
  // unmistakable. Short hops keep the arrow alone, as before.
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
