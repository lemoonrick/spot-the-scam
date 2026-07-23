import { useState } from 'react';
import './App.css';
import StartScreen from './StartScreen';
import ScamScreen from './ScamScreen';
import LanguageToggle from './i18n/LanguageToggle';

export default function App() {
  const [started, setStarted] = useState(false);

  return (
    <div className="app">
      <LanguageToggle />
      {!started ? (
        <StartScreen onStart={() => setStarted(true)} />
      ) : (
        <ScamScreen />
      )}
    </div>
  );
}
