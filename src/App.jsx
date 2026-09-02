import { useState } from 'react';
import './App.css';
import StartScreen from './StartScreen';
import NameScreen from './NameScreen';
import ScamScreen from './ScamScreen';
import ImpactDashboard from './ImpactDashboard';
import { EMPTY_IDENTITY, makeIdentity } from './identity';

// One extra page does not justify a router and the kilobytes it costs.
// The dashboard is a separate destination, not a step in the quiz, so a
// plain path check is enough. vercel.json rewrites every path to
// index.html so /impact loads on a hard refresh.
function isImpactPath() {
  return /^\/impact\/?$/.test(window.location.pathname);
}

export default function App() {
  if (isImpactPath()) return <ImpactDashboard />;
  return <Quiz />;
}

function Quiz() {
  const [step, setStep] = useState('start');
  // Held in memory only. Never persisted, never sent anywhere.
  const [identity, setIdentity] = useState(EMPTY_IDENTITY);

  return (
    <div className="app">
      {step === 'start' && <StartScreen onStart={() => setStep('name')} />}

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

      {step === 'quiz' && <ScamScreen identity={identity} />}
    </div>
  );
}
