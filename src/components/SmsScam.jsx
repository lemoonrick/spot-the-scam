import './SmsScam.css';

const SmsScam = ({ scam, selectedFlags, toggleFlag }) => {
  const isSelected = (flag) => selectedFlags.includes(flag);

  return (
    <div className="sms-wrapper">
      <div className="sms-top">
        <div className="sms-label">Text Message · SMS</div>
        <div className="sms-date">Friday, 2:05 PM</div>
      </div>

      <div className="sms-bubble">
        {scam.message.map((block, i) =>
          block.flag ? (
            <span
              key={i}
              className={`sms-flag ${isSelected(block.flag) ? 'selected' : ''}`}
              onClick={() => toggleFlag(block.flag)}
            >
              {block.text}
            </span>
          ) : (
            <span key={i}>{block.text}</span>
          ),
        )}
      </div>
    </div>
  );
};

export default SmsScam;
