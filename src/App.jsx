import { lazy, Suspense, useState } from 'react';
import './App.css';
import StartScreen from './StartScreen';
import NameScreen from './NameScreen';
import ScamScreen from './ScamScreen';
import { EMPTY_IDENTITY, makeIdentity } from './identity';

// Loaded on demand. The dashboard and its icon set are a separate
// destination from the quiz, and people on slow connections should not
// download them just to answer ten questions.
const ImpactDashboard = lazy(() => import('./ImpactDashboard'));

// One extra page does not justify a router and the kilobytes it costs.
// The dashboard is a separate destination, not a step in the quiz, so a
// plain path check is enough.
//
// Two spellings are accepted so the page works wherever it is hosted:
//   /impact       needs the server to send unknown paths to index.html
//                 (.htaccess on Apache, vercel.json on Vercel)
//   #/impact      needs nothing at all, so it still works if a host
//                 ignores .htaccess or rewrites cannot be enabled
function isImpactPath() {
  if (/^#\/?impact\/?$/.test(window.location.hash)) return true;

  const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
  const path = window.location.pathname.replace(/\/$/, '');
  return path === `${base}/impact`;
}

export default function App() {
  if (isImpactPath()) {
    return (
      <Suspense fallback={<div className="im-boot" />}>
        <ImpactDashboard />
      </Suspense>
    );
  }
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
