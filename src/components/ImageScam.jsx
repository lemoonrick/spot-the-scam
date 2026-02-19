/**
 * ImageScam.jsx
 *
 * Google Jigsaw phishing quiz style:
 * - Before reveal: just the image + verdict buttons
 * - After reveal: verdict header above image, overlay cards on image, Next on last card
 *
 * No modal. No RevealCard. Everything inline.
 */

export default function ImageScam({
  scam,
  hasRevealed,
  userVerdict,
  onNext,
  isLast,
}) {
  const isCorrect = userVerdict === scam.verdict;

  return (
    <div className="image-scam-outer">
      {/* ── Verdict header (Google style) ── shown only after reveal */}
      {hasRevealed && (
        <div
          className={`image-verdict-header ${isCorrect ? 'correct' : 'incorrect'}`}
        >
          <span className="image-verdict-label">
            {isCorrect ? '✓ Correct!' : '✗ Not quite.'}
          </span>
          <span className="image-verdict-short">{scam.explanation.short}</span>
        </div>
      )}

      {/* ── Screenshot + overlay cards ── */}
      <div className="image-scam-wrapper">
        <img
          src={scam.image}
          alt="Scam screenshot"
          className="image-scam-screenshot"
          draggable={false}
        />

        {/* Overlay cards — appear after reveal */}
        {hasRevealed &&
          scam.overlayCards?.map((card, index) => {
            const isLastCard = index === scam.overlayCards.length - 1;
            return (
              <div
                key={card.id}
                className={`image-scam-card ${card.cornerClass}`}
                style={{ top: card.top, left: card.left, right: card.right }}
              >
                {card.text}

                {/* Next button lives on the last card */}
                {isLastCard && (
                  <button className="image-next-btn" onClick={onNext}>
                    {isLast ? 'See Results' : 'Next →'}
                  </button>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
}
