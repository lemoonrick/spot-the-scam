import './SmsScam.css';

export default function SmsScam({ scam, activeFlagId }) {
  return (
    <div className="sms-phone-wrap">
      <div className="sms-phone">
        {/* Status bar */}
        <div className="sms-statusbar">
          <span className="sms-time-pill">9:41</span>
          <div className="sms-statusbar-right">
            <svg width="17" height="12" viewBox="0 0 17 12" fill="white">
              <rect x="0" y="3" width="3" height="9" rx="1" opacity="0.4"/>
              <rect x="4.5" y="2" width="3" height="10" rx="1" opacity="0.6"/>
              <rect x="9" y="0.5" width="3" height="11.5" rx="1"/>
              <rect x="13.5" y="0" width="3" height="12" rx="1"/>
            </svg>
            <svg width="16" height="12" viewBox="0 0 16 12" fill="white">
              <path d="M8 2.4C10.8 2.4 13.3 3.5 15.1 5.3L16 4.4C13.9 2.3 11.1 1 8 1C4.9 1 2.1 2.3 0 4.4L0.9 5.3C2.7 3.5 5.2 2.4 8 2.4Z" opacity="0.4"/>
              <path d="M8 5.2C10 5.2 11.8 6 13.1 7.3L14 6.4C12.4 4.8 10.3 3.8 8 3.8C5.7 3.8 3.6 4.8 2 6.4L2.9 7.3C4.2 6 6 5.2 8 5.2Z" opacity="0.7"/>
              <path d="M8 8C9.2 8 10.3 8.5 11.1 9.2L12 8.4C10.9 7.4 9.5 6.8 8 6.8C6.5 6.8 5.1 7.4 4 8.4L4.9 9.2C5.7 8.5 6.8 8 8 8Z"/>
              <circle cx="8" cy="11" r="1.2"/>
            </svg>
            <div className="sms-battery">
              <div className="sms-battery-inner" style={{width: '78%'}}/>
              <div className="sms-battery-nub"/>
            </div>
          </div>
        </div>

        {/* Nav bar */}
        <div className="sms-navbar">
          <div className="sms-back">
            <svg width="10" height="16" viewBox="0 0 10 16" fill="none">
              <path d="M8.5 1.5L1.5 8L8.5 14.5" stroke="#007AFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="sms-back-label">Messages</span>
          </div>
          <div className="sms-contact-info">
            <div className="sms-contact-avatar">{scam.sender.charAt(0)}</div>
            <div className="sms-contact-name">{scam.sender}</div>
          </div>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="#007AFF" strokeWidth="1.8"/>
            <path d="M12 8v4M12 16h.01" stroke="#007AFF" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>

        {/* Message thread */}
        <div className="sms-thread">
          <div className="sms-thread-date">Today 2:05 PM</div>

          <div className="sms-bubble-row">
            <div className="sms-bubble incoming">
              {scam.message.map((part, i) =>
                part.flag ? (
                  <span
                    key={i}
                    className={`sms-flag${activeFlagId === part.flag ? ' active' : ''}`}
                  >
                    {part.text}
                  </span>
                ) : (
                  <span key={i}>{part.text}</span>
                )
              )}
            </div>
          </div>
        </div>

        {/* Input bar */}
        <div className="sms-inputbar">
          <div className="sms-input-pill">
            <span className="sms-input-placeholder">iMessage</span>
          </div>
          <div className="sms-send-btn">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="white">
              <path d="M7 1v12M7 1L3 5M7 1l4 4" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
