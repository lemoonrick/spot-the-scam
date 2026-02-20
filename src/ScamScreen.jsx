import { useState, useEffect, useRef, useCallback } from 'react';
import { scams } from './scams';
import AnalyticsScreen from './AnalyticsScreen';
import SmsScam from './components/SmsScam';
import WhatsAppScam from './components/WhatsAppScam';
import EmailScam from './components/EmailScam';
import InstagramScam from './components/InstagramScam';
import PopupScam from './components/PopupScam';
import FlagCard from './components/FlagCard';

export default function ScamScreen() {
  const [scamIndex, setScamIndex] = useState(0);
  const [results, setResults] = useState([]);
  const [userVerdict, setUserVerdict] = useState(null);
  const [phase, setPhase] = useState('idle');
  const [flagIndex, setFlagIndex] = useState(0);
  const [cardPosition, setCardPosition] = useState({ top: 0, left: 0 });
  const [containerPad, setContainerPad] = useState(0);

  const containerRef = useRef(null);
  const cardHeightRef = useRef(260);

  const scam = scams[scamIndex];
  const isLastScam = scamIndex === scams.length - 1;

  const goToNextScam = () => {
    // Instant jump to top FIRST — before any state change —
    // so the new scam always starts with buttons visible.
    // 'instant' avoids the smooth-scroll race condition on mobile.
    window.scrollTo({ top: 0, behavior: 'instant' });

    setUserVerdict(null);
    setPhase('idle');
    setFlagIndex(0);
    setCardPosition({ top: 0, left: 0 });
    setContainerPad(0);
    cardHeightRef.current = 260;
    setScamIndex((prev) => prev + 1);
  };

  // ─── Position card + expand container + scroll ────────────────────────────
  const positionAndScroll = useCallback(() => {
    if (!containerRef.current) return;
    const activeEl = containerRef.current.querySelector(
      '.active, .safe-active',
    );
    if (!activeEl) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const activeRect = activeEl.getBoundingClientRect();
    const cardHeight = cardHeightRef.current;
    const PADDING = 48;

    const cardTop = activeRect.bottom - containerRect.top + 12;
    const cardLeft =
      activeRect.left - containerRect.left + activeRect.width / 2;

    setCardPosition({ top: cardTop, left: cardLeft });

    // Grow the container so the absolute card is within document flow
    const neededPad = cardTop + cardHeight + PADDING;
    setContainerPad((prev) => Math.max(prev, neededPad));

    // Scroll so card bottom is in view
    const cardBottomOnPage =
      window.scrollY + containerRect.top + cardTop + cardHeight + PADDING;
    const currentViewportBottom = window.scrollY + window.innerHeight;

    if (cardBottomOnPage > currentViewportBottom) {
      window.scrollTo({
        top: cardBottomOnPage - window.innerHeight,
        behavior: 'smooth',
      });
    }

    // Guard: flagged element scrolled above fold
    if (activeRect.top < 80) {
      window.scrollTo({
        top: window.scrollY + activeRect.top - 80,
        behavior: 'smooth',
      });
    }
  }, []);

  // FlagCard reports real rendered height → refine scroll
  const handleCardMeasure = useCallback(
    (height) => {
      cardHeightRef.current = height;
      positionAndScroll();
    },
    [positionAndScroll],
  );

  // Trigger on phase/flag change
  useEffect(() => {
    if (phase !== 'revealing') return;
    const raf = requestAnimationFrame(() => positionAndScroll());
    return () => cancelAnimationFrame(raf);
  }, [phase, flagIndex, scamIndex, positionAndScroll]);

  // ─── Analytics ────────────────────────────────────────────────────────────
  if (scamIndex >= scams.length) {
    return (
      <AnalyticsScreen
        results={results}
        onRestart={() => {
          window.scrollTo({ top: 0, behavior: 'instant' });
          setResults([]);
          setScamIndex(0);
          setUserVerdict(null);
          setPhase('idle');
          setFlagIndex(0);
          setCardPosition({ top: 0, left: 0 });
          setContainerPad(0);
          cardHeightRef.current = 260;
        }}
      />
    );
  }

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
      setResults((prev) => [
        ...prev,
        {
          scamId: scam.id,
          verdictChosen: userVerdict,
          verdictCorrect: userVerdict === scam.verdict,
        },
      ]);
      goToNextScam();
    } else {
      setFlagIndex((prev) => prev + 1);
    }
  };

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
      className={`scam-wrapper ${
        phase !== 'idle'
          ? userVerdict === scam.verdict
            ? 'correct-glow'
            : 'incorrect-glow'
          : ''
      }`}
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

      <div
        className="scam-relative-container"
        ref={containerRef}
        style={
          containerPad > 0 ? { paddingBottom: `${containerPad}px` } : undefined
        }
      >
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
            onMeasure={handleCardMeasure}
          />
        )}
      </div>

      <div className="scam-footer">
        <p className="progress">
          {scamIndex + 1}/{scams.length}
        </p>
      </div>
    </div>
  );
}
