// Resolve a scam object's translatable fields to plain strings/arrays for one locale,
// so presentational components (SmsScam, WhatsAppScam, FlagCard, …) receive the exact
// shape they already expect and need no i18n awareness of their own.
//
// A translatable field is stored as { en, mr }. Any other value (plain string, array,
// number, an object without en/mr) passes through unchanged — so this is safe to run
// even before scams.js has been converted to the bilingual shape.

function isLocaleField(v) {
  return (
    v != null &&
    typeof v === 'object' &&
    !Array.isArray(v) &&
    ('en' in v || 'mr' in v)
  );
}

function pick(field, locale) {
  if (isLocaleField(field)) return field[locale] ?? field.en;
  return field;
}

export function localizeScam(scam, locale) {
  if (!scam) return scam;

  const out = { ...scam };

  // Simple translatable string / array fields
  for (const key of [
    'guideText',
    'message',
    'note',
    'subject',
    'sender',
    'linkTitle',
  ]) {
    if (scam[key] !== undefined) out[key] = pick(scam[key], locale);
  }

  if (scam.explanation) {
    out.explanation = {
      ...scam.explanation,
      short: pick(scam.explanation.short, locale),
    };
  }

  if (scam.article) {
    out.article = {
      ...scam.article,
      title: pick(scam.article.title, locale),
    };
  }

  if (Array.isArray(scam.flags)) {
    out.flags = scam.flags.map((f) => ({
      ...f,
      label: pick(f.label, locale),
      text: pick(f.text, locale),
    }));
  }

  return out;
}
