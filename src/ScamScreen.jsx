import { useState } from 'react';
import { scams } from './scams';
import AnalyticsScreen from './AnalyticsScreen';
import SmsScam from './components/SmsScam';
import WhatsAppScam from './components/WhatsAppScam';
import EmailScam from './components/EmailScam';

export default function ScamScreen() {
  const [scamIndex, setScamIndex] = useState(0);
  const [selectedFlags, setSelectedFlags] = useState([]);
  const [results, setResults] = useState([]);

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

  const toggleFlag = (flagId) => {
    setSelectedFlags((prev) =>
      prev.includes(flagId)
        ? prev.filter((id) => id !== flagId)
        : [...prev, flagId],
    );
  };

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

  const renderScam = () => {
    switch (scam.type) {
      case 'whatsapp':
        return (
          <WhatsAppScam
            scam={scam}
            selectedFlags={selectedFlags}
            toggleFlag={toggleFlag}
          />
        );
      case 'email':
        return (
          <EmailScam
            scam={scam}
            selectedFlags={selectedFlags}
            toggleFlag={toggleFlag}
          />
        );
      default:
        return (
          <SmsScam
            scam={scam}
            selectedFlags={selectedFlags}
            toggleFlag={toggleFlag}
          />
        );
    }
  };

  return (
    <div className="scam-wrapper">
      <div className="scam-content">{renderScam()}</div>

      <div className="scam-footer">
        <p className="progress">
          Message {scamIndex + 1} of {scams.length}
        </p>
        <button onClick={nextScam}>Next message</button>
      </div>
    </div>
  );
}
