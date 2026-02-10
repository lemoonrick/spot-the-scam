import './WhatsAppScam.css';

const WhatsAppScam = ({ scam, selectedFlags, toggleFlag }) => {
  const isSelected = (flag) => selectedFlags.includes(flag);

  return (
    <div className="wa-wrapper">
      <div className="wa-chat">
        <div className="wa-date">Today</div>

        <div className="wa-system">
          This business uses a secure service from Meta to manage this chat. Tap
          to learn more.
        </div>

        <div className="wa-bubble incoming">
          <div className="wa-message">
            {scam.message.map((block, i) =>
              block.flag ? (
                <span
                  key={i}
                  className={`wa-flag ${isSelected(block.flag) ? 'selected' : ''}`}
                  onClick={() => toggleFlag(block.flag)}
                >
                  {block.text}
                </span>
              ) : (
                <span key={i}>{block.text}</span>
              ),
            )}
          </div>

          <div
            className={`wa-cta ${isSelected('cta') ? 'selected' : ''}`}
            onClick={() => toggleFlag('cta')}
          >
            <span className="wa-cta-icon">↗</span>
            <span className="wa-cta-text">Click here</span>
          </div>

          <div className="wa-time">14:46</div>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppScam;
