import './PopupScam.css';

export default function PopupScam({ scam, selectedFlags, toggleFlag }) {
  return (
    <div className="popup-wrapper">
      <div className="popup-browser">
        <div className="popup-bar">
          <div className="popup-dots">
            <span />
            <span />
            <span />
          </div>
          <div className="popup-url">security-alert.com</div>
        </div>

        <div className="popup-content">
          {scam.message.map((part, i) =>
            part.flag ? (
              <span
                key={i}
                className={`popup-flag ${
                  selectedFlags.includes(part.flag) ? 'selected' : ''
                }`}
                onClick={() => toggleFlag(part.flag)}
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
