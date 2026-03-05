import './UpiScam.css';

// Simulates the GPay screen you'd see AFTER tapping "Pay" on a collect request.
// This is the critical moment — you're about to enter your UPI PIN.
// The scam: the "note" says it's a refund from Flipkart, but entering your PIN
// will send ₹1 — and then escalate to larger amounts.

export default function UpiScam({ scam, activeFlagId }) {
  const dots = [0, 1, 2, 3, 4, 5]; // 6-digit UPI PIN dots

  return (
    <div className="upi-wrap">
      <div className="upi-phone">
        {/* Status bar */}
        <div className="upi-statusbar">
          <span className="upi-time">9:41</span>
          <div className="upi-sb-icons">
            {/* Signal bars */}
            <svg width="16" height="11" viewBox="0 0 17 12" fill="white">
              <rect x="0" y="4" width="3" height="8" rx="0.8" opacity="0.4" />
              <rect
                x="4.5"
                y="2.5"
                width="3"
                height="9.5"
                rx="0.8"
                opacity="0.6"
              />
              <rect x="9" y="1" width="3" height="11" rx="0.8" />
              <rect x="13.5" y="0" width="3" height="12" rx="0.8" />
            </svg>
            {/* WiFi */}
            <svg width="15" height="11" viewBox="0 0 16 12" fill="white">
              <path
                d="M8 2.4C10.8 2.4 13.3 3.5 15.1 5.3L16 4.4C13.9 2.3 11.1 1 8 1C4.9 1 2.1 2.3 0 4.4L0.9 5.3C2.7 3.5 5.2 2.4 8 2.4Z"
                opacity="0.4"
              />
              <path
                d="M8 5.2C10 5.2 11.8 6 13.1 7.3L14 6.4C12.4 4.8 10.3 3.8 8 3.8C5.7 3.8 3.6 4.8 2 6.4L2.9 7.3C4.2 6 6 5.2 8 5.2Z"
                opacity="0.7"
              />
              <path d="M8 8C9.2 8 10.3 8.5 11.1 9.2L12 8.4C10.9 7.4 9.5 6.8 8 6.8C6.5 6.8 5.1 7.4 4 8.4L4.9 9.2C5.7 8.5 6.8 8 8 8Z" />
              <circle cx="8" cy="11" r="1.2" />
            </svg>
            {/* Battery */}
            <div className="upi-battery">
              <div className="upi-battery-fill" />
            </div>
          </div>
        </div>

        {/* GPay dark header */}
        <div className="upi-header">
          {/* Back arrow */}
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path
              d="M19 12H5M5 12L12 19M5 12L12 5"
              stroke="rgba(255,255,255,0.7)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {/* Recipient info */}
          <div className="upi-header-center">
            <div className="upi-avatar-sm">R</div>
            <div className="upi-header-text">
              <span
                className={`upi-recipient-name${activeFlagId === 'fake-upi-id' ? ' upi-active' : ''}`}
              >
                {scam.sender}
              </span>
              <span
                className={`upi-recipient-id${activeFlagId === 'fake-upi-id' ? ' upi-active active' : ''}`}
              >
                {scam.upiId}
              </span>
            </div>
          </div>
          <div style={{ width: 22 }} /> {/* spacer */}
        </div>

        {/* Amount section */}
        <div
          className={`upi-amount-section${activeFlagId === 'collect-not-receive' ? ' upi-active' : ''}`}
        >
          <p className="upi-paying-label">Paying</p>
          <p
            className={`upi-amount${activeFlagId === 'collect-not-receive' ? ' active' : ''}`}
          >
            {scam.amount}
          </p>

          {/* Note from sender */}
          <div
            className={`upi-note-chip${activeFlagId === 'small-amount-trick' ? ' upi-active active' : ''}`}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                stroke="rgba(255,255,255,0.6)"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
            <span>{scam.note}</span>
          </div>
        </div>

        {/* PIN entry area */}
        <div className="upi-pin-area">
          <p className="upi-pin-label">Enter UPI PIN</p>

          {/* 6 dot placeholders */}
          <div className="upi-pin-dots">
            {dots.map((i) => (
              <div key={i} className="upi-pin-dot" />
            ))}
          </div>

          {/* Numpad */}
          <div className="upi-numpad">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map(
              (key, i) => (
                <button
                  key={i}
                  className={`upi-key${key === '' ? ' upi-key-empty' : ''}`}
                  disabled
                >
                  {key}
                </button>
              ),
            )}
          </div>
        </div>

        {/* Bottom bank selector */}
        <div className="upi-bank-row">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path
              d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
              stroke="#5f6368"
              strokeWidth="1.8"
            />
          </svg>
          <span className="upi-bank-name">SBI ••••4821</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path
              d="M6 9l6 6 6-6"
              stroke="#5f6368"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
