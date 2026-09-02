import { useEffect, useState } from 'react';
import { loadImpact, RELIABLE_SAMPLE } from './lib/impact';
import './ImpactDashboard.css';

const TYPE_LABEL = {
  sms: 'SMS',
  email: 'Email',
  whatsapp: 'WhatsApp',
  instagram: 'Instagram',
  popup: 'Browser popup',
  upi: 'UPI / GPay',
};

const BAND_LABEL = {
  '0-39': 'Under 40%',
  '40-59': '40 to 59%',
  '60-79': '60 to 79%',
  '80-100': '80% and up',
};

const nf = new Intl.NumberFormat('en-IN');
const num = (v) => (v == null ? '—' : nf.format(v));
const secs = (ms) => (ms == null ? '—' : `${(ms / 1000).toFixed(1)}s`);

function fmtDate(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  // A bad timestamp should not put "Invalid Date" on a public page.
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function ImpactDashboard() {
  const [state, setState] = useState({ status: 'loading' });
  const [showTable, setShowTable] = useState(false);

  useEffect(() => {
    let alive = true;
    loadImpact()
      .then((data) => alive && setState({ status: 'ready', data }))
      .catch((err) => alive && setState({ status: 'error', error: err.message }));
    return () => {
      alive = false;
    };
  }, []);

  if (state.status === 'loading') return <Loading />;
  if (state.status === 'error') return <Failed message={state.error} />;

  const { summary, byType, personalisation, daily, bands } = state.data;
  const n = summary.sessions;

  if (n === 0) return <Empty />;

  const provisional = n < RELIABLE_SAMPLE;

  return (
    <div className="im-page">
      <header className="im-head">
        <p className="im-eyebrow">Spot the Scam</p>
        <h1 className="im-title">Impact so far</h1>
        <p className="im-sub">
          Live figures from everyone who has finished the quiz. Nothing here
          identifies a person: no names, no emails, no accounts.
        </p>
        {fmtDate(summary.last_session_at) && (
          <p className="im-updated">
            {fmtDate(summary.first_session_at)} to{' '}
            {fmtDate(summary.last_session_at)}
          </p>
        )}
      </header>

      {provisional && (
        <p className="im-provisional">
          Based on {n} {n === 1 ? 'session' : 'sessions'}. Averages below are
          provisional until around {RELIABLE_SAMPLE}.
        </p>
      )}

      {/* ── Headline figures. Numbers, not charts: there is no shape to see. ── */}
      <section className="im-tiles">
        <Tile value={num(n)} label="People trained" />
        <Tile value={num(summary.scams_reviewed)} label="Scam messages reviewed" />
        <Tile
          value={
            summary.avg_improvement == null
              ? '—'
              : `${summary.avg_improvement > 0 ? '+' : ''}${summary.avg_improvement}`
          }
          label="Average improvement"
          sub="percentage points, first half to second"
          good={summary.avg_improvement > 0}
        />
        <Tile
          value={summary.improved_pct == null ? '—' : `${summary.improved_pct}%`}
          label="Scored better after learning"
          sub={`${num(summary.improved_count)} of ${num(n)} people`}
        />
      </section>

      {/* ── The learning result ── */}
      <section className="im-card">
        <h2 className="im-h2">Before and after</h2>
        <p className="im-note">
          Everyone sees five messages, learns the red flags, then sees five more
          with the same mix of real and fake. The two halves are directly
          comparable.
        </p>
        <div className="im-beforeafter">
          <Column
            label="First half"
            caption="before learning"
            value={summary.avg_baseline}
          />
          <span className="im-arrow" aria-hidden="true">&rarr;</span>
          <Column
            label="Second half"
            caption="after learning"
            value={summary.avg_trained}
            variant={
              summary.avg_trained > summary.avg_baseline ? 'up' : 'flat'
            }
          />
        </div>
      </section>

      {/* ── The question this dashboard exists to answer ── */}
      <section className="im-card">
        <div className="im-card-head">
          <div>
            <h2 className="im-h2">Which scams get past people</h2>
            <p className="im-note">
              How often each channel is judged correctly. Lowest first, so the
              worst blind spot is at the top.
            </p>
          </div>
          <button
            className="im-toggle"
            onClick={() => setShowTable((v) => !v)}
            aria-pressed={showTable}
          >
            {showTable ? 'Show chart' : 'Show table'}
          </button>
        </div>

        {byType.length === 0 ? (
          <p className="im-none">No channel data yet.</p>
        ) : showTable ? (
          <TypeTable rows={byType} />
        ) : (
          <TypeChart rows={byType} />
        )}
      </section>

      <div className="im-split">
        {/* ── Spread, so the average is not the only story ── */}
        <section className="im-card">
          <h2 className="im-h2">How scores are spread</h2>
          <p className="im-note">Final score across all {num(n)} runs.</p>
          <BandChart rows={bands} total={n} />
        </section>

        {/* ── The finding nobody else is measuring ── */}
        <section className="im-card">
          <h2 className="im-h2">Does using your name work?</h2>
          <p className="im-note">
            Some players give a first name, and the fake messages then address
            them by it, the way real scams do.
          </p>
          <Personalisation rows={personalisation} />
        </section>
      </div>

      {/* ── Reach over time ── */}
      {daily.length > 1 && (
        <section className="im-card">
          <h2 className="im-h2">Sessions over time</h2>
          <DailyChart rows={daily} />
        </section>
      )}

      <section className="im-card im-behaviour">
        <h2 className="im-h2">How people play</h2>
        <div className="im-facts">
          <Fact
            value={secs(summary.avg_first_decision_ms)}
            label="Time to judge the first messages"
          />
          <Fact
            value={secs(summary.avg_later_decision_ms)}
            label="Time to judge the later ones"
          />
          <Fact
            value={num(summary.scams_waved_through)}
            label="Real scams marked as safe"
          />
          <Fact
            value={`${Math.round((summary.mobile_sessions / n) * 100)}%`}
            label="Played on a phone"
          />
        </div>
      </section>

      <footer className="im-foot">
        <p>
          Every completed quiz writes one anonymous row: the scores, the timings,
          which scam types were misread, phone or computer, and the browser
          language. No name, email, account or IP address is recorded, so there
          is nothing here that can be traced to a person.
        </p>
        <p>
          Built by <a href="https://myfactree.org">FactTree</a>.{' '}
          <a href="/">Take the quiz</a>
        </p>
      </footer>
    </div>
  );
}

/* ── Pieces ─────────────────────────────────────────────────── */

function Tile({ value, label, sub, good }) {
  return (
    <div className="im-tile">
      <span className={`im-tile-value ${good ? 'im-good' : ''}`}>{value}</span>
      <span className="im-tile-label">{label}</span>
      {sub && <small className="im-tile-sub">{sub}</small>}
    </div>
  );
}

function Column({ label, caption, value, variant = 'base' }) {
  const pct = value == null ? 0 : value;
  return (
    <div className={`im-col im-col-${variant}`}>
      <span className="im-col-value">{value == null ? '—' : `${value}%`}</span>
      <div className="im-col-track">
        <div className="im-col-fill" style={{ height: `${Math.max(pct, 2)}%` }} />
      </div>
      <span className="im-col-label">{label}</span>
      <small className="im-col-caption">{caption}</small>
    </div>
  );
}

/* Horizontal bars: one measure across named categories, so a single hue.
   Sorted worst-first; order carries the ranking, not colour. */
function TypeChart({ rows }) {
  return (
    <ul className="im-bars">
      {rows.map((r) => (
        <li key={r.scam_type} className="im-bar-row">
          <span className="im-bar-name">
            {TYPE_LABEL[r.scam_type] || r.scam_type}
          </span>
          <div className="im-bar-track">
            <div
              className="im-bar-fill"
              style={{ width: `${Math.max(r.accuracy_pct ?? 0, 1)}%` }}
            />
          </div>
          <span className="im-bar-value">{r.accuracy_pct ?? 0}%</span>
          <span className="im-bar-tip" role="tooltip">
            {nf.format(r.times_correct)} correct out of{' '}
            {nf.format(r.times_shown)} shown
          </span>
        </li>
      ))}
    </ul>
  );
}

function TypeTable({ rows }) {
  return (
    <div className="im-tablewrap">
      <table className="im-table">
        <thead>
          <tr>
            <th>Channel</th>
            <th>Shown</th>
            <th>Judged correctly</th>
            <th>Accuracy</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.scam_type}>
              <td>{TYPE_LABEL[r.scam_type] || r.scam_type}</td>
              <td>{nf.format(r.times_shown)}</td>
              <td>{nf.format(r.times_correct)}</td>
              <td>{r.accuracy_pct ?? 0}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BandChart({ rows, total }) {
  const order = ['0-39', '40-59', '60-79', '80-100'];
  const byBand = Object.fromEntries(rows.map((r) => [r.band, r.sessions]));
  const max = Math.max(1, ...rows.map((r) => r.sessions));

  return (
    <ul className="im-bands">
      {order.map((band) => {
        const v = byBand[band] || 0;
        return (
          <li key={band} className="im-band">
            <span className="im-band-value">{v}</span>
            <div className="im-band-track">
              <div
                className="im-band-fill"
                style={{ height: `${v === 0 ? 1 : (v / max) * 100}%` }}
              />
            </div>
            <small className="im-band-label">{BAND_LABEL[band]}</small>
            <span className="im-bar-tip" role="tooltip">
              {v} of {total} {v === 1 ? 'person' : 'people'}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function Personalisation({ rows }) {
  const named = rows.find((r) => r.personalised === true);
  const anon = rows.find((r) => r.personalised === false);

  if (!named || !anon) {
    return (
      <p className="im-none">
        Needs runs both with and without a name before the two can be compared.
      </p>
    );
  }

  const diff = Number(named.avg_scams_waved_through) -
    Number(anon.avg_scams_waved_through);

  return (
    <>
      <div className="im-compare">
        <div>
          <span className="im-compare-value">
            {Number(named.avg_scams_waved_through).toFixed(1)}
          </span>
          <span className="im-compare-label">Gave a name</span>
          <small>{named.sessions} sessions</small>
        </div>
        <div>
          <span className="im-compare-value">
            {Number(anon.avg_scams_waved_through).toFixed(1)}
          </span>
          <span className="im-compare-label">Stayed anonymous</span>
          <small>{anon.sessions} sessions</small>
        </div>
      </div>
      <p className="im-note im-compare-note">
        Average number of real scams waved through as safe.{' '}
        {diff > 0
          ? 'People who gave a name missed more, which is what scammers count on.'
          : diff < 0
            ? 'People who gave a name missed fewer.'
            : 'No difference so far.'}
      </p>
    </>
  );
}

function DailyChart({ rows }) {
  const W = 720;
  const H = 160;
  const P = { t: 12, r: 12, b: 24, l: 28 };
  const max = Math.max(1, ...rows.map((r) => r.sessions));
  const step =
    rows.length > 1 ? (W - P.l - P.r) / (rows.length - 1) : 0;

  const x = (i) => P.l + i * step;
  const y = (v) => P.t + (1 - v / max) * (H - P.t - P.b);

  const line = rows.map((r, i) => `${x(i)},${y(r.sessions)}`).join(' ');
  const area = `${P.l},${H - P.b} ${line} ${x(rows.length - 1)},${H - P.b}`;

  return (
    <div className="im-line">
      <svg viewBox={`0 0 ${W} ${H}`} role="img"
        aria-label={`Sessions per day, ${rows.length} days, peak ${max}`}>
        <line className="im-grid" x1={P.l} x2={W - P.r}
          y1={y(max)} y2={y(max)} />
        <line className="im-axis" x1={P.l} x2={W - P.r}
          y1={H - P.b} y2={H - P.b} />
        <text className="im-tick" x={P.l - 8} y={y(max) + 4} textAnchor="end">
          {max}
        </text>
        <polygon className="im-area" points={area} />
        <polyline className="im-stroke" points={line} />
        {rows.map((r, i) => (
          <g key={r.day}>
            <circle className="im-dot" cx={x(i)} cy={y(r.sessions)} r="4" />
            <title>
              {fmtDate(r.day)}: {r.sessions}{' '}
              {r.sessions === 1 ? 'session' : 'sessions'}
            </title>
          </g>
        ))}
      </svg>
      <div className="im-line-labels">
        <span>{fmtDate(rows[0].day) || ''}</span>
        <span>{fmtDate(rows[rows.length - 1].day) || ''}</span>
      </div>
    </div>
  );
}

function Fact({ value, label }) {
  return (
    <div className="im-fact">
      <span className="im-fact-value">{value}</span>
      <span className="im-fact-label">{label}</span>
    </div>
  );
}

/* ── States ─────────────────────────────────────────────────── */

function Loading() {
  return (
    <div className="im-page">
      <header className="im-head">
        <p className="im-eyebrow">Spot the Scam</p>
        <h1 className="im-title">Impact so far</h1>
      </header>
      <section className="im-tiles">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="im-tile">
            <span className="im-skel im-skel-lg" />
            <span className="im-skel im-skel-sm" />
          </div>
        ))}
      </section>
      <section className="im-card">
        <span className="im-skel im-skel-block" />
      </section>
    </div>
  );
}

function Empty() {
  return (
    <div className="im-page im-centered">
      <div className="im-message">
        <h1 className="im-title">Impact so far</h1>
        <p>
          Nobody has completed the quiz yet, so there is nothing to report. This
          page fills in on its own as people play.
        </p>
        <a className="im-cta" href="/">Take the quiz</a>
      </div>
    </div>
  );
}

function Failed({ message }) {
  return (
    <div className="im-page im-centered">
      <div className="im-message">
        <h1 className="im-title">Figures unavailable</h1>
        <p>
          The numbers could not be loaded just now. The quiz itself is
          unaffected.
        </p>
        <p className="im-error">{message}</p>
        <a className="im-cta" href="/">Take the quiz</a>
      </div>
    </div>
  );
}
