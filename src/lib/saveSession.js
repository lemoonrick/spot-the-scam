import { isConfigured, missingColumnFrom, restInsert } from './supabase';

// Without these the row says nothing useful, so we would rather lose it
// than store something misleading. Everything else is droppable.
const REQUIRED = new Set([
  'score',
  'correct',
  'total',
  'baseline_score',
  'trained_score',
  'improvement',
]);

/**
 * Store one finished quiz run.
 *
 * Anonymous by design: no name, email, account or IP is sent. The row
 * describes what happened, not who did it, so there is nothing to leak
 * and nothing to ask consent for.
 *
 * Never throws and never blocks the UI — if saving fails, the user still
 * sees their full results.
 */
export async function saveSession(summary) {
  if (!isConfigured) return { saved: false, reason: 'not-configured' };

  const row = {
    schema_version: summary.schemaVersion,

    score: summary.score,
    correct: summary.correct,
    total: summary.total,

    baseline_score: summary.baselineScore,
    trained_score: summary.trainedScore,
    improvement: summary.improvement,

    median_response_ms_baseline: summary.medianResponseMsBaseline,
    median_response_ms_trained: summary.medianResponseMsTrained,
    total_time_ms: summary.totalTimeMs,

    scams_waved_through: summary.scamsWavedThrough,
    weakest_type: summary.weakestType,
    type_breakdown: summary.typeBreakdown,

    personalised: summary.personalised,

    device: summary.device,
    language: summary.language,
    // NOTE: completedAt is deliberately not sent. The database stamps
    // created_at itself — a timestamp from the browser can be wrong or
    // faked, and this one has to be trustworthy for the dashboard.
  };

  try {
    let attempt = { ...row };
    const dropped = [];

    // A table that predates a newer column would otherwise reject the whole
    // row, losing every session over one optional field. Drop what the
    // database does not know about and send the rest, so a schema that has
    // drifted costs us a column instead of all our evidence.
    for (let i = 0; i <= 4; i++) {
      const res = await restInsert('sessions', attempt);

      if (res.ok) {
        if (dropped.length) {
          console.warn(
            `[spot-the-scam] saved without ${dropped.join(', ')}. ` +
              'Your sessions table is behind the app: run the files in ' +
              'supabase/ to add the missing column(s).',
          );
        }
        return { saved: true, dropped };
      }

      const column = missingColumnFrom(res.body);
      if (!column || REQUIRED.has(column) || !(column in attempt)) {
        console.warn('[spot-the-scam] session not saved:', res.body);
        return { saved: false, reason: res.body };
      }

      delete attempt[column];
      dropped.push(column);
    }

    return { saved: false, reason: 'too many missing columns' };
  } catch (err) {
    // Offline, DNS failure, blocked by an extension.
    console.warn('[spot-the-scam] session not saved:', err.message);
    return { saved: false, reason: err.message };
  }
}
