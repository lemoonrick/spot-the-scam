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

/**
 * Flags that are declared but have nothing to point at on screen, so
 * the explanation card opens against blank space.
 *
 * These are issues 1 and 3 in the runbook and are deliberately left
 * alone for now. The list exists so the rule still applies to
 * everything else: a NEW unanchored flag fails the build. Delete an
 * entry here when its anchor is added.
 */
const KNOWN_UNANCHORED = new Set([
  '4:no-ask', // rich Netflix layout renders richHero, not the flagged message
]);

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
      const screenSource = readFileSync(SCREEN[s.type], 'utf8');

      for (const flag of s.flags) {
        if (KNOWN_UNANCHORED.has(`${s.id}:${flag.id}`)) continue;
        const anchored =
          inMessage.has(flag.id) || screenSource.includes(`'${flag.id}'`);
        expect(
          anchored,
          `scam ${s.id} flag "${flag.id}" has no anchor: not in its message, ` +
            `and ${SCREEN[s.type]} never mentions it. The explanation card ` +
            `will point at empty space.`,
        ).toBe(true);
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
