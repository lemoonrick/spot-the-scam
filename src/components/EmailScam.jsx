import './EmailScam.css';

export default function EmailScam({ scam, selectedFlags, toggleFlag }) {
  return (
    <div className="gmail-wrapper">
      <div className="gmail-container">
        {/* Top toolbar */}
        <div className="gmail-toolbar">
          <button className="icon-btn">
            <svg viewBox="0 0 24 24">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          <button className="icon-btn">
            <svg viewBox="0 0 24 24">
              <path d="M6 6h12v12H6z" />
            </svg>
          </button>

          <button className="icon-btn">
            <svg viewBox="0 0 24 24">
              <path d="M6 7h12M9 7v10m6-10v10M5 7l1 12h12l1-12" />
            </svg>
          </button>

          <button className="icon-btn">
            <svg viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="1" />
              <circle cx="12" cy="6" r="1" />
              <circle cx="12" cy="18" r="1" />
            </svg>
          </button>
        </div>

        {/* Subject */}
        <h1 className="gmail-subject">
          {scam.subject}
          <span className="label">Inbox</span>
        </h1>

        {/* Sender row */}
        <div className="gmail-sender">
          <div className="avatar">{scam.senderName.charAt(0)}</div>

          <div className="sender-meta">
            <div className="sender-top">
              <span className="sender-name">{scam.senderName}</span>
              <span className="sender-email">{scam.senderEmail}</span>
            </div>
            <div className="to-row">to me</div>
          </div>

          <div className="email-time">{scam.time}</div>
        </div>

        {/* Email body */}
        <div className="gmail-body">
          {scam.content.map((block, index) => (
            <p key={index}>
              {block.parts.map((part, i) =>
                part.flagId ? (
                  <span
                    key={i}
                    className={`flag ${
                      selectedFlags.includes(part.flagId) ? 'active' : ''
                    }`}
                    onClick={() => toggleFlag(part.flagId)}
                  >
                    {part.text}
                  </span>
                ) : (
                  part.text
                ),
              )}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
