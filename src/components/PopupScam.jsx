import './PopupScam.css';

export default function PopupScam({ scam, activeFlagId }) {
  return (
    <div className="popup-scene">
      {/* Fake browser window behind the dialog */}
      <div className="popup-browser">
        <div className="popup-browser-bar">
          <div className="popup-dots">
            <span className="dot red" />
            <span className="dot yellow" />
            <span className="dot green" />
          </div>
          <div className="popup-address-bar">
            <svg viewBox="0 0 16 16" fill="none" width="11" height="11">
              <circle
                cx="8"
                cy="8"
                r="6.5"
                stroke="#9ca3af"
                strokeWidth="1.3"
              />
              <path
                d="M8 5v3l1.5 1.5"
                stroke="#9ca3af"
                strokeWidth="1.3"
                strokeLinecap="round"
              />
            </svg>
            <span>http://security-alert.com</span>
          </div>
          <div className="popup-tab-add">+</div>
        </div>
        <div className="popup-browser-body">
          <div className="popup-skeleton-line" />
          <div className="popup-skeleton-line short" />
          <div className="popup-skeleton-line" />
          <div className="popup-skeleton-line medium" />
          <div className="popup-skeleton-line short" />
        </div>
      </div>

      {/* The actual Windows-style alert dialog */}
      <div className="popup-dialog">
        {/* Title bar */}
        <div className="popup-titlebar">
          <div className="popup-titlebar-left">
            <div className="popup-ms-logo">
              <span className="ms-r">&#9632;</span>
              <span className="ms-g">&#9632;</span>
              <span className="ms-b">&#9632;</span>
              <span className="ms-y">&#9632;</span>
            </div>
            <span className="popup-title-text">Windows Security Alert</span>
          </div>
          <button className="popup-title-close" aria-label="close">
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="popup-body">
          <div className="popup-warning-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" width="40" height="40">
              <path
                d="M12 3L2 20h20L12 3z"
                stroke="#1a1a1a"
                strokeWidth="2"
                strokeLinejoin="round"
              />
              <path
                d="M12 10v5M12 17.5h.01"
                stroke="#1a1a1a"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div className="popup-message">
            {scam.message.map((part, i) =>
              part.flag ? (
                <span
                  key={i}
                  className={`popup-flag${activeFlagId === part.flag ? ' active' : ''}`}
                >
                  {part.text}
                </span>
              ) : (
                <span key={i}>{part.text}</span>
              ),
            )}
          </div>
        </div>

        {/* Footer buttons */}
        <div className="popup-footer">
          <button className="popup-btn-ok">OK</button>
          <button className="popup-btn-cancel">Cancel</button>
        </div>
      </div>
    </div>
  );
}
