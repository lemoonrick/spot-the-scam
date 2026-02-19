export default function FlagCard({
  flag,
  flagIndex,
  totalFlags,
  isLastFlag,
  isLastScam,
  onNext,
  coords,
  verdict, // Make sure this is passed from ScamScreen
}) {
  const isLegit = verdict === 'legitimate';

  // Define colors based on the verdict
  const themeColor = isLegit ? 'var(--green)' : 'var(--red)';
  const themeHex = isLegit ? '#22c55e' : '#ef4444';

  const style = {
    position: 'absolute',
    top: `${coords.top}px`,
    left: `${coords.left}px`,
    transform: 'translateX(-50%)',
    zIndex: 2000,
    '--current-theme': themeHex, // This controls the triangle color in CSS
  };

  return (
    <div className="flag-card-wrap" style={style}>
      {/* Manually overriding the borderTopColor based on verdict */}
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
