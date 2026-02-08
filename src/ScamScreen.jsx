import { useState } from 'react';
import { scams } from './scams';
import AnalyticsScreen from './AnalyticsScreen';

const ScamScreen = () => {
  const [scamIndex, setScamIndex] = useState(0);
  const [selectedFlags, setSelectedFlags] = useState([]);
  const [results, setResults] = useState([]);

  // When all scams are done, show analytics
  if (scamIndex >= scams.length) {
    return (
      <AnalyticsScreen
        results={results}
        onRestart={() => {
          setResults([]);
          setSelectedFlags([]);
          setScamIndex(0);
        }}
      />
    );
  }

  const scam = scams[scamIndex];

  // Toggle a red-flag selection
  const toggleFlag = (flagId) => {
    setSelectedFlags((prev) =>
      prev.includes(flagId)
        ? prev.filter((id) => id !== flagId)
        : [...prev, flagId],
    );
  };

  const isSelected = (flagId) => selectedFlags.includes(flagId);

  // Move to next scam and store performance
  const nextScam = () => {
    const missed = scam.correctFlags.filter(
      (flag) => !selectedFlags.includes(flag),
    );

    setResults((prev) => [
      ...prev,
      {
        scamId: scam.id,
        correct: selectedFlags.filter((flag) =>
          scam.correctFlags.includes(flag),
        ),
        missed,
      },
    ]);

    setSelectedFlags([]);
    setScamIndex((prev) => prev + 1);
  };

  return (
    <div className="scam-screen">
      <div className="message-card">
        <p>
          <strong>{scam.sender}</strong>
        </p>

        <p className="scam-type">{scam.type.toUpperCase()}</p>

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

      <button onClick={nextScam}>Next message</button>
    </div>
  );
};

export default ScamScreen;
