import { describe, expect, it } from 'vitest';
import { scams } from '../src/scams.js';
import {
  EMPTY_IDENTITY,
  deriveEmail,
  fillTokens,
  makeIdentity,
  personalizeScam,
} from '../src/identity.js';

describe('identity', () => {
  it('treats a blank or whitespace name as no name at all', () => {
    expect(makeIdentity('').personalised).toBe(false);
    expect(makeIdentity('   ').personalised).toBe(false);
    expect(makeIdentity(null).personalised).toBe(false);
  });

  it('tidies the name and caps its length', () => {
    expect(makeIdentity('  Priya   Sharma ').name).toBe('Priya Sharma');
    expect(makeIdentity('x'.repeat(200)).name.length).toBeLessThanOrEqual(32);
  });

  it('builds a usable address from any name', () => {
    expect(deriveEmail('Priya')).toBe('priya@gmail.com');
    expect(deriveEmail('Priya Sharma')).toBe('priya.sharma@gmail.com');
    expect(deriveEmail('123')).toBe('');
  });
});

describe('scam copy tokens', () => {
  it('uses the name when there is one, the fallback when there is not', () => {
    const id = makeIdentity('Priya');
    expect(fillTokens('Dear {name|customer},', id)).toBe('Dear Priya,');
    expect(fillTokens('Dear {name|customer},', EMPTY_IDENTITY)).toBe('Dear customer,');
  });

  // A token left unresolved would show a player literal "{name|there}"
  // inside a message that is meant to look real.
  it('leaves no unresolved tokens on either path', () => {
    for (const identity of [makeIdentity('Priya'), EMPTY_IDENTITY]) {
      for (const scam of scams) {
        for (const part of personalizeScam(scam, identity).message ?? []) {
          expect(part.text, `scam ${scam.id}`).not.toMatch(/\{(name|email)\|/);
        }
      }
    }
  });

  it('does not mutate the source data', () => {
    const before = JSON.stringify(scams);
    scams.forEach((s) => personalizeScam(s, makeIdentity('Priya')));
    expect(JSON.stringify(scams)).toBe(before);
  });
});
