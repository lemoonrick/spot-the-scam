const AnalyticsScreen = ({ results, onRestart }) => {
  const totalFlags = results.reduce(
    (sum, r) => sum + r.correct.length + r.missed.length,
    0,
  );

  const totalCorrect = results.reduce((sum, r) => sum + r.correct.length, 0);

  const score =
    totalFlags === 0 ? 0 : Math.round((totalCorrect / totalFlags) * 100);

  return (
    <div className="result">
      <h2>Your Media Literacy Score</h2>

      <p className="score">{score}%</p>

      <p>
        You correctly identified {totalCorrect} out of {totalFlags} red flags.
      </p>

      <h4>What this means</h4>

      {score >= 80 && <p>🧠 You’re very hard to fool. Nice.</p>}
      {score >= 50 && score < 80 && (
        <p>👍 You’re decent, but some tricks still slip through.</p>
      )}
      {score < 50 && (
        <p>⚠️ You’re vulnerable to common manipulation patterns.</p>
      )}

      <p className="hint">
        This isn’t about intelligence. It’s about practice.
      </p>

      <button onClick={onRestart}>Try again</button>
    </div>
  );
};

export default AnalyticsScreen;
