import './WhatsAppScam.css';

export default function WhatsAppScam({ scam, activeFlagId }) {
  // Find the fake-link part for the CTA row
  const linkPart = scam.message.find(p => p.flag === 'fake-link');

  return (
    <div className="wa-wrap">
      <div className="wa-phone">

        {/* WhatsApp header */}
        <div className="wa-header">
          <svg className="wa-back-arrow" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <div className="wa-contact-avatar">{scam.sender.charAt(0)}</div>
          <div className="wa-contact-info">
            <div className="wa-contact-name">{scam.sender}</div>
            <div className="wa-contact-status">Business account</div>
          </div>
          <div className="wa-header-actions">
            <svg viewBox="0 0 24 24" fill="white" width="22" height="22">
              <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
            </svg>
            <svg viewBox="0 0 24 24" fill="white" width="22" height="22">
              <circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/>
            </svg>
          </div>
        </div>

        {/* Chat body */}
        <div className="wa-chat-body">
          {/* Date pill */}
          <div className="wa-date-pill">TODAY</div>

          {/* Security notice */}
          <div className="wa-security-notice">
            <svg viewBox="0 0 24 24" fill="#667781" width="14" height="14">
              <path d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z"/>
            </svg>
            Messages to this business are secured with end-to-end encryption.
          </div>

          {/* Message bubble */}
          <div className="wa-bubble-row">
            <div className="wa-bubble">
              <div className="wa-bubble-text">
                {scam.message.filter(p => p.flag !== 'fake-link').map((block, i) =>
                  block.flag ? (
                    <span
                      key={i}
                      className={`wa-flag${activeFlagId === block.flag ? ' active' : ''}`}
                    >
                      {block.text}
                    </span>
                  ) : (
                    <span key={i}>{block.text}</span>
                  )
                )}
              </div>

              {/* Link preview card */}
              {linkPart && (
                <div className={`wa-link-preview${activeFlagId === 'fake-link' ? ' active' : ''}`}>
                  <div className="wa-link-domain">
                    <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
                      <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" stroke="#1a73e8" strokeWidth="2" strokeLinecap="round"/>
                      <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" stroke="#1a73e8" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    <span className={`wa-flag${activeFlagId === 'fake-link' ? ' active' : ''}`}>
                      {linkPart.text}
                    </span>
                  </div>
                  <div className="wa-link-site">
                    {scam.linkSite || 'jio-kyc-update.in'}
                  </div>
                  <div className="wa-link-title">
                    {scam.linkTitle || 'Jio KYC Verification Portal'}
                  </div>
                </div>
              )}

              <div className="wa-bubble-meta">
                <span className="wa-time">14:46</span>
                <svg viewBox="0 0 18 11" width="16" height="10" fill="#53bdeb">
                  <path d="M17.394 1.557a.75.75 0 0 0-1.06-1.06L8.144 8.69 5.99 6.537a.75.75 0 1 0-1.06 1.06l2.68 2.68a.75.75 0 0 0 1.06 0l8.724-8.72z"/>
                  <path d="M11.25 5.304l-1.06-1.06-4.45 4.45 1.06 1.06 4.45-4.45z"/>
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Input bar */}
        <div className="wa-input-bar">
          <div className="wa-input-field">
            <svg viewBox="0 0 24 24" fill="#8696a0" width="22" height="22">
              <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>
            </svg>
            <span className="wa-placeholder">Message</span>
            <svg viewBox="0 0 24 24" fill="#8696a0" width="22" height="22">
              <path d="M11.5 2C6.81 2 3 5.81 3 10.5S6.81 19 11.5 19h.5v3c4.86-2.34 8-7 8-11.5C20 5.81 16.19 2 11.5 2zm1 14.5h-2v-2h2v2zm0-4h-2c0-3.25 3-3 3-5 0-1.1-.9-2-2-2s-2 .9-2 2h-2c0-2.21 1.79-4 4-4s4 1.79 4 4c0 2.5-3 2.75-3 5z"/>
            </svg>
          </div>
          <div className="wa-mic-btn">
            <svg viewBox="0 0 24 24" fill="white" width="22" height="22">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.78V20c0 .55.45 1 1 1s1-.45 1-1v-2.08c3.02-.43 5.42-2.78 5.91-5.78.1-.6-.39-1.14-1-1.14z"/>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
