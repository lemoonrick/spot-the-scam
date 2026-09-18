# Tests

Run with `npm test`, or `npm run test:watch` while working.

These are deliberately not UI tests. They cover the places where a
mistake is silent: quiz data, the before/after maths, and the boundary
between the browser and the server.

| File | Guards against |
|---|---|
| `scams.test.js` | A flag with nothing to point at, so the explanation card opens against blank space. An unknown scam type. A message referencing a flag that was never declared. |
| `session.test.js` | The two halves drifting out of balance, which would make every improvement figure meaningless. Declines being quietly floored at zero. Confusing a trusted fake with a false alarm. |
| `identity.test.js` | A player seeing a literal `{name|there}` inside a message meant to look real. The source data being mutated. |
| `answer-key.test.js` | The server's copy of the answer key drifting from the quiz. If a verdict changed in one place only, correct answers would be recorded as wrong and the public figures would quietly be false. Also asserts the server still refuses to take a score from the browser. |

## Adding a scam

`scams.test.js` and `answer-key.test.js` will both fail until you add it
to `supabase/functions/submit-session/index.ts` as well. That is
intentional: the server decides right from wrong, so it has to know
about every message the quiz can show.
