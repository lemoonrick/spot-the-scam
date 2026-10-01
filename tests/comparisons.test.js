import { describe, expect, it } from 'vitest';
import { comparisonLine } from '../src/lib/comparisons.js';

// The line under each answer on the results screen. Wrong wording here
// is either dishonest ("100% of players" from one person) or wrong-footed
// ("you fell for" a genuine Swiggy message), so every case is pinned.

const line = (correct, actual, wrongPct) => comparisonLine({ correct, actual, wrongPct });

describe('comparison lines', () => {
  describe('when the player got it wrong', () => {
    it('reassures them when most players were fooled too', () => {
      expect(line(false, 'phishing', 70)).toBe(
        "You trusted this one. So did 70% of players — it's a convincing fake.",
      );
    });

    it('puts it plainly when a fair share were fooled', () => {
      expect(line(false, 'phishing', 35)).toBe('35% of players trusted this one too.');
    });

    it('points back to the red flags when nearly everyone caught it', () => {
      expect(line(false, 'phishing', 10)).toBe(
        'Most players caught this one — worth another look at the red flags.',
      );
    });
  });

  describe('when the player got it right', () => {
    it('credits them when most players missed it', () => {
      expect(line(true, 'phishing', 70)).toBe('Only 30% of players spotted this — you did.');
    });

    it('notes what others missed in between', () => {
      expect(line(true, 'phishing', 35)).toBe('You caught what 35% of players missed.');
    });

    it('says nothing about an easy question answered right', () => {
      // "Most players got this right too" on every row is noise.
      expect(line(true, 'phishing', 10)).toBeNull();
      expect(line(true, 'legitimate', 10)).toBeNull();
    });
  });

  describe('a genuine message is not something you "fall for"', () => {
    // Being wrong about a real message means flagging it as a scam.
    it('words a wrong answer as flagging, not trusting', () => {
      expect(line(false, 'legitimate', 65)).toBe(
        'You flagged this real message as a scam. So did 65% of players.',
      );
      expect(line(false, 'legitimate', 35)).toBe('35% of players suspected this real message too.');
      expect(line(false, 'legitimate', 10)).toBe('Most players recognised this as genuine.');
    });

    it('words a right answer as trusting correctly', () => {
      expect(line(true, 'legitimate', 65)).toBe(
        'Only 35% of players trusted this correctly — you did.',
      );
      expect(line(true, 'legitimate', 35)).toBe("35% of players wrongly flagged this. You didn't.");
    });

    it('never says "fell for" or "trusted this one" about a real message', () => {
      for (const correct of [true, false]) {
        for (const w of [0, 10, 35, 65, 100]) {
          expect(line(correct, 'legitimate', w) ?? '').not.toMatch(/fell for|trusted this one/);
        }
      }
    });
  });

  describe('honesty rules', () => {
    it('says nothing when there is no figure (fewer than 50 answers)', () => {
      expect(line(false, 'phishing', undefined)).toBeNull();
      expect(line(false, 'phishing', null)).toBeNull();
    });

    it('never claims 0% or 100%', () => {
      // At 50 answers the figure is only known to about ±14 points.
      for (const correct of [true, false]) {
        for (const actual of ['phishing', 'legitimate']) {
          for (const w of [0, 100]) {
            expect(line(correct, actual, w) ?? '').not.toMatch(/\b(0|100)%/);
          }
        }
      }
      expect(line(false, 'phishing', 100)).toContain('almost every player');
      expect(line(true, 'phishing', 100)).toBe('Almost no players spotted this — you did.');
    });

    it('never ranks anyone ("top 10%")', () => {
      for (const correct of [true, false]) {
        for (const w of [0, 5, 20, 50, 95, 100]) {
          expect(line(correct, 'phishing', w) ?? '').not.toMatch(/\btop\b|\bpercentile\b|\branked?\b/i);
        }
      }
    });

    it('talks about players, not people', () => {
      for (const correct of [true, false]) {
        for (const w of [30, 70]) {
          expect(line(correct, 'phishing', w) ?? '').not.toMatch(/\bpeople\b/);
        }
      }
    });
  });
});
