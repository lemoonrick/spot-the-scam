import { useState } from 'react';
import { scams } from './scams';
import AnalyticsScreen from './AnalyticsScreen';
import SmsScam from './components/SmsScam';
import WhatsAppScam from './components/WhatsAppScam';
import EmailScam from './components/EmailScam';
import InstagramScam from './components/InstagramScam';
import PopupScam from './components/PopupScam';
import FlagCard from './components/FlagCard';

// Flow per scam:
// 'idle'           → scam shown, Phishing/Legitimate buttons visible
// 'verdict-chosen' → verdict picked, both buttons hidden, "Show Me" appears
// 'revealing'      → Show Me clicked, flag cards shown one at a time

export default function ScamScreen() {
  const [scamIndex, setScamIndex] = useState(0);
  const [results, setResults] = useState([]);
  const [userVerdict, setUserVerdict] = useState(null);
  const [phase, setPhase] = useState('idle'); // 'idle' | 'verdict-chosen' | 'revealing'
  const [flagIndex, setFlagIndex] = useState(0); // which flag card is currently showing

  if (scamIndex >= scams.length) {
    return (
      <AnalyticsScreen
        results={results}
        onRestart={() => {
          setResults([]);
          setUserVerdict(null);
          setPhase('idle');
          setFlagIndex(0);
          setScamIndex(0);
        }}
      />
    );
  }

  const scam = scams[scamIndex];
  const isLastScam = scamIndex === scams.length - 1;
  const currentFlag = phase === 'revealing' ? scam.flags[flagIndex] : null;
  const isLastFlag = flagIndex === scam.flags.length - 1;

  const handleVerdictPick = (verdict) => {
    setUserVerdict(verdict);
    setPhase('verdict-chosen');
  };

  const handleShowMe = () => {
    setPhase('revealing');
    setFlagIndex(0);
  };

  const handleNextFlag = () => {
    if (isLastFlag) {
      // Save result and advance to next scam
      setResults((prev) => [
        ...prev,
        {
          scamId: scam.id,
          verdictChosen: userVerdict,
          verdictCorrect: userVerdict === scam.verdict,
        },
      ]);
      setUserVerdict(null);
      setPhase('idle');
      setFlagIndex(0);
      setScamIndex((prev) => prev + 1);
    } else {
      setFlagIndex((prev) => prev + 1);
    }
  };

  // The active flag ID to highlight in the scam UI
  const activeFlagId = currentFlag?.id ?? null;

  const renderScam = () => {
    const props = { scam, activeFlagId };
    switch (scam.type) {
      case 'whatsapp':
        return <WhatsAppScam {...props} />;
      case 'email':
        return <EmailScam {...props} />;
      case 'instagram':
        return <InstagramScam {...props} />;
      case 'popup':
        return <PopupScam {...props} />;
      default:
        return <SmsScam {...props} />;
    }
  };

  // Glow as soon as verdict is picked, not just during reveal
  const glowClass =
    phase !== 'idle'
      ? userVerdict === scam.verdict
        ? 'correct-glow'
        : 'incorrect-glow'
      : '';

  return (
    <div className={`scam-wrapper ${glowClass}`}>
      {/* ── Verdict header — shows IMMEDIATELY when user picks a verdict ── */}
      {phase !== 'idle' && (
        <div
          className={`verdict-header ${userVerdict === scam.verdict ? 'correct' : 'incorrect'}`}
        >
          <span className="verdict-header-label">
            {userVerdict === scam.verdict ? '✓ Correct!' : '✗ Not quite.'}
          </span>
          <span className="verdict-header-short">{scam.explanation.short}</span>
        </div>
      )}

      {/* ── Scam UI ── */}
      <div key={scam.id} className="scam-content slide-in">
        {renderScam()}
      </div>

      {/* ── Flag card overlay (one at a time) ── */}
      {phase === 'revealing' && currentFlag && (
        <FlagCard
          key={currentFlag.id}
          flag={currentFlag}
          flagIndex={flagIndex}
          totalFlags={scam.flags.length}
          isLastFlag={isLastFlag}
          isLastScam={isLastScam}
          onNext={handleNextFlag}
        />
      )}

      {/* ── Verdict buttons (idle state) ── */}
      {phase === 'idle' && (
        <div className="verdict-section">
          <div className="verdict-buttons">
            <button
              className={`verdict-btn ${userVerdict === 'phishing' ? 'selected phishing' : ''}`}
              onClick={() => handleVerdictPick('phishing')}
            >
              Phishing
            </button>
            <button
              className={`verdict-btn ${userVerdict === 'legitimate' ? 'selected legit' : ''}`}
              onClick={() => handleVerdictPick('legitimate')}
            >
              Legitimate
            </button>
          </div>
        </div>
      )}

      {/* ── Show Me button (verdict-chosen state) ── */}
      {phase === 'verdict-chosen' && (
        <div className="verdict-section">
          <div className="show-me-wrap">
            <p className="show-me-hint">
              You said:{' '}
              <strong>
                {userVerdict === 'phishing' ? 'Phishing' : 'Legitimate'}
              </strong>
            </p>
            <button className="show-btn show-btn-pulse" onClick={handleShowMe}>
              Show me →
            </button>
          </div>
        </div>
      )}

      {/* ── Progress ── */}
      <div className="scam-footer">
        <p className="progress">
          {scamIndex + 1}/{scams.length}
        </p>
      </div>
    </div>
  );
}
