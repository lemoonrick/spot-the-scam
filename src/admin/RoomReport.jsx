import { useEffect, useState } from 'react';
import { select } from './api';
import { downloadCsv, toCsv } from './csv';
import { closesLabel, fmtDay, roomStatus, scamLabel, verdictLabel } from './labels';
import { num, plural, signed } from '../lib/format';
import SharePanel from './SharePanel';

// Refresh while it's on screen, so the report fills in during the session.
const POLL_MS = 15_000;

// Below this many people, one person's answers move the averages a lot.
const SMALL_GROUP = 10;

/**
 * One workshop's results: who took part, how much they improved, and
 * which messages caught them out before and after seeing the red flags.
 */
export default function RoomReport({ room: initial, onBack, onError }) {
  const [room, setRoom] = useState(initial);
  const [questions, setQuestions] = useState(null);
  const [sharing, setSharing] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    let alive = true;
    const id = encodeURIComponent(initial.id);
    const refresh = () =>
      Promise.all([
        select('admin_rooms', `select=*&id=eq.${id}`),
        select('admin_room_by_scam', `select=*&room_id=eq.${id}&order=wrong_pct.desc`),
      ]).then(
        ([[fresh], byScam]) => {
          if (!alive) return;
          if (fresh) setRoom(fresh);
          setQuestions(byScam);
        },
        onError,
      );
    refresh();
    const tick = setInterval(() => {
      if (document.visibilityState === 'visible') refresh();
    }, POLL_MS);
    return () => {
      alive = false;
      clearInterval(tick);
    };
  }, [initial.id, onError]);

  const download = async () => {
    setDownloading(true);
    try {
      const rows = await select(
        'admin_room_answers',
        `select=*&room_id=eq.${encodeURIComponent(room.id)}&order=played_at.asc,position.asc`,
      );
      downloadCsv(`spot-the-scam-${room.code}-${slug(room.name)}.csv`, toCsv(CSV_COLUMNS, rows));
    } catch (err) {
      onError(err);
      alert(`Couldn’t download: ${err.message}`);
    }
    setDownloading(false);
  };

  if (sharing) return <SharePanel room={room} onClose={() => setSharing(false)} />;

  const status = roomStatus(room);
  const people = room.first_runs;
  const hasPlays = room.finished > 0;
  const gain = room.avg_improvement == null ? null : Math.round(room.avg_improvement);

  const scamsOnly = (questions ?? []).filter((q) => verdictLabel(q.scam_id) === 'Scam');
  const hardest = questions?.[0];
  const mostTrusted = scamsOnly[0];

  return (
    <div className="ad-report">
      <button className="ad-back" onClick={onBack}>
        ← All workshops
      </button>

      {/* The sentence the report exists to produce. */}
      <h1 className="ad-report-headline">
        <span className="ad-room-code">Room {room.code}</span> · {room.name}
        {room.held_on && <> — {fmtDay(room.held_on)}</>}
        {hasPlays && (
          <>
            {' · '}
            {plural(people, 'participant', 'participants')}
            {gain != null && (
              <>
                {' · '}Average improvement{' '}
                <span className={gain > 0 ? 'ad-good' : ''}>{signed(gain)}</span>
              </>
            )}
          </>
        )}
      </h1>

      <p className="ad-report-sub">
        <span className={`ad-pill ad-pill-${status.key}`}>{status.label}</span>
        <span>{closesLabel(room)}</span>
        <span>Up to {num(room.max_participants)} people</span>
        {status.key === 'open' && (
          <button className="ad-btn ad-btn-primary" onClick={() => setSharing(true)}>
            Show QR &amp; link
          </button>
        )}
        {hasPlays && (
          <button className="ad-btn" onClick={download} disabled={downloading}>
            {downloading ? 'Preparing…' : 'Download spreadsheet'}
          </button>
        )}
      </p>
      {room.notes && <p className="ad-room-notes">{room.notes}</p>}

      {!hasPlays ? (
        <div className="ad-empty">
          <p>
            {room.started > 0
              ? `${plural(room.started, 'person has', 'people have')} started; nobody has finished yet.`
              : 'Nobody has played yet.'}
          </p>
          <p className="ad-muted">
            This page fills in as people finish, and refreshes itself every few
            seconds.
          </p>
        </div>
      ) : (
        <>
          {people < SMALL_GROUP && (
            <p className="ad-caution">
              Small group: with {plural(people, 'person', 'people')}, one person’s
              answers move these averages a lot.
            </p>
          )}

          <section className="ad-tiles">
            <Tile value={num(people)} label="Participants" sub="First attempts only" />
            <Tile
              value={
                <>
                  {room.avg_before ?? '—'}%<span className="ad-arrow">→</span>
                  {room.avg_after ?? '—'}%
                </>
              }
              label="Before → after"
              sub="Average score out of 100"
            />
            <Tile
              value={gain == null ? '—' : signed(gain)}
              label="Average improvement"
              sub="Points gained after the red flags"
              good={gain > 0}
            />
            <Tile
              value={room.improved_pct == null ? '—' : `${room.improved_pct}%`}
              label="Scored higher after"
              sub={`${num(room.finished)} finished of ${num(room.started)} joined`}
            />
          </section>

          {(hardest || mostTrusted) && (
            <section className="ad-callouts">
              {hardest && (
                <p>
                  <strong>Hardest message:</strong> {scamLabel(hardest.scam_id)} —{' '}
                  {hardest.wrong_pct}% got it wrong.
                </p>
              )}
              {mostTrusted && mostTrusted.scam_id !== hardest?.scam_id && (
                <p>
                  <strong>Most trusted scam:</strong> {scamLabel(mostTrusted.scam_id)} —{' '}
                  {mostTrusted.wrong_pct}% thought it was genuine.
                </p>
              )}
            </section>
          )}

          <section className="ad-card">
            <h2 className="ad-h2">Each message, before and after</h2>
            <p className="ad-muted">
              Every message turns up in the first half for some people and the
              second half for others, so each can be compared before and after the
              red flags were shown.
            </p>
            <div className="ad-tablewrap">
              <table className="ad-table">
                <thead>
                  <tr>
                    <th>Message</th>
                    <th>Real or fake</th>
                    <th className="ad-num">Wrong before</th>
                    <th className="ad-num">Wrong after</th>
                    <th className="ad-num">Answers</th>
                  </tr>
                </thead>
                <tbody>
                  {(questions ?? []).map((q) => (
                    <tr key={q.scam_id}>
                      <td>{scamLabel(q.scam_id)}</td>
                      <td>{verdictLabel(q.scam_id)}</td>
                      <td className="ad-num">{pct(q.wrong_pct_before)}</td>
                      <td className="ad-num">
                        {pct(q.wrong_pct_after)}
                        <Change before={q.wrong_pct_before} after={q.wrong_pct_after} />
                      </td>
                      <td className="ad-num">{num(q.shown)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function Tile({ value, label, sub, good }) {
  return (
    <div className="ad-tile">
      <span className={`ad-tile-value ${good ? 'ad-good' : ''}`}>{value}</span>
      <span className="ad-tile-label">{label}</span>
      {sub && <small className="ad-tile-sub">{sub}</small>}
    </div>
  );
}

const pct = (v) => (v == null ? '—' : `${v}%`);

/** Fewer wrong after is good, so a fall shows green. */
function Change({ before, after }) {
  if (before == null || after == null || before === after) return null;
  const down = after < before;
  return (
    <span className={`ad-change ${down ? 'ad-good' : 'ad-bad'}`}>
      {down ? '▼' : '▲'} {Math.abs(after - before)}
    </span>
  );
}

const slug = (s) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);

const yesNo = (b) => (b ? 'Yes' : 'No');
const kind = (v) => (v === 'phishing' ? 'Scam' : 'Genuine');

// One row per answer. Headings in plain words, so the file makes sense
// to someone who has never seen the app.
const CSV_COLUMNS = [
  { key: 'room_code', label: 'Room' },
  { key: 'play_id', label: 'Play', value: (r) => r.play_id.slice(0, 8) },
  {
    key: 'played_at',
    label: 'Finished at',
    value: (r) => new Date(r.played_at).toLocaleString('en-IN'),
  },
  { key: 'is_repeat', label: 'Second attempt', value: (r) => yesNo(r.is_repeat) },
  { key: 'position', label: 'Question number' },
  {
    key: 'round',
    label: 'Half',
    value: (r) => (r.round === 1 ? 'Before' : r.round === 2 ? 'After' : ''),
  },
  { key: 'scam_id', label: 'Message', value: (r) => scamLabel(r.scam_id) },
  { key: 'actual', label: 'Real or fake', value: (r) => kind(r.actual) },
  { key: 'chosen', label: 'Their answer', value: (r) => kind(r.chosen) },
  { key: 'correct', label: 'Correct', value: (r) => yesNo(r.correct) },
  {
    key: 'response_ms',
    label: 'Seconds to answer',
    value: (r) => (r.response_ms == null ? '' : (r.response_ms / 1000).toFixed(1)),
  },
  { key: 'score', label: 'Score' },
  { key: 'baseline_score', label: 'Score before' },
  { key: 'trained_score', label: 'Score after' },
  { key: 'improvement', label: 'Improvement' },
  { key: 'device', label: 'Device' },
  { key: 'personalised', label: 'Gave a name', value: (r) => yesNo(r.personalised) },
];
