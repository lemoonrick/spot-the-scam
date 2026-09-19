import { isConfigured, restSelect } from './supabase';

/**
 * How long a visitor may see slightly stale figures.
 *
 * Every visit used to fire seven requests. That is fine for a handful
 * of people and wasteful the moment the page is shared, which is the
 * whole point of it. The numbers move slowly, so a minute of staleness
 * costs nothing.
 */
const CACHE_MS = 60 * 1000;
let cache = null;

/**
 * Below this many sessions an average is noise, not a finding. The
 * dashboard still shows the numbers, but says plainly that they are
 * provisional. Publishing a confident "+34 points" off six runs would
 * discredit every other figure on the page.
 */
export const RELIABLE_SAMPLE = 30;

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
export async function loadImpact({ force = false } = {}) {
  if (!isConfigured) throw new Error('No database configured');

  if (!force && cache && Date.now() - cache.at < CACHE_MS) return cache.data;

  const [summary, byType, personalisation, daily, bands, byScam, errors] =
    await Promise.all([
      restSelect('impact_summary'),
      restSelect('impact_by_type', 'select=*&order=accuracy_pct.asc'),
      restSelect('impact_personalisation'),
      restSelect('impact_daily', 'select=*&order=day.asc'),
      restSelect('impact_score_bands', 'select=*&order=band.asc'),
      // Per-question detail only exists for plays recorded after
      // migration 004, so these two are allowed to come back empty
      // without failing the page.
      restSelect('impact_by_scam', 'select=*&order=wrong_pct.desc').catch(
        () => [],
      ),
      restSelect('impact_error_types').catch(() => []),
    ]);

  const data = {
    summary: { ...EMPTY_SUMMARY, ...(summary[0] || {}) },
    byType: byType || [],
    personalisation: personalisation || [],
    daily: daily || [],
    bands: bands || [],
    byScam: byScam || [],
    errors: errors[0] || null,
  };

  cache = { at: Date.now(), data };
  return data;
}
