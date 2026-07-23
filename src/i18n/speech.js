// Read-aloud (text-to-speech) via the browser's built-in Web Speech API — no dependency,
// no network. Speaks the active-locale text that strings.js + localizeScam.js resolve to.
//
// Marathi (mr-IN) voices are rarely installed on desktop/laptop OSes, so a naive
// utterance.lang = 'mr-IN' produces silence. We warm up the voice list and fall back
// through mr → hi (Hindi shares the Devanagari script and reads Marathi acceptably) →
// any Indian/available voice, so "Listen" works on far more devices.

export const SPEECH_ENABLED = true;

export function isSpeechSupported() {
  return (
    typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    typeof window.SpeechSynthesisUtterance === 'function'
  );
}

// Voices load asynchronously in Chrome/Edge — cache them and refresh on voiceschanged.
let cachedVoices = [];
function refreshVoices() {
  if (isSpeechSupported()) cachedVoices = window.speechSynthesis.getVoices() || [];
}
if (isSpeechSupported()) {
  refreshVoices();
  window.speechSynthesis.onvoiceschanged = refreshVoices;
}

// Preference chains. For Marathi, Hindi is the best practical fallback (same script).
const VOICE_PREFS = {
  mr: ['mr-in', 'mr', 'hi-in', 'hi'],
  en: ['en-in', 'en-gb', 'en-us', 'en'],
};

function resolveVoice(locale) {
  const voices = cachedVoices.length
    ? cachedVoices
    : isSpeechSupported()
      ? window.speechSynthesis.getVoices() || []
      : [];
  for (const pref of VOICE_PREFS[locale] || VOICE_PREFS.en) {
    const exact = voices.find((v) => v.lang?.toLowerCase() === pref);
    if (exact) return exact;
    const base = pref.split('-')[0];
    const partial = voices.find((v) => v.lang?.toLowerCase().startsWith(base));
    if (partial) return partial;
  }
  return undefined;
}

// speak(text, locale, onEnd) — cancels anything already speaking, then reads `text`.
export function speak(text, locale = 'en', onEnd) {
  if (!SPEECH_ENABLED || !isSpeechSupported() || !text) {
    if (onEnd) onEnd();
    return;
  }
  const synth = window.speechSynthesis;
  synth.cancel();

  const u = new SpeechSynthesisUtterance(text);
  const voice = resolveVoice(locale);
  if (voice) {
    u.voice = voice;
    u.lang = voice.lang; // match the chosen voice (e.g. hi-IN reading Marathi)
  } else {
    u.lang = locale === 'mr' ? 'mr-IN' : 'en-IN';
  }
  u.rate = 0.92; // slightly slower — clearer for first-time / rural listeners
  u.pitch = 1;
  if (onEnd) {
    u.onend = onEnd;
    u.onerror = onEnd;
  }
  synth.speak(u);
}

export function stopSpeaking() {
  if (isSpeechSupported()) window.speechSynthesis.cancel();
}

// Build a single spoken string for a red flag: its short label then the explanation.
export function flagsToSpeech(flag) {
  if (!flag) return '';
  return `${flag.label}. ${flag.text}`;
}
