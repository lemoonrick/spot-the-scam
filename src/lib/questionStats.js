// ============================================================
//  How each question fares across all players
//
//  Read once per page load from the public question_stats view, which
//  holds only per-question percentages and withholds any question with
//  fewer than 50 answers. Asked for when a run starts, so it is usually
//  ready by the results screen without the player waiting.
//
//  Failure is silent: the results screen simply shows no comparison
//  lines. Results never wait on this.
// ============================================================

import { isConfigured, restSelect } from './supabase';

let request = null;

/** Map of scam id → { wrongPct, answered }. Empty if unavailable. */
export function loadQuestionStats() {
  if (!isConfigured) return Promise.resolve(new Map());
  request ??= restSelect('question_stats', 'select=scam_id,wrong_pct,answered')
    .then(
      (rows) =>
        new Map(
          rows.map((r) => [
            r.scam_id,
            { wrongPct: r.wrong_pct, answered: r.answered },
          ]),
        ),
    )
    .catch(() => {
      // Let a later run try again rather than caching the failure.
      request = null;
      return new Map();
    });
  return request;
}
