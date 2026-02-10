import './EmailScam.css';

const EmailScam = ({ scam, selectedFlags, toggleFlag }) => {
  const isSelected = (flag) => selectedFlags.includes(flag);

  return (
    <div className="email-wrapper">
      <div className="email-header">
        <h2 className="email-subject">{scam.subject}</h2>

        <div className="email-meta">
          <strong>{scam.senderName}</strong>{' '}
          <span className="email-address">&lt;{scam.sender}&gt;</span>
          <span className="email-time">9:14 AM</span>
        </div>
      </div>

      <div className="email-body">
        {scam.message.map((block, i) =>
          block.flag ? (
            <span
              key={i}
              className={`email-flag ${isSelected(block.flag) ? 'selected' : ''}`}
              onClick={() => toggleFlag(block.flag)}
            >
              {block.text}
            </span>
          ) : (
            <span key={i}>{block.text}</span>
          ),
        )}
      </div>

      <div className="email-actions">
        <button>Looking forward to it!</button>
        <button>We will be there!</button>
        <button>Thanks for the update!</button>
      </div>
    </div>
  );
};

export default EmailScam;
