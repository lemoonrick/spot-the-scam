import { useEffect, useState } from 'react';
import './App.css';
import ScamScreen from './ScamScreen';

export default function App() {
  const [started, setStarted] = useState(false);

  return (
    <div className={`app ${started ? 'app-entered' : ''}`}>
      {!started ? (
        <StartScreen onStart={() => setStarted(true)} />
      ) : (
        <ScamScreen />
      )}
    </div>
  );
}

const StartScreen = ({ onStart }) => {
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    setEntered(true);
  }, []);

  const handleMouseMove = (e) => {
    const { innerWidth, innerHeight } = window;
    const x = (e.clientX / innerWidth - 0.5) * 20;
    const y = (e.clientY / innerHeight - 0.5) * 20;

    document.documentElement.style.setProperty('--parallax-x', `${x}px`);
    document.documentElement.style.setProperty('--parallax-y', `${y}px`);
  };

  return (
    <div className="hero-wrapper" onMouseMove={handleMouseMove}>
      <div className={`hero-content ${entered ? 'entered' : ''}`}>
        <h1 className="hero-title">
          Spot the <span className="highlight">Scam</span>
          <br />
          before it spots you!
        </h1>

        <p className="hero-subtitle">
          Practice spotting scams, fake messages,
          <br />
          and manipulation tactics in a safe and interactive way.
        </p>

        <button className="hero-btn" onClick={onStart}>
          Get Started
        </button>
      </div>

      <div className="hero-footer">
        <a href="https://myfactree.org">
          <img
            src="/src/assets/logo.png"
            alt="FactTree"
            className="hero-logo"
          />
        </a>

        <div className="hero-socials">
          <a href="https://instagram.com/myfactree_" target="_blank">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
              <path d="M224.3 141a115 115 0 1 0 -.6 230 115 115 0 1 0 .6-230zm-.6 40.4a74.6 74.6 0 1 1 .6 149.2 74.6 74.6 0 1 1 -.6-149.2zm93.4-45.1a26.8 26.8 0 1 1 53.6 0 26.8 26.8 0 1 1 -53.6 0zm129.7 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM399 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z" />
            </svg>
          </a>

          <a href="https://twitter.com/myfactree" target="_blank">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
              <path d="M357.2 48L427.8 48 273.6 224.2 455 464 313 464 201.7 318.6 74.5 464 3.8 464 168.7 275.5-5.2 48 140.4 48 240.9 180.9 357.2 48zM332.4 421.8l39.1 0-252.4-333.8-42 0 255.3 333.8z" />
            </svg>
          </a>
        </div>
      </div>

      {/* Floating Icons */}
      <div className="floating-icon icon-1">🔍</div>
      <div className="floating-icon icon-2">🛡</div>
      <div className="floating-icon icon-3">📧</div>
      <div className="floating-icon icon-4">⚠</div>
      <div className="floating-icon icon-5">🧠</div>
    </div>
  );
};
