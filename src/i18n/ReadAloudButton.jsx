import { useEffect, useState } from 'react';
import { SpeakerHigh, Pause } from '@phosphor-icons/react';
import { useLocale } from './LocaleContext';
import {
  SPEECH_ENABLED,
  isSpeechSupported,
  speak,
  stopSpeaking,
} from './speech';

// 🔊 Listen button — reads `text` aloud in the active language. Tap again (or start
// another one) to stop. Renders nothing where speech is unsupported so it never shows
// a dead control.
export default function ReadAloudButton({ text }) {
  const { locale } = useLocale();
  const [speaking, setSpeaking] = useState(false);

  // Stop any speech if the language changes or the button unmounts.
  useEffect(() => {
    return () => stopSpeaking();
  }, [locale]);

  if (!SPEECH_ENABLED || !isSpeechSupported()) return null;

  const label = locale === 'mr' ? 'ऐका' : 'Listen';

  const toggle = () => {
    if (speaking) {
      stopSpeaking();
      setSpeaking(false);
      return;
    }
    setSpeaking(true);
    speak(text, locale, () => setSpeaking(false));
  };

  return (
    <button
      type="button"
      className={`read-aloud-btn ${speaking ? 'speaking' : ''}`}
      aria-label={label}
      aria-pressed={speaking}
      onClick={toggle}
    >
      <span className="read-aloud-icon" aria-hidden="true">
        {speaking ? (
          <Pause size={17} weight="fill" />
        ) : (
          <SpeakerHigh size={17} weight="regular" />
        )}
      </span>
      <span className="read-aloud-text">{label}</span>
    </button>
  );
}
