import { useState, useEffect, useLayoutEffect, useRef, useMemo } from 'react';
import { scams as allScams } from './scams';
import { useLocale } from './i18n/LocaleContext';
import { localizeScam } from './i18n/localizeScam';
import { flagsToSpeech } from './i18n/speech';
import ReadAloudButton from './i18n/ReadAloudButton';
import AnalyticsScreen from './AnalyticsScreen';
import SmsScam from './components/SmsScam';
import WhatsAppScam from './components/WhatsAppScam';
import EmailScam from './components/EmailScam';
import InstagramScam from './components/InstagramScam';
import PopupScam from './components/PopupScam';
import UpiScam from './components/UpiScam';
import FlagCard from './components/FlagCard';

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function ScamScreen() {
  const { locale, t } = useLocale();
  const scams = useMemo(() => shuffle(allScams), []);

  const [scamIndex, setScamIndex] = useState(0);
  const [results, setResults] = useState([]);
  const [userVerdict, setUserVerdict] = useState(null);
  const [phase, setPhase] = useState('idle'); // idle → verdict-chosen → revealing
  const [flagIndex, setFlagIndex] = useState(0);

  // Anchored tooltip geometry — computed from the highlighted flag element.
  const [cardPos, setCardPos] = useState(null); // { top, left, width, pointerLeft }
  const [stackPad, setStackPad] = useState(0); // reserve space so the card is never cut
  const stackRef = useRef(null);
  const cardRef = useRef(null);

  // Resolve the current scam's translatable fields for the active locale once, so the
  // presentational components below receive plain strings exactly as before. id / type /
  // verdict / flag ids pass through untouched.
  const scam = useMemo(
    () => localizeScam(scams[scamIndex], locale),
    [scams, scamIndex, locale],
  );
  const isLastScam = scamIndex === scams.length - 1;

  const resetScamState = () => {
    setUserVerdict(null);
    setPhase('idle');
    setFlagIndex(0);
  };

  const goToNextScam = () => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    resetScamState();
    setScamIndex((prev) => prev + 1);
  };

  // Position the tooltip directly under the highlighted flag, pointing at it. Clamp it
  // inside the phone column so it never overflows, and reserve bottom space so it is
  // never clipped. Runs before paint (useLayoutEffect) to avoid a position flicker, and
  // re-runs on flag/scam/language change and on resize.
  /* eslint-disable react-hooks/set-state-in-effect --
     measuring layout and writing the result to state is the intended use here */
  useLayoutEffect(() => {
    if (phase !== 'revealing') {
      setCardPos(null);
      setStackPad(0);
      return;
    }
    const stack = stackRef.current;
    if (!stack) return;

    const measure = () => {
      const active = stack.querySelector('.active, .safe-active, .upi-active');
      if (!active) return;
      const sRect = stack.getBoundingClientRect();
      const aRect = active.getBoundingClientRect();

      const width = Math.min(340, sRect.width - 16);
      const flagCenter = aRect.left - sRect.left + aRect.width / 2;
      const left = Math.max(8, Math.min(flagCenter - width / 2, sRect.width - width - 8));
      const top = aRect.bottom - sRect.top + 12;
      const pointerLeft = Math.max(20, Math.min(flagCenter - left, width - 20));
      setCardPos({ top, left, width, pointerLeft });

      const cardH = cardRef.current ? cardRef.current.offsetHeight : 280;
      const phoneEl = stack.querySelector('.scam-content');
      const phoneH = phoneEl ? phoneEl.offsetHeight : sRect.height;
      setStackPad(Math.max(0, top + cardH + 24 - phoneH));
    };

    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [phase, flagIndex, scamIndex, locale]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Scroll the positioned card into view.
  useEffect(() => {
    if (phase !== 'revealing' || !cardRef.current || !cardPos) return;
    const raf = requestAnimationFrame(() => {
      cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
    return () => cancelAnimationFrame(raf);
  }, [phase, flagIndex, scamIndex, cardPos]);

  if (scamIndex >= scams.length) {
    return (
      <AnalyticsScreen
        results={results}
        onRestart={() => {
          window.scrollTo({ top: 0, behavior: 'instant' });
          setResults([]);
          setScamIndex(0);
          resetScamState();
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
      case 'upi':
        return <UpiScam {...props} />;
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
            {userVerdict === scam.verdict
              ? t('scam.correct')
              : t('scam.incorrect')}
          </span>
          <span className="verdict-header-short">{scam.explanation.short}</span>
        </div>
      )}

      {phase === 'idle' && (
        <div className="verdict-section">
          {scam.guideText && (
            <p className="guide-text">
              <span>{scam.guideText}</span>
              <ReadAloudButton text={scam.guideText} />
            </p>
          )}
          <div className="verdict-buttons">
            <button
              className="verdict-btn"
              onClick={() => handleVerdictPick('phishing')}
            >
              {t('scam.verdictPhishing')}
            </button>
            <button
              className="verdict-btn"
              onClick={() => handleVerdictPick('legitimate')}
            >
              {t('scam.verdictLegit')}
            </button>
          </div>
        </div>
      )}

      {phase === 'verdict-chosen' && (
        <div className="verdict-section">
          <button className="show-btn show-btn-pulse" onClick={handleShowMe}>
            {t('scam.showMe')}
          </button>
        </div>
      )}

      <div
        className="scam-stack"
        ref={stackRef}
        style={stackPad > 0 ? { paddingBottom: `${stackPad}px` } : undefined}
      >
        <div key={scam.id} className="scam-content slide-in">
          {renderScam()}
        </div>

        {phase === 'revealing' && currentFlag && (
          <div
            ref={cardRef}
            className="flag-card-host"
            style={
              cardPos
                ? {
                    top: `${cardPos.top}px`,
                    left: `${cardPos.left}px`,
                    width: `${cardPos.width}px`,
                  }
                : { visibility: 'hidden' }
            }
          >
            <FlagCard
              flag={currentFlag}
              flagIndex={flagIndex}
              totalFlags={scam.flags.length}
              isLastFlag={isLastFlag}
              isLastScam={isLastScam}
              onNext={handleNextFlag}
              verdict={scam.verdict}
              pointerLeft={cardPos?.pointerLeft}
              speechText={flagsToSpeech(currentFlag)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
