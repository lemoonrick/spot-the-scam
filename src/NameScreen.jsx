import { useEffect, useRef, useState } from 'react';
import './NameScreen.css';

export default function NameScreen({ onContinue, onSkip }) {
  const [name, setName] = useState('');
  const [showHow, setShowHow] = useState(false);
  const inputRef = useRef(null);
  const closeRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Escape closes the explainer, and focus moves into it when it opens.
  useEffect(() => {
    if (!showHow) return;
    closeRef.current?.focus();
    const onKey = (e) => e.key === 'Escape' && setShowHow(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showHow]);

  const trimmed = name.trim();

  const submit = (e) => {
    e.preventDefault();
    if (trimmed) onContinue(trimmed);
  };

  return (
    <div className="ns-page">
      <form className="ns-card" onSubmit={submit}>
        <h1 className="ns-title">What should we call you?</h1>
        <p className="ns-body">
          The messages you are about to see will use your name, the way real
          scams do. Make one up if you prefer.
        </p>

        <label className="ns-label" htmlFor="ns-name">
          First name
        </label>
        <input
          id="ns-name"
          ref={inputRef}
          className="ns-input"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={32}
          autoComplete="off"
          spellCheck="false"
          enterKeyHint="go"
        />

        <p className="ns-privacy">
          Your name stays on your phone. It is never sent to us or saved
          anywhere.{' '}
          <button
            type="button"
            className="ns-link"
            onClick={() => setShowHow(true)}
          >
            How does this work?
          </button>
        </p>

        <button className="ns-btn" type="submit" disabled={!trimmed}>
          Continue
        </button>
        <button className="ns-skip" type="button" onClick={onSkip}>
          Skip this
        </button>
      </form>

      {showHow && (
        <div
          className="ns-overlay"
          onClick={(e) => e.target === e.currentTarget && setShowHow(false)}
        >
          <div
            className="ns-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ns-dialog-title"
          >
            <h2 className="ns-dialog-title" id="ns-dialog-title">
              How does this work?
            </h2>
            <p>
              Your name is held in your browser&rsquo;s memory for this quiz
              only. It is never sent to us, never stored, and it disappears the
              moment you close this tab.
            </p>
            <p>
              We use it because real scams usually know your name, and that is
              part of why they work. A message addressed to you personally is
              far harder to dismiss than one that says &ldquo;Dear
              customer&rdquo;.
            </p>
            <p>
              Skipping is completely fine. The quiz works exactly the same
              without it.
            </p>
            <button
              className="ns-dialog-close"
              ref={closeRef}
              type="button"
              onClick={() => setShowHow(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
