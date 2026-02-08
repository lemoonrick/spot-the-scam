import { useState } from 'react';
import './App.css';
import ScamScreen from './ScamScreen';

export default function App() {
  const [started, setStarted] = useState(false);

  return (
    <div className="app">
      {!started ? (
        <StartScreen onStart={() => setStarted(true)} />
      ) : (
        <ScamScreen />
      )}
    </div>
  );
}

const StartScreen = ({ onStart }) => (
  <div className="start-screen">
    <h1>🕵️ Spot the Scam</h1>
    <p>
      You will see a message.
      <br />
      Tap what feels suspicious.
    </p>
    <button onClick={onStart}>Get Started</button>
  </div>
);
