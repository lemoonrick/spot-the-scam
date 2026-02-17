export default function VerdictControls({
  userVerdict,
  setUserVerdict,
  hasRevealed,
  onReveal,
}) {
  return (
    <div className="verdict-section">
      <div className="verdict-buttons">
        <button
          className={`verdict-btn ${
            userVerdict === 'phishing' ? 'selected phishing' : ''
          }`}
          onClick={() => {
            if (navigator.vibrate) navigator.vibrate(20);
            setUserVerdict('phishing');
          }}
          disabled={hasRevealed}
        >
          Phishing
        </button>

        <button
          className={`verdict-btn ${
            userVerdict === 'legitimate' ? 'selected legit' : ''
          }`}
          onClick={() => setUserVerdict('legitimate')}
          disabled={hasRevealed}
        >
          Legitimate
        </button>
      </div>

      {userVerdict && !hasRevealed && (
        <button className="show-btn" onClick={onReveal}>
          Show me
        </button>
      )}
    </div>
  );
}
