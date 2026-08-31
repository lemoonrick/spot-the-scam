import { useState } from 'react';
import './App.css';
import StartScreen from './StartScreen';
import NameScreen from './NameScreen';
import ScamScreen from './ScamScreen';
import { EMPTY_IDENTITY, makeIdentity } from './identity';

export default function App() {
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
