import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { scams as allScams } from './scams';
import { buildMatchedRounds, roundFor } from './session';
import { EMPTY_IDENTITY, personalizeScam } from './identity';
import AnalyticsScreen from './AnalyticsScreen';
import SmsScam from './components/SmsScam';
import WhatsAppScam from './components/WhatsAppScam';
import EmailScam from './components/EmailScam';
import InstagramScam from './components/InstagramScam';
import PopupScam from './components/PopupScam';
import UpiScam from './components/UpiScam';
import FlagCard from './components/FlagCard';

export default function ScamScreen({ identity = EMPTY_IDENTITY }) {
  // The player's name is woven into the message text here, so every
  // simulated scam addresses them the way a real one would.
  const scams = useMemo(
    () => buildMatchedRounds(allScams).map((s) => personalizeScam(s, identity)),
    [identity],
  );

  const [scamIndex, setScamIndex] = useState(0);
  const [results, setResults] = useState([]);
  const [userVerdict, setUserVerdict] = useState(null);
  const [phase, setPhase] = useState('idle');
  const [flagIndex, setFlagIndex] = useState(0);
  const [cardPosition, setCardPosition] = useState({ top: 0, left: 0 });
  const [containerPad, setContainerPad] = useState(0);
  const [showHalftime, setShowHalftime] = useState(false);

  const containerRef = useRef(null);
  const scamContentRef = useRef(null);
  const cardHeightRef = useRef(260);
  const questionShownAtRef = useRef(0);
  const responseMsRef = useRef(0);

  const scam = scams[scamIndex];
  const isLastScam = scamIndex === scams.length - 1;

  const goToNextScam = () => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    setUserVerdict(null);
    setPhase('idle');
    setFlagIndex(0);
    setCardPosition({ top: 0, left: 0 });
    setContainerPad(0);
    cardHeightRef.current = 260;
    setScamIndex((prev) => prev + 1);
  };

  // Start the response clock whenever a fresh question is put on screen.
  useEffect(() => {
    if (phase === 'idle' && !showHalftime)
      questionShownAtRef.current = Date.now();
  }, [scamIndex, phase, showHalftime]);

  const positionAndScroll = useCallback(() => {
    if (!containerRef.current) return;
    const activeEl = containerRef.current.querySelector(
      '.active, .safe-active, .upi-active',
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

    // Only pad by how much the FlagCard bottom exceeds the phone's natural height.
    const phoneHeight = scamContentRef.current
      ? scamContentRef.current.scrollHeight
      : 0;
    const overflow = cardTop + cardHeight + PADDING - phoneHeight;
    if (overflow > 0) {
      setContainerPad((prev) => Math.max(prev, overflow));
    }
    // Scroll happens in a separate useEffect once containerPad has actually been applied.
  }, []);

  const handleCardMeasure = useCallback(
    (height) => {
      cardHeightRef.current = height;
      positionAndScroll();
    },
    [positionAndScroll],
  );

  useEffect(() => {
    if (phase !== 'revealing') return;
    const raf = requestAnimationFrame(() => positionAndScroll());
    return () => cancelAnimationFrame(raf);
  }, [phase, flagIndex, scamIndex, positionAndScroll]);

  // Scroll AFTER containerPad has been applied to the DOM so the card is fully in view.
  useEffect(() => {
    if (phase !== 'revealing' || !containerRef.current) return;
    const raf = requestAnimationFrame(() => {
      const activeEl = containerRef.current.querySelector(
        '.active, .safe-active, .upi-active',
      );
      if (!activeEl) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const cardHeight = cardHeightRef.current;
      const PADDING = 48;
      const cardTop =
        activeEl.getBoundingClientRect().bottom - containerRect.top + 12;
      const cardBottomOnPage =
        window.scrollY + containerRect.top + cardTop + cardHeight + PADDING;
      const currentViewportBottom = window.scrollY + window.innerHeight;
      if (cardBottomOnPage > currentViewportBottom) {
        window.scrollTo({
          top: cardBottomOnPage - window.innerHeight,
          behavior: 'smooth',
        });
      }
      if (activeEl.getBoundingClientRect().top < 80) {
        window.scrollTo({
          top: window.scrollY + activeEl.getBoundingClientRect().top - 80,
          behavior: 'smooth',
        });
      }
    });
    return () => cancelAnimationFrame(raf);
  }, [containerPad, phase]);

  if (scamIndex >= scams.length) {
    return (
      <AnalyticsScreen
        results={results}
        identity={identity}
        onRestart={() => {
          window.scrollTo({ top: 0, behavior: 'instant' });
          setResults([]);
          setScamIndex(0);
          setUserVerdict(null);
          setPhase('idle');
          setFlagIndex(0);
          setCardPosition({ top: 0, left: 0 });
          setContainerPad(0);
          setShowHalftime(false);
          cardHeightRef.current = 260;
        }}
      />
    );
  }

  const currentFlag = phase === 'revealing' ? scam.flags[flagIndex] : null;
  const isLastFlag = flagIndex === scam.flags.length - 1;

  const handleVerdictPick = (verdict) => {
    // Haptic feedback — works on Android; silently ignored on iOS/desktop
    if (navigator.vibrate)
      navigator.vibrate(verdict === 'phishing' ? [40, 30, 40] : 60);
    // How long they deliberated — a proxy for confidence, and one of the
    // clearest signals that training landed (people slow down, then speed up).
    responseMsRef.current = Date.now() - questionShownAtRef.current;
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
          type: scam.type,
          round: roundFor(scamIndex, scams.length),
          verdictChosen: userVerdict,
          actualVerdict: scam.verdict,
          verdictCorrect: userVerdict === scam.verdict,
          responseMs: responseMsRef.current,
        },
      ]);
      // Crossing from the baseline round into the trained round is the
      // hinge of the whole experience — mark it so the user (and the
      // results screen) can see the two halves as separate attempts.
      const finishedRound = roundFor(scamIndex, scams.length);
      const nextRound = roundFor(scamIndex + 1, scams.length);
      if (finishedRound === 1 && nextRound === 2) {
        window.scrollTo({ top: 0, behavior: 'instant' });
        setShowHalftime(true);
      } else {
        goToNextScam();
      }
    } else {
      setFlagIndex((prev) => prev + 1);
    }
  };

  const dismissHalftime = () => {
    setShowHalftime(false);
    goToNextScam();
  };

  const renderScam = () => {
    const props = { scam, activeFlagId: currentFlag?.id, identity };
    switch (scam.type) {
      case 'whatsapp':
        return <WhatsAppScam {...props} />;
      case 'email':
        return <EmailScam {...props} />;
      case 'instagram':
        return <InstagramScam {...props} />;
      case 'popup':
        return <PopupScam {...props} />;
      case 'upi':
        return <UpiScam {...props} />;
      default:
        return <SmsScam {...props} />;
    }
  };

  if (showHalftime) {
    const half = Math.floor(scams.length / 2);
    return (
      <div className="halftime">
        <div className="halftime-card">
          {/* Position first, words second. The filled half of the track
              answers "where am I" before anything has to be read. */}
          <div className="ht-progress">
            <div className="ht-segments" aria-hidden="true">
              {scams.map((_, i) => (
                <span
                  key={i}
                  className={`ht-seg ${i < half ? 'ht-seg-done' : ''}`}
                  style={{ '--i': i }}
                />
              ))}
            </div>
            <div className="ht-legend">
              <span className="ht-leg ht-leg-done">
                <svg viewBox="0 0 20 20" aria-hidden="true">
                  <path
                    d="M4 10.5l4 4 8-9"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Warm-up
              </span>
              <span className="ht-leg">The real test</span>
            </div>
          </div>

          <h2 className="ht-title">Halfway there.</h2>
          <p className="ht-body">
            The next {scams.length - half} are messages you haven&rsquo;t seen.
            We&rsquo;ll compare them against your first {half} to show you what
            stuck.
          </p>

          <button className="ht-btn" onClick={dismissHalftime}>
            Continue
          </button>
          <p className="ht-hint">Your score comes at the end.</p>
        </div>
      </div>
    );
  }

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
      <div className="scam-progress-bar-wrap">
        <div className="scam-progress-track">
          <div
            className="scam-progress-fill"
            style={{ width: `${((scamIndex + 1) / scams.length) * 100}%` }}
          />
        </div>
        <span className="scam-progress-label">
          {scamIndex + 1} / {scams.length}
        </span>
      </div>

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
          {scam.guideText && <p className="guide-text">{scam.guideText}</p>}
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
        <div
          key={scam.id}
          className="scam-content slide-in"
          ref={scamContentRef}
        >
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

      {/* <div className="scam-footer">
        <p className="progress">
          {scamIndex + 1}/{scams.length}
        </p>
      </div> */}
    </div>
  );
}
