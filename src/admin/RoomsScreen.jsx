import { useEffect, useState } from 'react';
import { createRoom, deleteRoom, select, updateRoom } from './api';
import { closesLabel, fmtDay, roomStatus, today } from './labels';
import { num, signed } from '../lib/format';
import SharePanel from './SharePanel';

// How often the list refreshes while it's on screen. Often enough to
// watch a workshop fill up; quiet when the tab is in the background.
const POLL_MS = 15_000;

const CLOSE_AFTER = [
  { hours: 3, label: 'In 3 hours' },
  { hours: 12, label: 'In 12 hours' },
  { hours: 24, label: 'In 24 hours' },
  { hours: 72, label: 'In 3 days' },
  { hours: 168, label: 'In a week' },
];

const inHours = (h) => new Date(Date.now() + h * 3_600_000).toISOString();

export default function RoomsScreen({ onOpen, onError }) {
  const [rooms, setRooms] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [creating, setCreating] = useState(false);
  const [sharing, setSharing] = useState(null);

  // Bumped after every change, to fetch the list again.
  const [version, setVersion] = useState(0);
  const reload = () => setVersion((v) => v + 1);

  // Refresh while visible; pause in a background tab; catch up at once
  // when the tab comes back.
  useEffect(() => {
    let alive = true;
    const refresh = () =>
      select('admin_rooms', 'select=*&order=created_at.desc').then(
        (rows) => {
          if (!alive) return;
          setRooms(rows);
          setLoadError('');
        },
        (err) => {
          onError(err);
          if (alive) setLoadError('Couldn’t load the workshops. Retrying…');
        },
      );
    refresh();
    const tick = setInterval(() => {
      if (document.visibilityState === 'visible') refresh();
    }, POLL_MS);
    const onShow = () => document.visibilityState === 'visible' && refresh();
    document.addEventListener('visibilitychange', onShow);
    return () => {
      alive = false;
      clearInterval(tick);
      document.removeEventListener('visibilitychange', onShow);
    };
  }, [onError, version]);

  // Every action reloads the list, so what's shown is always what the
  // database holds rather than a guess.
  const act = async (fn) => {
    try {
      await fn();
    } catch (err) {
      onError(err);
      alert(`That didn’t work: ${err.message}`);
    }
    reload();
  };

  if (sharing) {
    return <SharePanel room={sharing} onClose={() => setSharing(null)} />;
  }

  return (
    <div className="ad-rooms">
      <div className="ad-section-head">
        <div>
          <h1 className="ad-h1">Workshops</h1>
          <p className="ad-muted">
            Each workshop gets its own code. Plays made through it are grouped
            into its report.
          </p>
        </div>
        {!creating && (
          <button className="ad-btn ad-btn-primary" onClick={() => setCreating(true)}>
            New workshop
          </button>
        )}
      </div>

      {creating && (
        <NewRoomForm
          onCancel={() => setCreating(false)}
          onCreate={async (fields) => {
            try {
              const room = await createRoom(fields);
              setCreating(false);
              reload();
              setSharing(room);
            } catch (err) {
              onError(err);
              alert(`Couldn’t create the workshop: ${err.message}`);
            }
          }}
        />
      )}

      {loadError && <p className="ad-error">{loadError}</p>}
      {rooms === null && !loadError && <p className="ad-muted">Loading…</p>}
      {rooms?.length === 0 && !creating && (
        <div className="ad-empty">
          <p>No workshops yet.</p>
          <p className="ad-muted">
            Create one before the session, then show its QR code on screen.
          </p>
        </div>
      )}

      <div className="ad-room-list">
        {rooms?.map((room) => (
          <RoomCard
            key={room.id}
            room={room}
            onShare={() => setSharing(room)}
            onOpen={() => onOpen(room)}
            onClose={() => act(() => updateRoom(room.id, { status: 'closed' }))}
            onReopen={() =>
              act(() => updateRoom(room.id, { status: 'open', closes_at: inHours(24) }))
            }
            onExtend={() =>
              act(() =>
                updateRoom(room.id, {
                  closes_at: new Date(
                    new Date(room.closes_at).getTime() + 2 * 3_600_000,
                  ).toISOString(),
                }),
              )
            }
            onDelete={() => act(() => deleteRoom(room.id))}
          />
        ))}
      </div>
    </div>
  );
}

function RoomCard({ room, onShare, onOpen, onClose, onReopen, onExtend, onDelete }) {
  const [confirming, setConfirming] = useState(false);
  const [typed, setTyped] = useState('');
  const status = roomStatus(room);
  const hasPlays = room.finished > 0;

  return (
    <article className={`ad-room ad-room-${status.key}`}>
      <div className="ad-room-top">
        <div className="ad-room-id">
          <h2 className="ad-room-name">{room.name}</h2>
          <p className="ad-room-meta">
            <span className="ad-room-code">{room.code}</span>
            {room.held_on && <span>{fmtDay(room.held_on)}</span>}
            <span>{closesLabel(room)}</span>
          </p>
        </div>
        <span className={`ad-pill ad-pill-${status.key}`}>{status.label}</span>
      </div>

      {/* The live count. "Joined" counts starts, so a refresh counts twice;
          "finished" is what reaches the report. */}
      <p className="ad-room-count">
        <strong>{num(room.started)}</strong> joined ·{' '}
        <strong>{num(room.finished)}</strong> finished
        {room.first_runs > 0 && room.avg_improvement != null && (
          <>
            {' '}
            · average improvement{' '}
            <strong className={room.avg_improvement > 0 ? 'ad-good' : ''}>
              {signed(Math.round(room.avg_improvement))}
            </strong>
          </>
        )}
      </p>
      {room.notes && <p className="ad-room-notes">{room.notes}</p>}

      <div className="ad-room-actions">
        {status.key === 'open' && (
          <button className="ad-btn ad-btn-primary" onClick={onShare}>
            Show QR &amp; link
          </button>
        )}
        <button className="ad-btn" onClick={onOpen}>
          {hasPlays ? 'Report' : 'Open'}
        </button>
        {status.key === 'open' ? (
          <>
            <button className="ad-btn" onClick={onExtend}>
              +2 hours
            </button>
            <button className="ad-btn" onClick={onClose}>
              Close now
            </button>
          </>
        ) : (
          <button className="ad-btn" onClick={onReopen}>
            Reopen for 24 hours
          </button>
        )}
        <button className="ad-btn ad-btn-danger" onClick={() => setConfirming((c) => !c)}>
          Delete
        </button>
      </div>

      {confirming && (
        <div className="ad-confirm" role="alert">
          <p>
            This deletes <strong>{room.name}</strong>
            {hasPlays ? ` and its ${num(room.finished)} ${room.finished === 1 ? 'play' : 'plays'}` : ''}{' '}
            for good. Type <strong>{room.code}</strong> to confirm.
          </p>
          <div className="ad-confirm-row">
            <input
              className="ad-input ad-input-code"
              value={typed}
              onChange={(e) => setTyped(e.target.value.toUpperCase())}
              aria-label={`Type ${room.code} to confirm`}
              autoFocus
            />
            <button
              className="ad-btn ad-btn-danger-solid"
              disabled={typed !== room.code}
              onClick={onDelete}
            >
              Delete for good
            </button>
            <button
              className="ad-btn"
              onClick={() => {
                setConfirming(false);
                setTyped('');
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </article>
  );
}

function NewRoomForm({ onCreate, onCancel }) {
  const [name, setName] = useState('');
  // Local, not UTC: in India the UTC date is still yesterday until 5:30am.
  const [heldOn, setHeldOn] = useState(today);
  const [hours, setHours] = useState(24);
  const [max, setMax] = useState(100);
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);

  return (
    <form
      className="ad-form"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        await onCreate({
          name: name.trim(),
          held_on: heldOn || null,
          closes_at: inHours(hours),
          max_participants: Number(max),
          notes: notes.trim() || null,
        });
        setBusy(false);
      }}
    >
      <h2 className="ad-h2">New workshop</h2>

      <label className="ad-label" htmlFor="nr-name">
        Name <span className="ad-muted">— players see this when they join</span>
      </label>
      <input
        id="nr-name"
        className="ad-input"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. Pune College Workshop"
        maxLength={80}
        required
        autoFocus
      />

      <div className="ad-form-row">
        <div>
          <label className="ad-label" htmlFor="nr-date">
            Date
          </label>
          <input
            id="nr-date"
            className="ad-input"
            type="date"
            value={heldOn}
            onChange={(e) => setHeldOn(e.target.value)}
          />
        </div>
        <div>
          <label className="ad-label" htmlFor="nr-closes">
            Link stops working
          </label>
          <select
            id="nr-closes"
            className="ad-input"
            value={hours}
            onChange={(e) => setHours(Number(e.target.value))}
          >
            {CLOSE_AFTER.map((o) => (
              <option key={o.hours} value={o.hours}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="ad-label" htmlFor="nr-max">
            Up to
          </label>
          <div className="ad-input-suffix">
            <input
              id="nr-max"
              className="ad-input"
              type="number"
              min={1}
              max={1000}
              value={max}
              onChange={(e) => setMax(e.target.value)}
              required
            />
            <span>people</span>
          </div>
        </div>
      </div>

      <label className="ad-label" htmlFor="nr-notes">
        Notes <span className="ad-muted">— only you see these</span>
      </label>
      <textarea
        id="nr-notes"
        className="ad-input"
        rows={2}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Venue, contact person, anything for your records"
        maxLength={2000}
      />

      <div className="ad-form-actions">
        <button className="ad-btn ad-btn-primary" disabled={busy || !name.trim()}>
          {busy ? 'Creating…' : 'Create and get the QR code'}
        </button>
        <button type="button" className="ad-btn" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
