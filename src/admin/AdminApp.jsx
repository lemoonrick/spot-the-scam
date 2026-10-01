import { lazy, Suspense, useCallback, useState } from 'react';
import { currentEmail, isLoggedIn, logOut } from './auth';
import { LoggedOutError } from './api';
import LoginScreen from './LoginScreen';
import RoomsScreen from './RoomsScreen';
import RoomReport from './RoomReport';
import './Admin.css';

// The overall dashboard is the heaviest admin page; most visits are to
// run a workshop, so it loads only when its tab is opened.
const ImpactDashboard = lazy(() => import('./ImpactDashboard'));

/**
 * /admin. Everything here loads only for this page, so players never
 * download any of it.
 */
export default function AdminApp() {
  const [loggedIn, setLoggedIn] = useState(isLoggedIn);
  const [tab, setTab] = useState('rooms');
  const [openRoom, setOpenRoom] = useState(null);

  // Any request that finds the login gone sends the admin back here,
  // rather than leaving a page of errors.
  const onError = useCallback((err) => {
    if (err instanceof LoggedOutError) setLoggedIn(false);
  }, []);

  if (!loggedIn) return <LoginScreen onLoggedIn={() => setLoggedIn(true)} />;

  return (
    <div className="ad-page">
      <header className="ad-bar">
        <div className="ad-brand">
          Spot the Scam <span className="ad-brand-tag">Admin</span>
        </div>
        <nav className="ad-tabs" aria-label="Admin sections">
          <button
            className={tab === 'rooms' ? 'is-on' : ''}
            aria-current={tab === 'rooms' ? 'page' : undefined}
            onClick={() => {
              setTab('rooms');
              setOpenRoom(null);
            }}
          >
            Workshops
          </button>
          <button
            className={tab === 'overall' ? 'is-on' : ''}
            aria-current={tab === 'overall' ? 'page' : undefined}
            onClick={() => setTab('overall')}
          >
            Overall
          </button>
        </nav>
        <div className="ad-who">
          <span className="ad-email">{currentEmail()}</span>
          <button
            className="ad-logout"
            onClick={async () => {
              await logOut();
              setLoggedIn(false);
            }}
          >
            Log out
          </button>
        </div>
      </header>

      <main className="ad-main">
        {tab === 'rooms' &&
          (openRoom ? (
            <RoomReport room={openRoom} onBack={() => setOpenRoom(null)} onError={onError} />
          ) : (
            <RoomsScreen onOpen={setOpenRoom} onError={onError} />
          ))}
        {tab === 'overall' && (
          <Suspense fallback={<p className="ad-muted">Loading…</p>}>
            <ImpactDashboard onError={onError} />
          </Suspense>
        )}
      </main>
    </div>
  );
}
