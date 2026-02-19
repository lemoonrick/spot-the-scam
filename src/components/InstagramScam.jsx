import './InstagramScam.css';

export default function InstagramScam({ scam, activeFlagId }) {
  return (
    <div className="insta-container">
      <div className="insta-card">
        <div className="insta-header">
          <div className="insta-user">
            <div className="insta-avatar"></div>
            <div>
              <div className="insta-name">{scam.sender}</div>
              <div className="insta-meta">1,284 followers · 12 posts</div>
            </div>
          </div>
        </div>

        <div className="insta-message">
          {scam.message.map((part, i) =>
            part.flag ? (
              <span
                key={i}
                className={`insta-flag ${activeFlagId === part.flag ? 'active' : ''}`}
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
