import { useEffect, useState } from 'react';
import './StartScreen.css';
import logo from './assets/logo.png';

const WORDS = ['Spot', 'the', 'Scam.'];

export default function StartScreen({ onStart }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // tiny delay so CSS transitions fire after first paint
    const t = setTimeout(() => setVisible(true), 60);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className={`hs-root ${visible ? 'hs-visible' : ''}`}>
      {/* Noise + glow layer */}
      <div className="hs-bg-glow hs-glow-red" />
      <div className="hs-bg-glow hs-glow-blue" />
      <div className="hs-noise" />

      {/* ── MAIN GRID ── */}
      <div className="hs-grid">
        {/* LEFT — copy */}
        <div className="hs-left">
          {/* Eyebrow */}
          <div className="hs-eyebrow hs-reveal hs-delay-0">
            <span className="hs-eyebrow-dot" />
            Media Literacy Challenge · by myfactree.org
          </div>

          {/* Headline — word by word */}
          <h1 className="hs-headline">
            {WORDS.map((word, i) => (
              <span key={i} className="hs-word-wrap">
                <span
                  className="hs-word"
                  style={{ animationDelay: `${0.18 + i * 0.13}s` }}
                >
                  {word === 'Scam.' ? (
                    <span className="hs-gradient-word">{word}</span>
                  ) : (
                    word
                  )}
                </span>
              </span>
            ))}
            <br />
            <span className="hs-word-wrap">
              <span
                className="hs-word hs-subtitle-line"
                style={{ animationDelay: '0.6s' }}
              >
                Before it spots you.
              </span>
            </span>
          </h1>

          {/* Sub copy */}
          <p className="hs-body hs-reveal hs-delay-4">
            Real World Examples, Phishing texts, fake emails, WhatsApp scams.
            Learn to recognise the tricks before someone uses them on you.
          </p>

          {/* Trust pills */}
          <div className="hs-pills hs-reveal hs-delay-5">
            {/* <span className="hs-pill">🎯 10 examples</span> */}
            <span className="hs-pill">⏱ ~5 minutes</span>
            <span className="hs-pill">🔒 No sign-up</span>
          </div>

          {/* CTA */}
          <div className="hs-cta-wrap hs-reveal hs-delay-6">
            <button className="hs-cta" onClick={onStart}>
              Start the Challenge
              <svg className="hs-cta-arrow" viewBox="0 0 20 20" fill="none">
                <path
                  d="M4 10h12M11 5l5 5-5 5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <p className="hs-cta-hint">
              Free · Works on mobile · No account needed
            </p>
          </div>
        </div>

        {/* RIGHT — fake phone mockup built in CSS */}
        <div className="hs-right hs-reveal hs-delay-2">
          <div className="hs-phone-tilt">
            {/* Glow behind phone */}
            <div className="hs-phone-glow" />

            <div className="hs-phone">
              {/* Status bar */}
              <div className="hs-ph-statusbar">
                <span>9:41</span>
                <div className="hs-ph-sb-right">
                  <span className="hs-ph-bar" style={{ height: 5 }} />
                  <span className="hs-ph-bar" style={{ height: 8 }} />
                  <span className="hs-ph-bar" style={{ height: 11 }} />
                  <span className="hs-ph-bar" style={{ height: 14 }} />
                </div>
              </div>

              {/* Notification banner */}
              <div className="hs-ph-notif">
                <div className="hs-ph-notif-icon">🏦</div>
                <div className="hs-ph-notif-body">
                  <div className="hs-ph-notif-app">ICICI Alerts</div>
                  <div className="hs-ph-notif-msg">
                    Your account will be{' '}
                    <span className="hs-ph-red">suspended in 2 hrs.</span>{' '}
                    Verify now:
                  </div>
                  <div className="hs-ph-notif-link">
                    https://icici-verify.co/login
                  </div>
                </div>
              </div>

              {/* Second notification, offset */}
              <div className="hs-ph-notif hs-ph-notif-2">
                <div className="hs-ph-notif-icon">📧</div>
                <div className="hs-ph-notif-body">
                  <div className="hs-ph-notif-app">Gmail · Amazon Billing</div>
                  <div className="hs-ph-notif-msg">
                    Action required: Confirm your{' '}
                    <span className="hs-ph-red">billing details</span>{' '}
                    immediately.
                  </div>
                </div>
              </div>

              {/* Warning badge */}
              <div className="hs-ph-warning">
                <span className="hs-ph-warning-dot" />
                <span>Can you spot what's wrong?</span>
              </div>
            </div>

            {/* Floating flag cards */}
            <div className="hs-flag-card hs-flag-1">
              <span className="hs-flag-label">⚠ Fake domain</span>
            </div>
            <div className="hs-flag-card hs-flag-2">
              <span className="hs-flag-label">⏰ Urgency tactic</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="hs-footer">
        <a
          href="https://myfactree.org"
          target="_blank"
          rel="noreferrer"
          className="hs-footer-logo"
        >
          <img src={logo} alt="FactTree" />
        </a>
        <div className="hs-footer-links">
          <a
            href="https://instagram.com/myfactree_"
            target="_blank"
            rel="noreferrer"
            className="hs-footer-link"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 448 512"
              fill="currentColor"
            >
              <path d="M224.3 141a115 115 0 1 0 -.6 230 115 115 0 1 0 .6-230zm-.6 40.4a74.6 74.6 0 1 1 .6 149.2 74.6 74.6 0 1 1 -.6-149.2zm93.4-45.1a26.8 26.8 0 1 1 53.6 0 26.8 26.8 0 1 1 -53.6 0zm129.7 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM399 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z" />
            </svg>
          </a>
          <a
            href="https://twitter.com/myfactree"
            target="_blank"
            rel="noreferrer"
            className="hs-footer-link"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 448 512"
              fill="currentColor"
            >
              <path d="M357.2 48L427.8 48 273.6 224.2 455 464 313 464 201.7 318.6 74.5 464 3.8 464 168.7 275.5-5.2 48 140.4 48 240.9 180.9 357.2 48zM332.4 421.8l39.1 0-252.4-333.8-42 0 255.3 333.8z" />
            </svg>
          </a>
        </div>
      </footer>
    </div>
  );
}
