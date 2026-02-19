import './InstagramScam.css';

export default function InstagramScam({ scam, activeFlagId }) {
  return (
    <div className="insta-wrap">
      <div className="insta-phone">

        {/* Header */}
        <div className="insta-header">
          <svg className="insta-back" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="#000" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <div className="insta-contact">
            <div className="insta-avatar-ring">
              <div className="insta-avatar">{scam.sender.charAt(0).toUpperCase()}</div>
            </div>
            <div className="insta-contact-info">
              <div className="insta-username">{scam.sender}</div>
              <div className="insta-followers">{scam.followers} · {scam.posts}</div>
            </div>
          </div>
          <div className="insta-header-right">
            <svg viewBox="0 0 24 24" fill="none" width="24" height="24">
              <circle cx="12" cy="12" r="10" stroke="#000" strokeWidth="1.8"/>
              <path d="M12 8v4M12 16h.01" stroke="#000" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
        </div>

        {/* Chat area */}
        <div className="insta-chat">
          {/* Profile card in chat */}
          <div className="insta-profile-card">
            <div className="insta-profile-avatar-lg">
              <div className="insta-avatar-lg">{scam.sender.charAt(0).toUpperCase()}</div>
            </div>
            <div className="insta-profile-username">{scam.sender}</div>
            <div className="insta-profile-meta">{scam.followers} · {scam.posts}</div>
            <button className="insta-visit-btn">Visit profile</button>
          </div>

          {/* Message bubble */}
          <div className="insta-msg-row">
            <div className="insta-msg-avatar">{scam.sender.charAt(0).toUpperCase()}</div>
            <div className="insta-bubble">
              {scam.message.map((part, i) =>
                part.flag ? (
                  <span
                    key={i}
                    className={`insta-flag${activeFlagId === part.flag ? ' active' : ''}`}
                  >
                    {part.text}
                  </span>
                ) : (
                  <span key={i}>{part.text}</span>
                )
              )}
              <div className="insta-msg-time">14:28</div>
            </div>
          </div>
        </div>

        {/* Input bar */}
        <div className="insta-inputbar">
          <div className="insta-input-pill">
            <span className="insta-input-placeholder">Message...</span>
            <div className="insta-input-icons">
              <svg viewBox="0 0 24 24" fill="none" width="22" height="22">
                <circle cx="12" cy="12" r="9" stroke="#8e8e8e" strokeWidth="1.8"/>
                <path d="M9 10.5h.01M15 10.5h.01M9.5 14s1 1.5 2.5 1.5 2.5-1.5 2.5-1.5" stroke="#8e8e8e" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
              <svg viewBox="0 0 24 24" fill="none" width="22" height="22">
                <path d="M12 5v14M5 12h14" stroke="#8e8e8e" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
              <svg viewBox="0 0 24 24" fill="none" width="22" height="22">
                <path d="M12 19V12m0 0l-3 3m3-3l3 3M5 8l1.5-1.5A2 2 0 0 1 8 6h8a2 2 0 0 1 1.5.5L19 8" stroke="#8e8e8e" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
