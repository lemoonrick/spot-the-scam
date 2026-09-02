import { useEffect, useState } from 'react';
import {
  ArrowUp,
  CalendarBlank,
  ChartBar,
  ChatsCircle,
  Eye,
  Gauge,
  IdentificationCard,
  ShieldWarning,
  Timer,
  TrendUp,
  Warning,
} from '@phosphor-icons/react';
import { scams as allScams } from './scams';
import { loadImpact, RELIABLE_SAMPLE } from './lib/impact';
import './ImpactDashboard.css';

const TYPE_LABEL = {
  sms: 'Text message',
  email: 'Email',
  whatsapp: 'WhatsApp',
  instagram: 'Instagram',
  popup: 'Pop-up window',
  upi: 'Payment request',
};

const BAND_LABEL = {
  '0-39': 'Under 40',
  '40-59': '40 to 59',
  '60-79': '60 to 79',
  '80-100': '80 and above',
};

const nf = new Intl.NumberFormat('en-IN');
const num = (v) => (v == null ? '—' : nf.format(v));
const secs = (ms) => (ms == null ? '—' : `${(ms / 1000).toFixed(1)}s`);
const plural = (n, one, many) => `${nf.format(n)} ${n === 1 ? one : many}`;

function fmtDate(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/** "2 Sept 2026" when it all happened on one day, a range otherwise. */
function dateRange(from, to) {
  const a = fmtDate(from);
  const b = fmtDate(to);
  if (!b) return null;
  return !a || a === b ? b : `${a} to ${b}`;
}

/** Human name for a scenario, e.g. "WhatsApp · Jio Support". */
const SCAM_LABEL = Object.fromEntries(
  allScams.map((s) => [
    s.id,
    `${TYPE_LABEL[s.type] || s.type} · ${s.senderName || s.sender || 'Unknown'}`,
  ]),
);

export default function ImpactDashboard() {
  const [state, setState] = useState({ status: 'loading' });
  const [detail, setDetail] = useState('chart');

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

  const { summary, byType, personalisation, daily, bands, byScam, errors } =
    state.data;
  const n = summary.sessions;

  if (n === 0) return <Empty />;

  const range = dateRange(summary.first_session_at, summary.last_session_at);

  return (
    <div className="im-page">
      <header className="im-head">
        <p className="im-eyebrow">Spot the Scam</p>
        <h1 className="im-title">Impact so far</h1>
        <p className="im-sub">
          Spot the Scam shows people ten real-looking messages, some genuine and
          some fake, and asks them to tell which is which. These are the results
          from everyone who has finished it.
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

      {n < RELIABLE_SAMPLE && (
        <p className="im-provisional">
          <Warning weight="duotone" />
          Only {plural(n, 'play', 'plays')} so far. Treat the averages below as
          early signs, not firm findings, until there are around{' '}
          {RELIABLE_SAMPLE}.
        </p>
      )}

      <section className="im-tiles">
        <Tile
          icon={<ChartBar weight="duotone" />}
          value={num(n)}
          label="Quizzes completed"
          sub={`${num(summary.scams_reviewed)} answers given in total`}
        />
        <Tile
          icon={<Gauge weight="duotone" />}
          value={summary.avg_score == null ? '—' : summary.avg_score}
          label="Average score"
          sub="Out of 100"
        />
        <Tile
          icon={<TrendUp weight="duotone" />}
          value={
            summary.avg_improvement == null
              ? '—'
              : `${summary.avg_improvement > 0 ? '+' : ''}${summary.avg_improvement}`
          }
          label="Improvement"
          sub="Points gained, first half to second"
          good={summary.avg_improvement > 0}
        />
        <Tile
          icon={<ArrowUp weight="duotone" />}
          value={summary.improved_pct == null ? '—' : `${summary.improved_pct}%`}
          label="Did better in the second half"
          sub={`${num(summary.improved_count)} of ${plural(n, 'play', 'plays')}`}
        />
      </section>

      {/* ── Did it teach anyone anything? ── */}
      <Card icon={<TrendUp weight="duotone" />} title="Did people get better?">
        <p className="im-note">
          Everyone sees five messages and is shown the warning signs in each
          one. Then they see five fresh messages with the same mix of real and
          fake. Comparing the two halves shows what stuck.
        </p>
        <div className="im-beforeafter">
          <Column
            label="First five"
            caption="before learning"
            value={summary.avg_baseline}
          />
          <span className="im-arrow" aria-hidden="true">&rarr;</span>
          <Column
            label="Last five"
            caption="after learning"
            value={summary.avg_trained}
            variant={summary.avg_trained > summary.avg_baseline ? 'up' : 'flat'}
          />
        </div>
      </Card>

      {/* ── The question this page exists to answer ── */}
      <Card
        icon={<Eye weight="duotone" />}
        title="Which messages fool people most"
        action={
          byScam.length > 0 && (
            <Segmented
              value={detail}
              onChange={setDetail}
              options={[
                { id: 'chart', label: 'Chart' },
                { id: 'table', label: 'Table' },
              ]}
            />
          )
        }
      >
        <p className="im-note">
          Out of everyone who saw each message, this is how many got it wrong.
          The longest bar is the one catching people out most.
        </p>

        {byScam.length === 0 ? (
          <p className="im-none">
            Message-by-message results start building up from now on. Earlier
            plays were only recorded as totals.
          </p>
        ) : detail === 'table' ? (
          <ScamTable rows={byScam} />
        ) : (
          <FailBars
            rows={byScam.map((r) => ({
              key: r.scam_id,
              name: SCAM_LABEL[r.scam_id] || `Message ${r.scam_id}`,
              pct: r.wrong_pct ?? 0,
              tip: `${plural(r.times_wrong, 'person', 'people')} out of ${nf.format(r.times_shown)} got it wrong`,
            }))}
          />
        )}
      </Card>

      {/* ── Same question, grouped by kind of message ── */}
      <Card
        icon={<ChatsCircle weight="duotone" />}
        title="Which kinds of message are hardest"
      >
        <p className="im-note">
          The same results grouped by where the message appears, so you can see
          which everyday app people are least prepared for.
        </p>
        {byType.length === 0 ? (
          <p className="im-none">No results yet.</p>
        ) : (
          <FailBars
            rows={[...byType]
              .map((r) => ({
                key: r.scam_type,
                name: TYPE_LABEL[r.scam_type] || r.scam_type,
                pct: 100 - (r.accuracy_pct ?? 0),
                tip: `${nf.format(r.times_shown - r.times_correct)} wrong out of ${nf.format(r.times_shown)} shown`,
              }))
              .sort((a, b) => b.pct - a.pct)}
          />
        )}
      </Card>

      {/* ── The two mistakes mean very different things ── */}
      {errors && errors.total_answers > 0 && (
        <Card
          icon={<ShieldWarning weight="duotone" />}
          title="Two kinds of mistake"
        >
          <div className="im-mistakes">
            <div className="im-mistake im-mistake-bad">
              <span className="im-mistake-value">
                {num(errors.trusted_a_scam)}
              </span>
              <span className="im-mistake-label">Trusted a fake message</span>
              <small>
                Believed something was genuine when it was a scam. This is the
                mistake that costs people money.
              </small>
            </div>
            <div className="im-mistake">
              <span className="im-mistake-value">
                {num(errors.suspected_something_real)}
              </span>
              <span className="im-mistake-label">Doubted a real message</span>
              <small>
                Thought a genuine message was a scam. Safer, but it means real
                messages from banks and delivery services get ignored.
              </small>
            </div>
          </div>
        </Card>
      )}

      <div className="im-split">
        <Card icon={<ChartBar weight="duotone" />} title="How scores are spread">
          <p className="im-note">
            Final score out of 100, across all {plural(n, 'play', 'plays')}.
          </p>
          <BandChart rows={bands} total={n} />
        </Card>

        <Card
          icon={<IdentificationCard weight="duotone" />}
          title="Does knowing your name help a scam?"
        >
          <p className="im-note">
            Some people give a first name, and the fake messages then greet them
            by it, exactly as real scams do.
          </p>
          <Personalisation rows={personalisation} />
        </Card>
      </div>

      {daily.length > 1 && (
        <Card icon={<CalendarBlank weight="duotone" />} title="Plays over time">
          <DailyChart rows={daily} />
        </Card>
      )}

      <Card icon={<Timer weight="duotone" />} title="How people play">
        <div className="im-facts">
          <Fact
            value={secs(summary.avg_first_decision_ms)}
            label="Thinking time on the first five"
          />
          <Fact
            value={secs(summary.avg_later_decision_ms)}
            label="Thinking time on the last five"
          />
          <Fact
            value={num(summary.scams_waved_through)}
            label="Times a fake was trusted"
          />
          <Fact
            value={`${Math.round((summary.mobile_sessions / n) * 100)}%`}
            label="Played on a phone"
          />
        </div>
      </Card>

      <footer className="im-foot">
        <p>
          Each finished quiz saves one anonymous record: the scores, how long
          each answer took, which messages were misread, whether it was played
          on a phone or a computer, and the browser language. No name, email,
          account or IP address is stored, and nothing is saved onto anyone's
          device. That last point means a person who plays twice counts as two
          plays, which is why this page says plays rather than people.
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

function Card({ icon, title, action, children }) {
  return (
    <section className="im-card">
      <div className="im-card-head">
        <h2 className="im-h2">
          <span className="im-h2-icon" aria-hidden="true">{icon}</span>
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function Tile({ icon, value, label, sub, good }) {
  return (
    <div className="im-tile">
      <span className="im-tile-icon" aria-hidden="true">{icon}</span>
      <span className={`im-tile-value ${good ? 'im-good' : ''}`}>{value}</span>
      <span className="im-tile-label">{label}</span>
      {sub && <small className="im-tile-sub">{sub}</small>}
    </div>
  );
}

function Segmented({ value, onChange, options }) {
  return (
    <div className="im-seg" role="group">
      {options.map((o) => (
        <button
          key={o.id}
          className={value === o.id ? 'is-on' : ''}
          onClick={() => onChange(o.id)}
          aria-pressed={value === o.id}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Column({ label, caption, value, variant = 'base' }) {
  return (
    <div className={`im-col im-col-${variant}`}>
      <span className="im-col-value">
        {value == null ? '—' : `${value}%`}
      </span>
      <div className="im-col-track">
        <div
          className="im-col-fill"
          style={{ height: `${Math.max(value ?? 0, 2)}%` }}
        />
      </div>
      <span className="im-col-label">{label}</span>
      <small className="im-col-caption">{caption}</small>
    </div>
  );
}

/* One measure across named things, so one hue. Sorted worst first, and
   a long bar now means "fools people", matching the heading. */
function FailBars({ rows }) {
  return (
    <ul className="im-bars">
      {rows.map((r) => (
        <li key={r.key} className="im-bar-row">
          <span className="im-bar-name">{r.name}</span>
          <div className="im-bar-track">
            <div
              className="im-bar-fill"
              style={{ width: `${Math.max(r.pct, 1)}%` }}
            />
          </div>
          <span className="im-bar-value">{r.pct}%</span>
          <span className="im-bar-tip" role="tooltip">{r.tip}</span>
        </li>
      ))}
    </ul>
  );
}

function ScamTable({ rows }) {
  return (
    <div className="im-tablewrap">
      <table className="im-table">
        <thead>
          <tr>
            <th>Message</th>
            <th>Times shown</th>
            <th>Got it wrong</th>
            <th>Fooled</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.scam_id}>
              <td>{SCAM_LABEL[r.scam_id] || `Message ${r.scam_id}`}</td>
              <td>{nf.format(r.times_shown)}</td>
              <td>{nf.format(r.times_wrong)}</td>
              <td>{r.wrong_pct ?? 0}%</td>
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
          <li key={band} className={`im-band ${v === 0 ? 'im-band-zero' : ''}`}>
            <span className="im-band-value">{v}</span>
            <div className="im-band-track">
              {/* An empty bordered box reads as broken, so nothing is
                  drawn at zero beyond the baseline. */}
              {v > 0 && (
                <div
                  className="im-band-fill"
                  style={{ height: `${(v / max) * 100}%` }}
                />
              )}
            </div>
            <small className="im-band-label">{BAND_LABEL[band]}</small>
            <span className="im-bar-tip" role="tooltip">
              {plural(v, 'play', 'plays')} out of {nf.format(total)}
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
        This needs plays both with and without a name before the two can be
        compared.
      </p>
    );
  }

  const a = Number(named.avg_scams_waved_through);
  const b = Number(anon.avg_scams_waved_through);

  return (
    <>
      <div className="im-compare">
        <div>
          <span className="im-compare-value">{a.toFixed(1)}</span>
          <span className="im-compare-label">Gave a name</span>
          <small>{plural(named.sessions, 'play', 'plays')}</small>
        </div>
        <div>
          <span className="im-compare-value">{b.toFixed(1)}</span>
          <span className="im-compare-label">Stayed anonymous</span>
          <small>{plural(anon.sessions, 'play', 'plays')}</small>
        </div>
      </div>
      <p className="im-note im-compare-note">
        Average number of fakes trusted per play.{' '}
        {a > b
          ? 'People greeted by name were fooled more often, which is exactly what scammers rely on.'
          : a < b
            ? 'People greeted by name were fooled less often so far.'
            : 'No difference between the two yet.'}
      </p>
    </>
  );
}

function DailyChart({ rows }) {
  const W = 720;
  const H = 160;
  const P = { t: 12, r: 12, b: 24, l: 28 };
  const max = Math.max(1, ...rows.map((r) => r.sessions));
  const step = rows.length > 1 ? (W - P.l - P.r) / (rows.length - 1) : 0;

  const x = (i) => P.l + i * step;
  const y = (v) => P.t + (1 - v / max) * (H - P.t - P.b);

  const line = rows.map((r, i) => `${x(i)},${y(r.sessions)}`).join(' ');
  const area = `${P.l},${H - P.b} ${line} ${x(rows.length - 1)},${H - P.b}`;

  return (
    <div className="im-line">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`Plays per day over ${rows.length} days, busiest day ${max}`}
      >
        <line className="im-grid" x1={P.l} x2={W - P.r} y1={y(max)} y2={y(max)} />
        <line className="im-axis" x1={P.l} x2={W - P.r} y1={H - P.b} y2={H - P.b} />
        <text className="im-tick" x={P.l - 8} y={y(max) + 4} textAnchor="end">
          {max}
        </text>
        <polygon className="im-area" points={area} />
        <polyline className="im-stroke" points={line} />
        {rows.map((r, i) => (
          <g key={r.day}>
            <circle className="im-dot" cx={x(i)} cy={y(r.sessions)} r="4" />
            <title>
              {fmtDate(r.day)}: {plural(r.sessions, 'play', 'plays')}
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
          Nobody has finished the quiz yet, so there is nothing to show. This
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
          The numbers could not be loaded just now. The quiz itself works
          normally.
        </p>
        <p className="im-error">{message}</p>
        <a className="im-cta" href="/">Take the quiz</a>
      </div>
    </div>
  );
}
