// The figures behind the Overall tab, read with the admin's own login.
//
// Nothing is cached between visits. The public version of this page
// cached for a minute, which was right for a page anyone could open;
// for a page behind a login it would mean figures from one login still
// on screen after the next.

import { select } from './api';

const EMPTY_SUMMARY = {
  sessions: 0,
  scams_reviewed: 0,
  avg_score: null,
  avg_baseline: null,
  avg_trained: null,
  avg_improvement: null,
  improved_count: 0,
  improved_pct: null,
  scams_waved_through: 0,
  avg_first_decision_ms: null,
  avg_later_decision_ms: null,
  mobile_sessions: 0,
  personalised_sessions: 0,
  first_session_at: null,
  last_session_at: null,
};

/** Fetch every view in parallel. One failure fails the page, not silently. */
export async function loadImpact() {
  const [summary, byType, personalisation, daily, bands, byScam, errors] =
    await Promise.all([
      select('impact_summary'),
      select('impact_by_type', 'select=*&order=accuracy_pct.asc'),
      select('impact_personalisation'),
      select('impact_daily', 'select=*&order=day.asc'),
      select('impact_score_bands', 'select=*&order=band.asc'),
      select('impact_by_scam', 'select=*&order=wrong_pct.desc'),
      select('impact_error_types'),
    ]);

  return {
    summary: { ...EMPTY_SUMMARY, ...(summary[0] || {}) },
    byType: byType || [],
    personalisation: personalisation || [],
    daily: daily || [],
    bands: bands || [],
    byScam: byScam || [],
    errors: errors[0] || null,
  };
}
