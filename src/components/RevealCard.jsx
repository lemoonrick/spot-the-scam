export default function RevealCard({ scam, userVerdict, onNext, isLast }) {
  const isCorrect = userVerdict === scam.verdict;

  return (
    <div className="reveal-overlay">
      <div className="reveal-card">
        <h3 className={isCorrect ? 'correct' : 'incorrect'}>
          {isCorrect ? 'Correct' : 'Incorrect'}
        </h3>

        <p>{scam.explanation.short}</p>

        <ul>
          {scam.explanation.points.map((point, i) => (
            <li key={i}>{point}</li>
          ))}
        </ul>

        <button className="next-btn" onClick={onNext}>
          {isLast ? 'See Results' : 'Next'}
        </button>
      </div>
    </div>
  );
}
