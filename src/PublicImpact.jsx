import { useEffect, useState } from 'react';
import {
  CalendarBlank,
  ChalkboardTeacher,
  ChartBar,
  TrendUp,
  UsersThree,
  Warning,
} from '@phosphor-icons/react';
import { isConfigured, restSelect } from './lib/supabase';
import { dateRange, num, plural, RELIABLE_SAMPLE, signed } from './lib/format';
import './ImpactDashboard.css';

/**
 * The public results page, at /impact.
 *
 * Headline figures only, from the public_summary view: counts and
 * averages, never a row that belongs to one play, and never a workshop's
 * name. It is meant to be linked from funding applications, so it says
 * how the improvement figure is measured and when the numbers are still
 * too few to lean on. The full breakdown is behind the admin login.
 */
export default function PublicImpact() {
  // With no database configured there is nothing to load, so start in
  // the "unavailable" state rather than flipping to it after a render.
  const [state, setState] = useState(() =>
    isConfigured ? { status: 'loading' } : { status: 'error' },
  );

  useEffect(() => {
    if (!isConfigured) return undefined;
    let alive = true;
    restSelect('public_summary')
      .then(([row]) => alive && setState({ status: 'ready', s: row }))
      .catch(() => alive && setState({ status: 'error' }));
    return () => {
      alive = false;
    };
  }, []);

  if (state.status === 'loading') return <div className="im-boot" />;
  if (state.status === 'error') return <Unavailable />;

  const { s } = state;
  if (!s || s.plays === 0) return <Empty />;

  const range = dateRange(s.first_play_at, s.last_play_at);
  const workshopsRan = s.workshop_participants > 0;
  const gain = Number(s.avg_workshop_improvement);

  return (
    <div className="im-page">
      <header className="im-head">
        <p className="im-eyebrow">Spot the Scam</p>
        <h1 className="im-title">Impact so far</h1>
        <p className="im-sub">
          Spot the Scam shows people ten real-looking messages, some genuine and
          some fake, and asks them to tell which is which. In workshops, it also
          measures whether they get better at it.
        </p>
        <p className="im-sub im-sub-quiet">
          Nothing on this page identifies anyone. No names, no email addresses,
          no accounts.
        </p>
        {range && (
          <p className="im-updated">
            <CalendarBlank weight="duotone" /> {range}
          </p>
        )}
      </header>

      {s.plays < RELIABLE_SAMPLE && (
        <p className="im-provisional">
          <Warning weight="duotone" />
          Only {plural(s.plays, 'play', 'plays')} so far. Treat these as early
          signs, not firm findings, until there are around {RELIABLE_SAMPLE}.
        </p>
      )}

      <section className="im-tiles">
        <Tile
          icon={<ChartBar weight="duotone" />}
          value={num(s.plays)}
          label="Quizzes completed"
          sub={`${num(s.answers)} messages judged`}
        />
        <Tile
          icon={<ChalkboardTeacher weight="duotone" />}
          value={num(s.workshops_held)}
          label={s.workshops_held === 1 ? 'Workshop held' : 'Workshops held'}
        />
        <Tile
          icon={<UsersThree weight="duotone" />}
          value={num(s.workshop_participants)}
          label="Workshop participants"
          sub="First attempts only"
        />
        <Tile
          icon={<TrendUp weight="duotone" />}
          value={workshopsRan ? signed(Math.round(gain)) : '—'}
          label="Average improvement"
          sub="Points out of 100, in workshops"
          good={gain > 0}
        />
      </section>

      {workshopsRan && (
        <section className="im-card">
          <div className="im-card-head">
            <h2 className="im-h2">
              <span className="im-h2-icon" aria-hidden="true">
                <TrendUp weight="duotone" />
              </span>
              Do workshops work?
            </h2>
          </div>
          <p className="im-note">
            <strong>
              {s.workshop_improved_pct}% of workshop participants scored higher
            </strong>{' '}
            after being shown the warning signs than before.
          </p>
          <p className="im-note">
            How it is measured: each participant judges five messages and is shown
            the red flags in each. Then they judge five new ones with the same mix
            of real and fake. The improvement is the difference between the two
            scores. A second attempt by the same person is not counted, because
            knowing the questions would inflate it.
          </p>
        </section>
      )}

      <div className="im-actions">
        <a className="im-cta" href={import.meta.env.BASE_URL}>
          Take the quiz yourself
        </a>
      </div>
    </div>
  );
}

function Tile({ icon, value, label, sub, good }) {
  return (
    <div className="im-tile">
      <span className="im-tile-icon" aria-hidden="true">
        {icon}
      </span>
      <span className={`im-tile-value ${good ? 'im-good' : ''}`}>{value}</span>
      <span className="im-tile-label">{label}</span>
      {sub && <small className="im-tile-sub">{sub}</small>}
    </div>
  );
}

function Empty() {
  return (
    <div className="im-page im-centered">
      <div className="im-message">
        <h1 className="im-title">Impact so far</h1>
        <p>
          Nobody has finished the quiz yet, so there is nothing to show. This page
          fills in on its own as people play.
        </p>
        <a className="im-cta" href={import.meta.env.BASE_URL}>
          Take the quiz
        </a>
      </div>
    </div>
  );
}

function Unavailable() {
  return (
    <div className="im-page im-centered">
      <div className="im-message">
        <h1 className="im-title">Figures unavailable</h1>
        <p>The results couldn&rsquo;t be loaded just now. Try again in a moment.</p>
      </div>
    </div>
  );
}
