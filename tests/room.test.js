import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  ROOM_CODE_ALPHABET,
  normaliseRoomCode,
  readRoomParam,
  roomCodeProblem,
  roomLink,
} from '../src/lib/room.js';
import { ROOM_CODE_ALPHABET as SERVER_ALPHABET } from '../supabase/functions/submit-session/scoring.ts';
import { routeFor } from '../src/lib/route.js';

describe('room codes on the player side', () => {
  it('uses exactly the alphabet the server and database use', () => {
    // If these drift, a facilitator hands out a code the quiz refuses.
    expect(ROOM_CODE_ALPHABET).toBe(SERVER_ALPHABET);
  });

  it('tidies a code however it was typed', () => {
    expect(normaliseRoomCode('kftr9m')).toBe('KFTR9M');
    expect(normaliseRoomCode(' kft r9m ')).toBe('KFTR9M');
    expect(normaliseRoomCode('KFT-R9M')).toBe('KFTR9M');
    expect(normaliseRoomCode('KFTR0M')).toBeNull();
  });

  it('explains a misread character while the code is being typed', () => {
    // Caught before Join is pressed, not after.
    expect(roomCodeProblem('KFTR0')).toMatch(/O or 0/);
    expect(roomCodeProblem('KFTRI')).toMatch(/I, 1 or L/);
    expect(roomCodeProblem('KFTR9MX')).toMatch(/six/);
    expect(roomCodeProblem('KFT')).toBeNull(); // just not finished yet
    expect(roomCodeProblem('')).toBeNull();
  });

  it('reads the room from a link', () => {
    expect(readRoomParam('?room=ry767f')).toBe('RY767F');
    expect(readRoomParam('?room=HELLO1')).toBeNull();
    expect(readRoomParam('')).toBeNull();
  });

  afterEach(() => vi.unstubAllEnvs());

  it('builds links inside the app folder, not the domain root', () => {
    // The app lives at myfactree.org/spot-the-scam/. A link to
    // myfactree.org/?room=… would land on the main website instead.
    // Tests run with the app at the root by default, so the live
    // folder is set here explicitly or this would prove nothing.
    vi.stubEnv('BASE_URL', '/spot-the-scam/');
    expect(roomLink('KFTR9M', 'https://myfactree.org')).toBe(
      'https://myfactree.org/spot-the-scam/?room=KFTR9M',
    );
  });
});

describe('which page to show', () => {
  const at = (pathname, hash = '') => routeFor({ pathname, hash }, '/spot-the-scam/');

  it('shows the quiz by default, including with a room code', () => {
    expect(at('/spot-the-scam/')).toBe('quiz');
    expect(at('/spot-the-scam')).toBe('quiz');
  });

  it('finds the impact and admin pages inside the app folder', () => {
    expect(at('/spot-the-scam/impact')).toBe('impact');
    expect(at('/spot-the-scam/impact/')).toBe('impact');
    expect(at('/spot-the-scam/admin')).toBe('admin');
  });

  it('accepts the #/ spelling for hosts that cannot rewrite paths', () => {
    expect(at('/spot-the-scam/', '#/impact')).toBe('impact');
    expect(at('/spot-the-scam/', '#admin')).toBe('admin');
  });

  it('does not match a page at the domain root', () => {
    expect(at('/impact')).toBe('quiz');
  });

  it('works when the app sits at a domain root', () => {
    expect(routeFor({ pathname: '/impact', hash: '' }, '/')).toBe('impact');
    expect(routeFor({ pathname: '/', hash: '' }, '/')).toBe('quiz');
  });
});
