import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { scams } from '../src/scams.js';

// Which screen draws each kind of scam. A flag is only useful if the
// screen that draws it knows how to highlight it.
const SCREEN = {
  sms: 'src/components/SmsScam.jsx',
  email: 'src/components/EmailScam.jsx',
  whatsapp: 'src/components/WhatsAppScam.jsx',
  instagram: 'src/components/InstagramScam.jsx',
  popup: 'src/components/PopupScam.jsx',
  upi: 'src/components/UpiScam.jsx',
};

/** Every flag id used anywhere, for the no-hardcoding rule below. */
const ALL_FLAG_IDS = new Set(scams.flatMap((s) => s.flags.map((f) => f.id)));

describe('scam data', () => {
  it('has a screen for every type', () => {
    for (const s of scams) {
      expect(SCREEN[s.type], `scam ${s.id} has unknown type "${s.type}"`).toBeDefined();
    }
  });

  it('gives every scam a unique id', () => {
    const ids = scams.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('only references flags that are declared', () => {
    for (const s of scams) {
      const declared = new Set(s.flags.map((f) => f.id));
      for (const part of s.message ?? []) {
        if (!part.flag) continue;
        expect(
          declared.has(part.flag),
          `scam ${s.id} message references undeclared flag "${part.flag}"`,
        ).toBe(true);
      }
    }
  });

  it('gives every declared flag something to point at', () => {
    for (const s of scams) {
      const inMessage = new Set((s.message ?? []).map((p) => p.flag).filter(Boolean));
      const anchors = s.anchors ?? {};

      for (const flag of s.flags) {
        expect(
          inMessage.has(flag.id) || flag.id in anchors,
          `scam ${s.id} flag "${flag.id}" has no anchor: it marks no phrase ` +
            `in its message and no slot in its \`anchors\` map. The ` +
            `explanation card will point at empty space.`,
        ).toBe(true);
      }
    }
  });

  it('only anchors flags that exist', () => {
    for (const s of scams) {
      const declared = new Set(s.flags.map((f) => f.id));
      for (const flagId of Object.keys(s.anchors ?? {})) {
        expect(
          declared.has(flagId),
          `scam ${s.id} anchors "${flagId}", which is not one of its flags`,
        ).toBe(true);
      }
    }
  });

  it('anchors only to slots its screen actually provides', () => {
    // An anchor names a slot the screen draws. A typo, or a slot
    // renamed on one side only, would leave the card with no target.
    for (const s of scams) {
      const screenSource = readFileSync(SCREEN[s.type], 'utf8');
      for (const [flagId, slotName] of Object.entries(s.anchors ?? {})) {
        expect(
          screenSource.includes(`'${slotName}'`),
          `scam ${s.id} anchors "${flagId}" to slot "${slotName}", but ` +
            `${SCREEN[s.type]} never renders that slot.`,
        ).toBe(true);
      }
    }
  });

  it('never names a flag id inside a screen', () => {
    // Screens ask about slots, never about specific flags. Naming a
    // flag in JSX means renaming it in scams.js silently kills the
    // highlight — no error, no failing test, just a card over nothing.
    for (const file of new Set(Object.values(SCREEN))) {
      const source = readFileSync(file, 'utf8');
      for (const flagId of ALL_FLAG_IDS) {
        expect(
          source.includes(`'${flagId}'`),
          `${file} names the flag "${flagId}" directly. Add it to that ` +
            `scam's \`anchors\` map and ask for the slot instead.`,
        ).toBe(false);
      }
    }
  });

  it('declares at least one flag and a short explanation for each scam', () => {
    for (const s of scams) {
      expect(s.flags.length, `scam ${s.id} has no flags`).toBeGreaterThan(0);
      expect(s.explanation?.short, `scam ${s.id} has no explanation`).toBeTruthy();
      expect(['phishing', 'legitimate']).toContain(s.verdict);
    }
  });

  it('has enough of each verdict to split into two matched halves', () => {
    const phishing = scams.filter((s) => s.verdict === 'phishing').length;
    const legit = scams.filter((s) => s.verdict === 'legitimate').length;
    expect(phishing, 'need an even split of phishing across halves').toBeGreaterThan(1);
    expect(legit, 'need an even split of legitimate across halves').toBeGreaterThan(1);
    expect(scams.length % 2, 'an odd number of scams cannot split evenly').toBe(0);
  });
});

describe('card placement and colour', () => {
  it('marks a block for the card to clear on every screen with a message', () => {
    // Without this the card drops straight under the highlighted phrase
    // and lands on the rest of the message. The Swiggy chat lit up the
    // shop name in line one and hid lines two and three behind it.
    const typesWithMessages = new Set(
      scams.filter((s) => (s.message ?? []).length > 0).map((s) => s.type),
    );
    for (const type of typesWithMessages) {
      const source = readFileSync(SCREEN[type], 'utf8');
      expect(
        source.includes('data-flag-clear'),
        `${SCREEN[type]} draws a message but marks no block for the ` +
          `explanation card to clear, so the card will cover the message.`,
      ).toBe(true);
    }
  });

  it('colours highlights by verdict rather than always scam-red', () => {
    // A genuine message's highlights are the reasons to trust it. Shown
    // in alarm red they said the opposite of the card beside them.
    const app = readFileSync('src/App.css', 'utf8');
    expect(app).toMatch(/\.scam-content\[data-verdict='legitimate'\]/);
    expect(readFileSync('src/ScamScreen.jsx', 'utf8')).toContain(
      'data-verdict={scam.verdict}',
    );
  });

  it('draws a leader line when the card cannot sit beside the phrase', () => {
    // Clearing the message block means that when the highlight is the
    // first line of a long email, the card lands a long way below it and
    // its little arrow points at whatever happens to be in between. The
    // card measures that distance and draws a line back to the phrase.
    const hook = readFileSync('src/hooks/useFlagCardPosition.js', 'utf8');
    expect(hook, 'the hook must report how far the card sits from the ' +
      'highlight, or the card cannot know to draw the line').toMatch(/gap/);

    const card = readFileSync('src/components/FlagCard.jsx', 'utf8');
    expect(card).toContain('flag-leader');
    expect(card).toContain('coords.gap');

    const css = readFileSync('src/App.css', 'utf8');
    expect(css).toMatch(/\.flag-leader\b/);
  });

  it('paints every screen from the same two colour variables', () => {
    // The rule above only works because each screen defers to these.
    for (const file of new Set(Object.values(SCREEN))) {
      const css = readFileSync(file.replace(/\.jsx$/, '.css'), 'utf8');
      if (!/-flag\.active/.test(css)) continue;
      expect(css, `${file}'s highlight does not use var(--flag-bg)`).toMatch(
        /var\(--flag-bg\)/,
      );
    }
  });
});

describe('whatsapp link previews', () => {
  // WhatsApp draws a link as a preview card under the bubble. The site
  // and title used to be hardcoded in the screen, so a second WhatsApp
  // scenario with a link would have shown the first one's branding.
  const withPreview = scams.filter((s) => s.linkPreview);

  it('names a flag that marks a real part of the message', () => {
    for (const s of withPreview) {
      const part = (s.message ?? []).find((p) => p.flag === s.linkPreview.flag);
      expect(
        part,
        `scam ${s.id} previews flag "${s.linkPreview.flag}", which is not a ` +
          `part of its message, so the preview card would never render`,
      ).toBeDefined();
    }
  });

  it('carries its own site and title', () => {
    for (const s of withPreview) {
      expect(s.linkPreview.site, `scam ${s.id} preview has no site`).toBeTruthy();
      expect(s.linkPreview.title, `scam ${s.id} preview has no title`).toBeTruthy();
    }
  });

  it('keeps no scenario wording in the screen itself', () => {
    const source = readFileSync('src/components/WhatsAppScam.jsx', 'utf8');
    for (const s of withPreview) {
      expect(source).not.toContain(s.linkPreview.site);
      expect(source).not.toContain(s.linkPreview.title);
    }
  });
});

describe('highlight styles', () => {
  // Each screen owns its own highlight rule now. Moving them out of the
  // shared stylesheet is easy to get half-right: a screen keeps applying
  // a class that no longer has a rule, and the flagged phrase silently
  // stops lighting up.
  const FLAG_CLASSES = {
    'src/components/SmsScam.css': ['sms-flag'],
    'src/components/WhatsAppScam.css': ['wa-flag'],
    'src/components/InstagramScam.css': ['insta-flag'],
    'src/components/PopupScam.css': ['popup-flag'],
    'src/components/EmailScam.css': ['gmail-flag', 'rich-flag'],
  };

  it('gives every flag class an active rule in its own stylesheet', () => {
    for (const [file, classes] of Object.entries(FLAG_CLASSES)) {
      const css = readFileSync(file, 'utf8');
      for (const cls of classes) {
        expect(css, `${file} has no .${cls}.active rule`).toMatch(
          new RegExp(`\\.${cls}\\.active`),
        );
      }
    }
  });

  it('leaves no dangling selector list in the shared stylesheet', () => {
    // A selector list ending in a comma before a comment merges into
    // whatever rule follows. That once turned every flagged phrase into
    // a full-screen fixed overlay.
    const css = readFileSync('src/App.css', 'utf8');
    expect(css).not.toMatch(/,\s*\n\s*\/\*/);
  });
});
