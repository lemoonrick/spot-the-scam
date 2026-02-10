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

const StartScreen = ({ onStart }) => {
  return (
    <div className="start-wrapper">
      <div className="start-card">
        <div className="start-header">
          <img src="/src/assets/logo.png" alt="FactTree" className="logo" />
        </div>

        <h1>
          Spot the Scam
          <br />
          before it spots you
        </h1>

        <p className="subtitle">
          Practice spotting scams, fake messages, and manipulation tactics in a
          safe, interactive way.
        </p>

        <button onClick={onStart}>Spot your first scam</button>

        <div className="start-footer">
          <a href="https://myfactree.org" target="_blank">
            Visit FactTree.org
          </a>
          <span> • </span>
          <a href="#">Instagram</a>
          <span> • </span>
          <a href="#">YouTube</a>
        </div>
      </div>
    </div>
  );
};
