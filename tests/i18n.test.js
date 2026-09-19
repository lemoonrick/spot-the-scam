import { describe, expect, it } from 'vitest';
import { scams } from '../src/scams.js';
import { strings } from '../src/i18n/strings.js';
import { localizeScam } from '../src/i18n/localizeScam.js';

describe('translation table', () => {
  it('has the same keys in both languages', () => {
    const en = Object.keys(strings.en).sort();
    const mr = Object.keys(strings.mr).sort();
    const missingMr = en.filter((k) => !strings.mr[k]);
    const extraMr = mr.filter((k) => !strings.en[k]);
    expect(missingMr, 'keys with no Marathi').toEqual([]);
    expect(extraMr, 'Marathi keys with no English').toEqual([]);
  });

  it('leaves no empty strings', () => {
    for (const [locale, table] of Object.entries(strings)) {
      for (const [key, value] of Object.entries(table)) {
        expect(value.trim(), `${locale}.${key} is empty`).not.toBe('');
      }
    }
  });

  // The bank build's own wording should not reappear in the general app.
  it('carries none of the Maharashtra Gramin Bank branding', () => {
    const all = JSON.stringify(strings);
    expect(all).not.toMatch(/Maharashtra Gramin|महाराष्ट्र ग्रामीण/);
  });
});

describe('scam localisation', () => {
  // scams.js is still English-only. localizeScam has to pass it through
  // untouched, or switching language would blank the messages.
  it('leaves monolingual content exactly as it is', () => {
    for (const locale of ['en', 'mr']) {
      for (const scam of scams) {
        expect(localizeScam(scam, locale), `scam ${scam.id} in ${locale}`).toEqual(
          scam,
        );
      }
    }
  });

  it('picks the right language once a field is bilingual', () => {
    const scam = {
      ...scams[0],
      guideText: { en: 'Look closely', mr: 'नीट पहा' },
      flags: [{ id: 'x', label: { en: 'Urgency', mr: 'घाई' }, text: 'plain' }],
    };
    expect(localizeScam(scam, 'mr').guideText).toBe('नीट पहा');
    expect(localizeScam(scam, 'en').guideText).toBe('Look closely');
    expect(localizeScam(scam, 'mr').flags[0].label).toBe('घाई');
    // A field with no translation stays as it is rather than vanishing.
    expect(localizeScam(scam, 'mr').flags[0].text).toBe('plain');
  });

  it('falls back to English when a translation is missing', () => {
    const scam = { ...scams[0], guideText: { en: 'Only English' } };
    expect(localizeScam(scam, 'mr').guideText).toBe('Only English');
  });
});
