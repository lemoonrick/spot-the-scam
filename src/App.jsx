import { useState } from 'react';
import './App.css';
import { scams } from './scams';

export default function App() {
  const [started, setStarted] = useState(false);

  return (
    <div className="app">
      {!started ? (
        <StartScreen onStart={() => setStarted(true)} />
      ) : (
        <ScamScreen />
      )}
    </div>
  );
}

function StartScreen({ onStart }) {
  return (
    <div className="start-screen">
      <h1>🕵️ Spot the Scam</h1>
      <p>
        You will see a message.
        <br />
        Tap what feels suspicious.
      </p>
      <button onClick={onStart}>Get Started</button>
    </div>
  );
}

const ScamScreen = () => {
  const [scamIndex, setScamIndex] = useState(0);
  const [selectedFlags, setSelectedFlags] = useState([]);
  const [showResult, setShowResult] = useState(false);
  const [results, setResults] = useState([]);

  if (scamIndex === 'done') {
    return <AnalyticsScreen results={results} />;
  }

  const scam = scams[scamIndex];

  const toggleFlag = (flagId) => {
    if (showResult) return;

    setSelectedFlags((prev) =>
      prev.includes(flagId)
        ? prev.filter((id) => id !== flagId)
        : [...prev, flagId],
    );
  };

  const isSelected = (flagId) => selectedFlags.includes(flagId);

  const missedFlags = scam.correctFlags.filter(
    (flag) => !selectedFlags.includes(flag),
  );

  const nextScam = () => {
    const missedFlags = scam.correctFlags.filter(
      (flag) => !selectedFlags.includes(flag),
    );

    setResults((prev) => [
      ...prev,
      {
        scamId: scam.id,
        correct: selectedFlags.filter((flag) =>
          scam.correctFlags.includes(flag),
        ),
        missed: missedFlags,
      },
    ]);

    setSelectedFlags([]);
    setShowResult(false);

    if (scamIndex + 1 < scams.length) {
      setScamIndex(scamIndex + 1);
    } else {
      setScamIndex('done');
    }
  };

  return (
    <div className="scam-screen">
      <div className="message-card">
        <p>
          <strong>{scam.sender}</strong>
        </p>

        <p>
          {scam.message.map((block, index) =>
            block.flag ? (
              <span
                key={index}
                className={`flag ${isSelected(block.flag) ? 'selected' : ''}`}
                onClick={() => toggleFlag(block.flag)}
              >
                {block.text}
              </span>
            ) : (
              <span key={index}>{block.text}</span>
            ),
          )}
        </p>
      </div>

      <p className="progress">
        Message {scamIndex + 1} of {scams.length}
      </p>

      {!showResult ? (
        <button onClick={() => setShowResult(true)}>Check answer</button>
      ) : (
        <div className="result">
          <h3>Result</h3>

          <p>
            ✅ You spotted {selectedFlags.length} issue
            {selectedFlags.length !== 1 && 's'}
          </p>

          {missedFlags.length > 0 && (
            <p>❌ You missed: {missedFlags.join(', ')}</p>
          )}

          <div className="explanations">
            {scam.correctFlags.map((flag) => (
              <p key={flag}>
                <strong>{flag}:</strong> {scam.explanations[flag]}
              </p>
            ))}
          </div>

          <button onClick={nextScam}>Next message</button>
        </div>
      )}
    </div>
  );
};

const AnalyticsScreen = ({ results }) => {
  const totalFlags = results.reduce(
    (sum, r) => sum + r.correct.length + r.missed.length,
    0,
  );

  const totalCorrect = results.reduce((sum, r) => sum + r.correct.length, 0);

  const score = Math.round((totalCorrect / totalFlags) * 100);

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
    </div>
  );
};
