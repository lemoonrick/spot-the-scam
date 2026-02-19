import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { scams } from './scams';
import AnalyticsScreen from './AnalyticsScreen';
import SmsScam from './components/SmsScam';
import WhatsAppScam from './components/WhatsAppScam';
import EmailScam from './components/EmailScam';
import InstagramScam from './components/InstagramScam';
import PopupScam from './components/PopupScam';
import FlagCard from './components/FlagCard';

export default function ScamScreen({ results, setResults }) {
  const { id } = useParams();
  const navigate = useNavigate();

  // Convert URL ID (1-based) to Array Index (0-based)
  const scamIndex = parseInt(id) - 1;
  const scam = scams[scamIndex];

  const [userVerdict, setUserVerdict] = useState(null);
  const [phase, setPhase] = useState('idle');
  const [flagIndex, setFlagIndex] = useState(0);
  const [cardPosition, setCardPosition] = useState({ top: 0, left: 0 });

  const containerRef = useRef(null);

  // Reset internal state when the URL ID changes (user hits back/next)
  useEffect(() => {
    setUserVerdict(null);
    setPhase('idle');
    setFlagIndex(0);
  }, [id]);

  useEffect(() => {
    if (phase === 'revealing') {
      const activeElement = containerRef.current?.querySelector(
        '.active, .safe-active',
      );
      if (activeElement) {
        const rect = activeElement.getBoundingClientRect();
        const containerRect = containerRef.current.getBoundingClientRect();

        setCardPosition({
          top: rect.bottom - containerRect.top + 12,
          left: rect.left - containerRect.left + rect.width / 2,
        });
      }
    }
  }, [phase, flagIndex, id]);

  if (!scam) {
    return (
      <AnalyticsScreen
        results={results}
        onRestart={() => navigate('/quiz/1')}
      />
    );
  }

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
      // Record result
      setResults((prev) => [
        ...prev,
        {
          scamId: scam.id,
          verdictChosen: userVerdict,
          verdictCorrect: userVerdict === scam.verdict,
        },
      ]);

      // Navigate to next ID in URL
      const nextId = parseInt(id) + 1;
      if (nextId > scams.length) {
        setPhase('completed'); // Shows results
      } else {
        navigate(`/quiz/${nextId}`);
      }
    } else {
      setFlagIndex((prev) => prev + 1);
    }
  };

  if (phase === 'completed') {
    return (
      <AnalyticsScreen
        results={results}
        onRestart={() => {
          setResults([]);
          navigate('/quiz/1');
        }}
      />
    );
  }

  const renderScam = () => {
    const props = { scam, activeFlagId: currentFlag?.id };
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

  return (
    <div
      className={`scam-wrapper ${phase !== 'idle' ? (userVerdict === scam.verdict ? 'correct-glow' : 'incorrect-glow') : ''}`}
    >
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

      <div className="scam-relative-container" ref={containerRef}>
        <div key={scam.id} className="scam-content slide-in">
          {renderScam()}
        </div>

        {phase === 'revealing' && currentFlag && (
          <FlagCard
            flag={currentFlag}
            flagIndex={flagIndex}
            totalFlags={scam.flags.length}
            isLastFlag={isLastFlag}
            isLastScam={isLastScam}
            onNext={handleNextFlag}
            coords={cardPosition}
            verdict={scam.verdict}
          />
        )}
      </div>

      {phase === 'idle' && (
        <div className="verdict-section">
          <div className="verdict-buttons">
            <button
              className="verdict-btn"
              onClick={() => handleVerdictPick('phishing')}
            >
              Phishing
            </button>
            <button
              className="verdict-btn"
              onClick={() => handleVerdictPick('legitimate')}
            >
              Legitimate
            </button>
          </div>
        </div>
      )}

      {phase === 'verdict-chosen' && (
        <div className="verdict-section">
          <button className="show-btn show-btn-pulse" onClick={handleShowMe}>
            Show me →
          </button>
        </div>
      )}

      <div className="scam-footer">
        <p className="progress">
          {id}/{scams.length}
        </p>
      </div>
    </div>
  );
}
