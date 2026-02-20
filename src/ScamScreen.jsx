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
  // How much padding-bottom to add to the container so the card isn't clipped
  const [containerPad, setContainerPad] = useState(0);

  const containerRef = useRef(null);
  const cardHeightRef = useRef(260);

  const scam = scams[scamIndex];
  const isLastScam = scamIndex === scams.length - 1;

  const goToNextScam = () => {
    setUserVerdict(null);
    setPhase('idle');
    setFlagIndex(0);
    setCardPosition({ top: 0, left: 0 });
    setContainerPad(0);
    cardHeightRef.current = 260;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setScamIndex((prev) => prev + 1);
  };

  // ─── Core: position card + expand container + scroll ──────────────────────
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

    // Card top relative to the container (for absolute positioning)
    const cardTop = activeRect.bottom - containerRect.top + 12;
    const cardLeft =
      activeRect.left - containerRect.left + activeRect.width / 2;

    setCardPosition({ top: cardTop, left: cardLeft });

    // How tall the container needs to be to contain the card fully
    // containerRect.top is where the container starts relative to viewport.
    // cardTop is from container top. So card bottom in container = cardTop + cardHeight.
    const neededPad = cardTop + cardHeight + PADDING;
    // Only grow, never shrink while on same flag
    setContainerPad((prev) => Math.max(prev, neededPad));

    // Scroll: the card bottom in page coords
    const cardBottomOnPage =
      window.scrollY + containerRect.top + cardTop + cardHeight + PADDING;
    const currentViewportBottom = window.scrollY + window.innerHeight;

    if (cardBottomOnPage > currentViewportBottom) {
      window.scrollTo({
        top: cardBottomOnPage - window.innerHeight,
        behavior: 'smooth',
      });
    }

    // Guard: flagged element above viewport
    const activeTopOnPage = window.scrollY + activeRect.top;
    if (activeRect.top < 80) {
      window.scrollTo({ top: activeTopOnPage - 80, behavior: 'smooth' });
    }
  }, []);

  // FlagCard reports its real rendered height → re-run scroll with accurate value
  const handleCardMeasure = useCallback(
    (height) => {
      cardHeightRef.current = height;
      positionAndScroll();
    },
    [positionAndScroll],
  );

  // Trigger on phase/flag/scam changes
  useEffect(() => {
    if (phase !== 'revealing') return;
    // Small rAF delay so the DOM has applied the active class before we measure
    const raf = requestAnimationFrame(() => positionAndScroll());
    return () => cancelAnimationFrame(raf);
  }, [phase, flagIndex, scamIndex, positionAndScroll]);

  // ─── Analytics ────────────────────────────────────────────────────────────
  if (scamIndex >= scams.length) {
    return (
      <AnalyticsScreen
        results={results}
        onRestart={() => {
          setResults([]);
          setScamIndex(0);
          setUserVerdict(null);
          setPhase('idle');
          setFlagIndex(0);
          setCardPosition({ top: 0, left: 0 });
          setContainerPad(0);
          cardHeightRef.current = 260;
          window.scrollTo({ top: 0, behavior: 'instant' });
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

      {/*
        padding-bottom is set dynamically so the container is tall enough
        to contain the absolutely-positioned flag card, making the page
        scrollable to fully reveal it.
      */}
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
