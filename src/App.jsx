import { lazy, Suspense, useEffect, useState } from 'react';
import './App.css';
import StartScreen from './StartScreen';
import NameScreen from './NameScreen';
import ScamScreen from './ScamScreen';
import { EMPTY_IDENTITY, makeIdentity } from './identity';
import { routeFor } from './lib/route';
import { lookupRoom, readRoomParam, setRoomParam } from './lib/room';

// Loaded on demand. The impact page and its icon set are a separate
// destination from the quiz, and people on slow connections should not
// download them just to answer ten questions.
const PublicImpact = lazy(() => import('./PublicImpact'));

export default function App() {
  const route = routeFor(window.location, import.meta.env.BASE_URL || '/');
  if (route === 'impact') {
    return (
      <Suspense fallback={<div className="im-boot" />}>
        <PublicImpact />
      </Suspense>
    );
  }
  return <Quiz />;
}

function Quiz() {
  const [step, setStep] = useState('start');
  // Held in memory only. Never persisted, never sent anywhere.
  const [identity, setIdentity] = useState(EMPTY_IDENTITY);
  // Each run of the quiz is a fresh mount. Bumping this gives a new
  // question order and a new ticket, with nothing carried over from the
  // run before.
  const [runId, setRunId] = useState(0);
  // A second go by the same person. It scores higher for knowing the
  // questions, so workshop figures count first attempts only.
  const [isRepeat, setIsRepeat] = useState(false);

  // The workshop this tab is in, if any. Read from `?room=` when the page
  // loads, so a refresh — or a phone that discards the tab — comes back
  // to the same workshop.
  const [roomState, setRoomState] = useState(() => {
    const code = readRoomParam();
    return code ? { status: 'checking', code } : { status: 'none' };
  });

  useEffect(() => {
    if (roomState.status !== 'checking') return;
    let alive = true;
    const { code } = roomState;
    lookupRoom(code).then((result) => {
      if (!alive) return;
      // Keep a working code in the address bar; drop one that can't be
      // joined, so refreshing doesn't ask about it again. Keep it if we
      // simply couldn't ask, so "Try again" and a refresh still can.
      if (result.status === 'ok') setRoomParam(code);
      else if (result.status !== 'offline') setRoomParam(null);
      setRoomState({ ...result, code });
    });
    return () => {
      alive = false;
    };
  }, [roomState]);

  const inWorkshop = roomState.status === 'ok';
  const mode = inWorkshop ? 'workshop' : 'normal';

  const joinRoom = (code) => setRoomState({ status: 'checking', code });
  const leaveRoom = () => {
    setRoomParam(null);
    setRoomState({ status: 'none' });
  };

  const newRun = () => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    setRunId((n) => n + 1);
  };

  // "Play again myself" in a workshop, "Try again" in the public quiz.
  const playAgain = () => {
    setIsRepeat(true);
    newRun();
  };

  // A workshop's shared phone changing hands: the next player starts
  // from their own name, as a first attempt.
  const nextPerson = () => {
    setIdentity(EMPTY_IDENTITY);
    setIsRepeat(false);
    setStep('name');
    newRun();
  };

  return (
    <div className="app">
      {step === 'start' && (
        <StartScreen
          onStart={() => setStep('name')}
          roomState={roomState}
          onJoinRoom={joinRoom}
          onLeaveRoom={leaveRoom}
        />
      )}

      {step === 'name' && (
        <NameScreen
          onContinue={(name) => {
            setIdentity(makeIdentity(name));
            setStep('quiz');
          }}
          onSkip={() => {
            setIdentity(EMPTY_IDENTITY);
            setStep('quiz');
          }}
        />
      )}

      {step === 'quiz' && (
        <ScamScreen
          key={runId}
          identity={identity}
          mode={mode}
          room={inWorkshop ? roomState.room : null}
          isRepeat={isRepeat}
          onPlayAgain={playAgain}
          onNextPerson={nextPerson}
        />
      )}
    </div>
  );
}
