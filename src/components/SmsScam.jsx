import './SmsScam.css';

export default function SmsScam({ scam, activeFlagId }) {
  return (
    <div className="sms-container">
      <div className="sms-header">
        <div className="sms-header-left">
          <div className="sms-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path
                d="M15 18l-6-6 6-6"
                stroke="#0f172a"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div>
            <div className="sms-title">{scam.sender}</div>
            <div className="sms-subtitle">Text Message · SMS</div>
          </div>
        </div>

        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="5" r="2" fill="#64748b" />
          <circle cx="12" cy="12" r="2" fill="#64748b" />
          <circle cx="12" cy="19" r="2" fill="#64748b" />
        </svg>
      </div>

      <div className="sms-body">
        <div className="sms-meta">Today · 2:05 PM</div>

        <div className="sms-bubble">
          {scam.message.map((part, i) =>
            part.flag ? (
              <span
                key={i}
                className={`sms-flag ${activeFlagId === part.flag ? 'active' : ''}`}
              >
                {part.text}
              </span>
            ) : (
              <span key={i}>{part.text}</span>
            ),
          )}
        </div>
      </div>
    </div>
  );
}
