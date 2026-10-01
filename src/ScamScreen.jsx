import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { scams as allScams } from './scams';
import { buildQuizOrder, roundFor } from './session';
import { EMPTY_IDENTITY, personalizeScam } from './identity';
import { clearTicket, requestTicket } from './lib/ticket';
import { loadQuestionStats } from './lib/questionStats';
import ResultsScreen from './ResultsScreen';
import SmsScam from './components/SmsScam';
import WhatsAppScam from './components/WhatsAppScam';
import EmailScam from './components/EmailScam';
import InstagramScam from './components/InstagramScam';
import PopupScam from './components/PopupScam';
import UpiScam from './components/UpiScam';
import FlagCard from './components/FlagCard';
import { useFlagCardPosition } from './hooks/useFlagCardPosition';

/**
 * One run of the quiz, from the first question to the results.
 *
 * A run is never reset in place. Going again asks the parent to mount a
 * fresh copy instead (see `runId` in App.jsx), which deals a new order
 * and starts a new ticket without any state from the last run to clear.
 *
 * In a workshop (`mode` 'workshop', with a `room`) the ten questions are
 * two matched halves with a halftime between them, so the results can
 * show a before and an after. The public quiz is ten in a row.
 */
export default function ScamScreen({
  identity = EMPTY_IDENTITY,
  mode = 'normal',
  room = null,
  isRepeat = false,
  onPlayAgain,
  onNextPerson,
}) {
  const workshop = mode === 'workshop';

  // The player's name is woven into the message text here, so every
  // simulated scam addresses them the way a real one would.
  const scams = useMemo(
    () => buildQuizOrder(allScams, mode).map((s) => personalizeScam(s, identity)),
    [identity, mode],
  );

  const [scamIndex, setScamIndex] = useState(0);
  const [results, setResults] = useState([]);
  const [userVerdict, setUserVerdict] = useState(null);
  const [phase, setPhase] = useState('idle');
  const [flagIndex, setFlagIndex] = useState(0);
  const [showHalftime, setShowHalftime] = useState(false);
  // Whether this run has a ticket: null while asking, then true or false.
  const [hasTicket, setHasTicket] = useState(null);

  const questionShownAtRef = useRef(0);
  const responseMsRef = useRef(0);

  const scam = scams[scamIndex];
  const isLastScam = scamIndex === scams.length - 1;

  // Which red flag is being explained right now. The card points at
  // whichever element carries this id, so the positioning hook needs it
  // too — hence both being worked out before the hook runs.
  const currentFlag = phase === 'revealing' ? scam.flags[flagIndex] : null;

  const {
    containerRef,
    contentRef,
    position: cardPosition,
    containerPad,
    measure: measureCard,
    reset: resetCard,
  } = useFlagCardPosition({
    active: phase === 'revealing',
    activeFlagId: currentFlag?.id,
  });

  /**
   * Everything that has to go back to a clean slate between questions.
   * This used to be written out twice, once here and once in the Try
   * Again handler, and the two had already drifted apart.
   */
  const resetForNextQuestion = () => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    setUserVerdict(null);
    setPhase('idle');
    setFlagIndex(0);
    resetCard();
  };

  const goToNextScam = () => {
    resetForNextQuestion();
    setScamIndex((prev) => prev + 1);
  };

  // Every run starts its own ticket, up front, so it is well past the
  // minimum age by the time anyone reaches the end. Anything left over
  // from an earlier run is dropped first: if that run's save was cut off
  // by a lost connection, its ticket may already be spent.
  //
  // In a workshop the ticket names the room — that, not anything sent at
  // the end, is what files this play under the workshop.
  const roomCode = room?.code ?? null;
  const askForTicket = useCallback(
    () => requestTicket({ room: roomCode }).then((t) => setHasTicket(Boolean(t))),
    [roomCode],
  );
  const retryTicket = () => {
    setHasTicket(null);
    askForTicket();
  };

  useEffect(() => {
    clearTicket();
    askForTicket();
    // How everyone else did on each question, for the results screen.
    // Asked for now so it is usually ready by the end.
    loadQuestionStats();
  }, [askForTicket]);

  // Start the response clock whenever a fresh question is put on screen.
  useEffect(() => {
    if (phase === 'idle' && !showHalftime)
      questionShownAtRef.current = Date.now();
  }, [scamIndex, phase, showHalftime]);


  if (scamIndex >= scams.length) {
    return (
      <ResultsScreen
        results={results}
        identity={identity}
        mode={mode}
        room={room}
        isRepeat={isRepeat}
        onPlayAgain={onPlayAgain}
        onNextPerson={onNextPerson}
      />
    );
  }

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
          // The order shown. The server decides the halves from this; a
          // public quiz has none.
          position: scamIndex + 1,
          round: workshop ? roundFor(scamIndex, scams.length) : null,
          verdictChosen: userVerdict,
          actualVerdict: scam.verdict,
          verdictCorrect: userVerdict === scam.verdict,
          responseMs: responseMsRef.current,
        },
      ]);
      // In a workshop, crossing from the first half into the second is
      // the hinge of the whole experience — mark it so the player (and
      // the results screen) can see the two halves as separate attempts.
      // The public quiz has no halves, so no halftime.
      const finishedRound = roundFor(scamIndex, scams.length);
      const nextRound = roundFor(scamIndex + 1, scams.length);
      if (workshop && finishedRound === 1 && nextRound === 2) {
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
      case 'sms':
        return <SmsScam {...props} />;
      default:
        // A typo in scams.js used to render silently as an SMS, so a
        // WhatsApp scam could ship looking like a text message and
        // nobody would notice. Say so instead. The test suite checks
        // every type has a screen, so this should be unreachable.
        console.error(
          `[spot-the-scam] scam ${scam.id} has unknown type "${scam.type}"`,
        );
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
      {workshop && hasTicket === false && (
        <div className="room-unsaved" role="alert">
          <span>
            This play isn&rsquo;t being saved to <strong>{room.name}</strong>.
          </span>
          <button type="button" onClick={retryTicket}>
            Try again
          </button>
        </div>
      )}

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
          containerPad > 0
            ? { paddingBottom: `${containerPad}px` }
            : undefined
        }
      >
        <div
          key={scam.id}
          className="scam-content slide-in"
          ref={contentRef}
          // Recolours every highlight on the screen. On a genuine
          // message the points being made are reassuring ones, and
          // painting them scam-red told the reader the opposite.
          data-verdict={scam.verdict}
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
            onMeasure={measureCard}
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
