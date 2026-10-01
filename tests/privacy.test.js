import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// Promises the quiz makes to players, checked across every file so a
// new one can't quietly break them.

function filesIn(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? filesIn(path) : [path];
  });
}

const source = filesIn('src').filter((f) => /\.(jsx?|tsx?)$/.test(f));

/**
 * A file's code without its comments. The comments here are full of
 * promises like "never stored in localStorage", which would otherwise
 * trip the very checks that enforce them.
 */
function code(file) {
  return readFileSync(file, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
}
// The admin's own login is the one thing allowed to remember anything,
// and it lives in its own folder.
const playerCode = source.filter((f) => !f.startsWith(join('src', 'admin')));

describe("the player's device", () => {
  it('has nothing stored on it', () => {
    // "Your name stays on your phone" is about memory, not storage: the
    // quiz forgets everything when the tab closes.
    for (const file of playerCode) {
      expect(code(file), file).not.toMatch(
        /\b(localStorage|sessionStorage|indexedDB)\b|document\.cookie/,
      );
    }
  });
});

describe("the player's name", () => {
  it('is never sent anywhere', () => {
    // Only "did they give a name" goes with a result, never the name.
    const save = code('src/lib/saveSession.js');
    expect(save).not.toMatch(/identity|\.name\b|email/);
  });
});

describe('the workshop room', () => {
  it('never ends up in the text a player shares', () => {
    // A shared result goes to friends and family, not the workshop.
    for (const file of ['src/components/ShareCard.jsx', 'src/components/drawShareCard.js']) {
      expect(code(file), file).not.toMatch(/\broom\b/i);
    }
  });
});

describe('the public download', () => {
  it('does not include the Supabase library', () => {
    // 58KB gzipped is a real cost on a rural connection, for a handful
    // of simple requests that plain fetch does fine.
    for (const file of source) {
      expect(code(file), file).not.toMatch(/@supabase\/supabase-js/);
    }
  });

  it('does not pull admin code into the quiz', () => {
    // The admin pages are a separate download, loaded only on /admin.
    for (const file of playerCode) {
      const text = readFileSync(file, 'utf8');
      const staticImports = text.match(/^import .* from ['"].*admin.*['"]/gm) ?? [];
      expect(staticImports, file).toEqual([]);
    }
  });
});
