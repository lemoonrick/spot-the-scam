import { isConfigured, restInsert } from './supabase';

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

  try {
    await restInsert('sessions', {
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

      device: summary.device,
      language: summary.language,
      // NOTE: completedAt is deliberately not sent. The database stamps
      // created_at itself — a timestamp from the browser can be wrong or
      // faked, and this one has to be trustworthy for the dashboard.
    });
    return { saved: true };
  } catch (err) {
    console.warn('[spot-the-scam] session not saved:', err.message);
    return { saved: false, reason: err.message };
  }
}
