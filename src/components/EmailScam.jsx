import './EmailScam.css';

// ── Rich HTML email body (Netflix-style marketing email) ──────────────────────
function RichEmailBody({ scam, activeFlagId }) {
  const h = scam.richHero;
  return (
    <div className="gmail-rich-body">
      <div className="rich-email-wrap">
        {/* Brand header bar */}
        <div className="rich-email-header">
          <svg className="rich-netflix-n" viewBox="0 0 111 190" fill="none">
            <path
              d="M0 0h30.7l40 112.6V0H101v190H71L30.7 77V190H0V0z"
              fill="#E50914"
            />
          </svg>
          <div className="rich-email-header-text">
            <span className="rich-header-tag">{h.tagline}</span>
            <span className="rich-header-title">{h.title}</span>
            <span className="rich-header-subtitle">{h.subtitle}</span>
          </div>
        </div>

        {/* Dark hero area */}
        <div className="rich-hero">
          <div className="rich-hero-badge">New Episode</div>
          <div className="rich-hero-title">{h.title}</div>
          <div className="rich-hero-meta">
            {h.meta.split('·').map((m, i) => (
              <span key={i}>{m.trim()}</span>
            ))}
          </div>
          <p className="rich-hero-desc">{h.body}</p>

          <div className="rich-cta-wrap">
            <button
              className={`rich-cta-btn rich-flag${activeFlagId === 'real-link' ? ' active' : ''}`}
              style={{ background: h.ctaColor }}
            >
              {h.ctaText}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="rich-footer">
          <p className="rich-footer-text">
            You are receiving this because you subscribed to Netflix updates.{' '}
            <span className="rich-footer-link">Unsubscribe</span>
            {' · '}
            <span className="rich-footer-link">Help Center</span>
            {'\n\n'}
            Netflix, Inc. · 121 Albright Way, Los Gatos, CA 95032
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Plain text email body ─────────────────────────────────────────────────────
function PlainEmailBody({ scam, activeFlagId }) {
  return (
    <div className="gmail-body">
      {scam.message.map((line, i) =>
        line.flag ? (
          <span
            key={i}
            className={`gmail-flag${activeFlagId === line.flag ? ' active' : ''}`}
          >
            {line.text}
          </span>
        ) : (
          <span key={i}>{line.text}</span>
        ),
      )}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function EmailScam({ scam, activeFlagId }) {
  const isRich = scam.emailStyle === 'rich';

  return (
    <div className="gmail-wrap">
      <div className="gmail-chrome">
        {/* Gmail top bar */}
        <div className="gmail-topbar">
          <div className="gmail-topbar-left">
            <div className="gmail-hamburger">
              <span />
              <span />
              <span />
            </div>
            <span className="gmail-wordmark">
              <span style={{ color: '#EA4335' }}>G</span>
              <span style={{ color: '#4285F4' }}>m</span>
              <span style={{ color: '#FBBC05' }}>a</span>
              <span style={{ color: '#34A853' }}>i</span>
              <span style={{ color: '#EA4335' }}>l</span>
            </span>
          </div>
          <div className="gmail-topbar-right">
            <div className="gmail-apps-icon">
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
            </div>
            <div className="gmail-user-avatar">Y</div>
          </div>
        </div>

        {/* Thread */}
        <div className="gmail-thread">
          <div className="gmail-subject-row">
            <h2 className="gmail-subject-line">{scam.subject}</h2>
            <span className="gmail-tag">Inbox</span>
          </div>

          <div className="gmail-message-card">
            {/* Sender row — always present */}
            <div className="gmail-sender-row">
              <div className="gmail-avatar-circle">
                {scam.senderName.charAt(0)}
              </div>
              <div className="gmail-sender-meta">
                <div className="gmail-sender-top">
                  <span className="gmail-sender-name">{scam.senderName}</span>
                  to:
                  <span
                    className={`gmail-sender-addr${
                      activeFlagId === 'spoofed-sender' ||
                      activeFlagId === 'official-domain'
                        ? ' active'
                        : ''
                    }`}
                  >
                    {scam.senderEmail}
                  </span>
                </div>
                <div className="gmail-to-line">
                  to <span className="gmail-to-me">me</span>
                  <svg
                    className="gmail-chevron"
                    viewBox="0 0 12 12"
                    fill="none"
                  >
                    <path
                      d="M3 4.5l3 3 3-3"
                      stroke="#5f6368"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              </div>
              <div className="gmail-msg-time">{scam.time}</div>
            </div>

            {/* Body */}
            {isRich ? (
              <RichEmailBody scam={scam} activeFlagId={activeFlagId} />
            ) : (
              <PlainEmailBody scam={scam} activeFlagId={activeFlagId} />
            )}

            {/* Reply bar */}
            <div className="gmail-reply-row">
              <button className="gmail-reply-btn">
                <svg viewBox="0 0 18 16" fill="none">
                  <path
                    d="M1 8L7 2v3.5C12.5 5.5 16 8 16 14c-1.5-3-4-4.5-9-4.5V13L1 8z"
                    stroke="#5f6368"
                    strokeWidth="1.4"
                    strokeLinejoin="round"
                  />
                </svg>
                Reply
              </button>
              <button className="gmail-reply-btn">
                <svg viewBox="0 0 20 16" fill="none">
                  <path
                    d="M7 8l6-6v3.5C7.5 5.5 3 8 3 14c1.5-3 4-4.5 10-4.5V13l-6-6z"
                    stroke="#5f6368"
                    strokeWidth="1.4"
                    strokeLinejoin="round"
                  />
                </svg>
                Forward
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
