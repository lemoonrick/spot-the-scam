import { useState } from 'react';
import './App.css';
import StartScreen from './StartScreen';
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
