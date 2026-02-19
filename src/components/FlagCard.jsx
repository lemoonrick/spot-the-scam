/**
 * FlagCard.jsx
 *
 * A single explanation card shown one at a time during the reveal phase.
 * Appears as a clean card below the scam UI (not a modal, not blocking).
 * Has a "Next" button to advance to the next flag, or next scam if last flag.
 */

export default function FlagCard({
  flag,
  flagIndex,
  totalFlags,
  isLastFlag,
  isLastScam,
  onNext,
}) {
  const nextLabel = isLastFlag
    ? isLastScam
      ? 'See Results'
      : 'Next Scam →'
    : 'Next →';

  return (
    <div className="flag-card-wrap">
      <div className="flag-card">
        {/* Dot indicator for multi-flag progress */}
        {totalFlags > 1 && (
          <div className="flag-dots">
            {Array.from({ length: totalFlags }).map((_, i) => (
              <span
                key={i}
                className={`flag-dot ${i === flagIndex ? 'active' : i < flagIndex ? 'done' : ''}`}
              />
            ))}
          </div>
        )}

        <div className="flag-card-label">{flag.label}</div>
        <p className="flag-card-text">{flag.text}</p>

        <button className="flag-next-btn" onClick={onNext}>
          {nextLabel}
        </button>
      </div>
    </div>
  );
}
