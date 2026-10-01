import { useState } from 'react';
import { normaliseRoomCode, roomCodeProblem } from '../lib/room';
import './WorkshopJoin.css';

/**
 * The workshop part of the start screen.
 *
 * Most visitors never see more than one small link here. Someone who
 * arrives through a workshop's QR code or link sees which workshop they
 * are joining before they start, so a wrong or stale link is caught at
 * the door rather than after ten questions.
 *
 * @param {object}   props
 * @param {object}   props.roomState  { status, room?, code? } from App
 * @param {Function} props.onJoin     (code) → check and join a room
 * @param {Function} props.onLeave    play the public quiz instead
 */
export default function WorkshopJoin({ roomState, onJoin, onLeave }) {
  const { status, room, code } = roomState;

  if (status === 'checking') {
    return (
      <p className="wj-note" role="status">
        Checking workshop code <strong>{code}</strong>…
      </p>
    );
  }

  if (status === 'ok') {
    return (
      <div className="wj-banner" role="status">
        <span className="wj-banner-eyebrow">You&rsquo;re joining</span>
        <strong className="wj-banner-name">{room.name}</strong>
        <span className="wj-banner-code">Workshop code {room.code}</span>
        <button type="button" className="wj-link" onClick={onLeave}>
          Not your workshop? Play the public quiz instead
        </button>
      </div>
    );
  }

  if (status === 'closed') {
    return (
      <div className="wj-notice" role="status">
        <strong>{room.name}</strong> has ended. You can still play the public
        quiz.
      </div>
    );
  }

  if (status === 'offline') {
    return (
      <div className="wj-notice wj-notice-warn" role="alert">
        Couldn&rsquo;t check workshop code <strong>{code}</strong>. Check your
        connection.
        <div className="wj-notice-actions">
          <button type="button" className="wj-small-btn" onClick={() => onJoin(code)}>
            Try again
          </button>
          <button type="button" className="wj-link" onClick={onLeave}>
            Play the public quiz instead
          </button>
        </div>
      </div>
    );
  }

  // No room yet: either nobody asked for one, or the last code didn't match.
  return <CodeEntry notFound={status === 'not-found' ? code : null} onJoin={onJoin} />;
}

function CodeEntry({ notFound, onJoin }) {
  // Open straight away if a code just failed, so the player can fix it.
  const [open, setOpen] = useState(Boolean(notFound));
  const [value, setValue] = useState('');

  const problem = roomCodeProblem(value);
  const code = normaliseRoomCode(value);

  if (!open) {
    return (
      <button type="button" className="wj-link wj-open" onClick={() => setOpen(true)}>
        Joining a workshop? Enter your code
      </button>
    );
  }

  return (
    <form
      className="wj-form"
      onSubmit={(e) => {
        e.preventDefault();
        if (code) onJoin(code);
      }}
    >
      {notFound && (
        <p className="wj-error" role="alert">
          No workshop has the code <strong>{notFound}</strong>. Check it against
          the screen and try again.
        </p>
      )}
      <label className="wj-label" htmlFor="wj-code">
        Workshop code
      </label>
      <div className="wj-row">
        <input
          id="wj-code"
          className="wj-input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="e.g. KFTR9M"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck="false"
          maxLength={9}
          aria-invalid={Boolean(problem)}
          aria-describedby="wj-help"
          autoFocus
        />
        <button type="submit" className="wj-join" disabled={!code}>
          Join
        </button>
      </div>
      <p id="wj-help" className={`wj-help ${problem ? 'wj-help-bad' : ''}`}>
        {problem ?? 'Six letters and numbers, from your facilitator’s screen.'}
      </p>
    </form>
  );
}
