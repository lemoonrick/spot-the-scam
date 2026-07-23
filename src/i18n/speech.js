// Read-aloud (text-to-speech) for low-literacy / rural users, via the browser's built-in
// Web Speech API (speechSynthesis) — no dependency, no network. Speaks the active-locale
// text that strings.js + localizeScam.js already resolve to plain strings.

export const SPEECH_ENABLED = true;

export function isSpeechSupported() {
  return (
    typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    typeof window.SpeechSynthesisUtterance === 'function'
  );
}

// Pick the best available voice for a locale. Voices load asynchronously, so this may
// return undefined on first call — that's fine, the utterance.lang still steers output.
function pickVoice(bcp47) {
  const voices = window.speechSynthesis.getVoices() || [];
  const lang = bcp47.toLowerCase();
  const base = lang.split('-')[0];
  return (
    voices.find((v) => v.lang?.toLowerCase() === lang) ||
    voices.find((v) => v.lang?.toLowerCase().startsWith(base)) ||
    undefined
  );
}

// speak(text, locale) — cancels anything already speaking, then reads `text`.
// onEnd fires when playback finishes or is cancelled, so the UI can reset its state.
export function speak(text, locale = 'en', onEnd) {
  if (!SPEECH_ENABLED || !isSpeechSupported() || !text) return;

  const synth = window.speechSynthesis;
  synth.cancel();

  const u = new SpeechSynthesisUtterance(text);
  u.lang = locale === 'mr' ? 'mr-IN' : 'en-IN';
  u.rate = 0.92; // a touch slower — clearer for first-time / rural listeners
  u.pitch = 1;
  const voice = pickVoice(u.lang);
  if (voice) u.voice = voice;
  if (onEnd) {
    u.onend = onEnd;
    u.onerror = onEnd;
  }
  synth.speak(u);
}

export function stopSpeaking() {
  if (isSpeechSupported()) window.speechSynthesis.cancel();
}

// Build a single spoken string for a red-flag: its short label then the explanation.
export function flagsToSpeech(flag) {
  if (!flag) return '';
  return `${flag.label}. ${flag.text}`;
}
