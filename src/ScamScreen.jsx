import { useState } from 'react';
import { scams } from './scams';
import AnalyticsScreen from './AnalyticsScreen';
import SmsScam from './components/SmsScam';
import WhatsAppScam from './components/WhatsAppScam';
import EmailScam from './components/EmailScam';
import InstagramScam from './components/InstagramScam';
import VerdictControls from './components/VerdictControls';
import RevealCard from './components/RevealCard';
import PopupScam from './components/PopupScam';

export default function ScamScreen() {
  const [scamIndex, setScamIndex] = useState(0);
  const [selectedFlags, setSelectedFlags] = useState([]);
  const [results, setResults] = useState([]);

  const [userVerdict, setUserVerdict] = useState(null);
  const [hasRevealed, setHasRevealed] = useState(false);

  if (scamIndex >= scams.length) {
    return (
      <AnalyticsScreen
        results={results}
        onRestart={() => {
          setResults([]);
          setSelectedFlags([]);
          setUserVerdict(null);
          setHasRevealed(false);
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
    setResults((prev) => [
      ...prev,
      {
        scamId: scam.id,
        verdictChosen: userVerdict,
        verdictCorrect: userVerdict === scam.verdict,
        selectedFlags,
      },
    ]);

    setUserVerdict(null);
    setHasRevealed(false);
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

      case 'instagram':
        return (
          <InstagramScam
            scam={scam}
            selectedFlags={selectedFlags}
            toggleFlag={toggleFlag}
          />
        );

      case 'popup':
        return (
          <PopupScam
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
    <div
      className={`scam-wrapper ${
        hasRevealed
          ? userVerdict === scam.verdict
            ? 'correct-glow'
            : 'incorrect-glow'
          : ''
      }`}
    >
      <div key={scam.id} className="scam-content slide-in">
        {renderScam()}
      </div>

      {/* Verdict Selection */}
      <VerdictControls
        userVerdict={userVerdict}
        setUserVerdict={setUserVerdict}
        hasRevealed={hasRevealed}
        onReveal={() => setHasRevealed(true)}
      />

      {/* Explanation Card */}
      {hasRevealed && (
        <RevealCard
          scam={scam}
          userVerdict={userVerdict}
          selectedFlags={selectedFlags}
          onNext={nextScam}
          isLast={scamIndex === scams.length - 1}
        />
      )}

      {/* Progress only */}
      <div className="scam-footer">
        <p className="progress">
          {scamIndex + 1}/{scams.length}
        </p>
      </div>
    </div>
  );
}
