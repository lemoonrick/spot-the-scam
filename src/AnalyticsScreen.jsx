import { useEffect, useState } from 'react';
import { scams as allScams } from './scams';
import './AnalyticsScreen.css';

const TYPE_ICON = {
  sms: '💬',
  email: '📧',
  whatsapp: '💚',
  instagram: '📸',
  popup: '⚠️',
  upi: '💳',
};

const TYPE_LABEL = {
  sms: 'SMS',
  email: 'Email',
  whatsapp: 'WhatsApp',
  instagram: 'Instagram',
  popup: 'Browser Popup',
  upi: 'UPI / GPay',
};

function getScoreColor(s) {
  if (s < 40) return '#ef4444';
  if (s < 75) return '#f59e0b';
  return '#10b981';
}

function getFeedback(score) {
  if (score >= 80)
    return {
      emoji: '🧠',
      text: 'Hard to fool. Exceptional instincts.',
      tier: 'high',
    };
  if (score >= 50)
    return {
      emoji: '👍',
      text: 'Good instincts — but stay sharp.',
      tier: 'mid',
    };
  return {
    emoji: '⚠️',
    text: "You're reacting too fast. Be careful.",
    tier: 'low',
  };
}

function triggerConfetti(color) {
  const canvas = document.createElement('canvas');
  canvas.className = 'confetti-canvas';
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const colors = [color, '#22c55e', '#3b82f6', '#f59e0b', '#ec4899'];
  const pieces = Array.from({ length: 120 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height - canvas.height,
    size: Math.random() * 8 + 4,
    speed: Math.random() * 4 + 2,
    color: colors[Math.floor(Math.random() * colors.length)],
    rotation: Math.random() * 360,
    spin: (Math.random() - 0.5) * 4,
  }));

  const animate = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pieces.forEach((p) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      ctx.restore();
      p.y += p.speed;
      p.rotation += p.spin;
    });
    if (pieces[0].y < canvas.height + 100) requestAnimationFrame(animate);
  };
  animate();
  setTimeout(() => canvas.remove(), 4000);
}

export default function AnalyticsScreen({ results, onRestart }) {
  const total = results.length;
  const correct = results.filter((r) => r.verdictCorrect).length;
  const score = total > 0 ? Math.round((correct / total) * 100) : 0;

  const [displayScore, setDisplayScore] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [posts, setPosts] = useState([]);

  const scoreColor = getScoreColor(displayScore);
  const feedback = getFeedback(score);

  useEffect(() => {
    const delay = setTimeout(() => {
      let current = 0;
      const step = setInterval(() => {
        current += 1;
        if (current >= score) {
          current = score;
          clearInterval(step);
        }
        setDisplayScore(current);
      }, 18);
      return () => clearInterval(step);
    }, 400);

    if (score >= 80)
      setTimeout(() => triggerConfetti(getScoreColor(score)), 600);
    setTimeout(() => setRevealed(true), 300);

    return () => clearTimeout(delay);
  }, [score]);

  // Fetch blog posts for the bottom section
  useEffect(() => {
    fetch('https://myfactree.org/wp-json/wp/v2/posts?_embed&per_page=3')
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then(setPosts)
      .catch(() => {});
  }, []);

  // Match each result to its scam — article lives directly on the scam object
  const breakdown = results.map((r) => {
    const scam = allScams.find((s) => s.id === r.scamId);
    return { ...r, scam };
  });

  return (
    <div className="an-page">
      {/* ── Hero ── */}
      <section className="an-hero">
        {/* LEFT — score */}
        <div className="an-score-side">
          <p className="an-eyebrow">Your Results</p>

          <div className="an-ring-wrap">
            <div className="an-ring-glow" style={{ background: scoreColor }} />
            <svg className="an-ring-svg" viewBox="0 0 120 120">
              <circle
                cx="60"
                cy="60"
                r="52"
                fill="none"
                stroke="#e2e8f0"
                strokeWidth="10"
              />
              <circle
                cx="60"
                cy="60"
                r="52"
                fill="none"
                stroke={scoreColor}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 52}`}
                strokeDashoffset={`${2 * Math.PI * 52 * (1 - displayScore / 100)}`}
                transform="rotate(-90 60 60)"
                style={{
                  transition:
                    'stroke-dashoffset 0.04s linear, stroke 0.3s ease',
                }}
              />
            </svg>
            <div className="an-ring-inner">
              <span className="an-score-num">{displayScore}</span>
              <span className="an-score-pct">%</span>
            </div>
          </div>

          <p className="an-tally">
            <strong>{correct}</strong> correct out of <strong>{total}</strong>
          </p>

          <div className={`an-badge an-badge-${feedback.tier}`}>
            {feedback.emoji} {feedback.text}
          </div>

          <button className="an-restart" onClick={onRestart}>
            Try Again
          </button>
        </div>

        {/* RIGHT — breakdown */}
        <div className="an-breakdown-side">
          <p className="an-breakdown-title">Question Breakdown</p>
          <div className="an-breakdown-grid">
            {breakdown.map((item, i) => {
              const { scam, verdictCorrect, verdictChosen } = item;
              if (!scam) return null;

              return (
                <div
                  key={i}
                  className={`an-item ${verdictCorrect ? 'an-item-correct' : 'an-item-wrong'}`}
                  style={{ animationDelay: revealed ? `${i * 0.06}s` : '0s' }}
                >
                  <div className="an-item-icon">
                    {TYPE_ICON[scam.type] || '📱'}
                  </div>

                  <div className="an-item-body">
                    <span className="an-item-type">
                      {TYPE_LABEL[scam.type]}
                    </span>

                    <span className="an-item-verdict">
                      You said:{' '}
                      <strong>
                        {verdictChosen === 'phishing'
                          ? 'Phishing'
                          : 'Legitimate'}
                      </strong>
                      {' · '}
                      <span
                        style={{
                          color: verdictCorrect ? '#16a34a' : '#dc2626',
                        }}
                      >
                        {verdictCorrect
                          ? 'Correct ✓'
                          : `Wrong — it was ${scam.verdict === 'phishing' ? 'Phishing' : 'Legitimate'}`}
                      </span>
                    </span>

                    <span className="an-item-short">
                      {scam.explanation.short}
                    </span>

                    {/* Real article link — always present since it's hardcoded on each scam */}
                    {scam.article && (
                      <a
                        href={scam.article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="an-item-article"
                      >
                        <svg
                          width="11"
                          height="11"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <path
                            d="M12 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-6M16 2h6m0 0v6m0-6L10 14"
                            stroke="currentColor"
                            strokeWidth="2.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        {scam.article.title}
                      </a>
                    )}
                  </div>

                  <div
                    className={`an-item-tick ${verdictCorrect ? 'tick-yes' : 'tick-no'}`}
                  >
                    {verdictCorrect ? '✓' : '✗'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Blog section ── */}
      {posts.length > 0 && (
        <section className="an-blog">
          <div className="an-blog-header">
            <h3 className="an-blog-title">Continue Learning</h3>
            <p className="an-blog-sub">
              Latest investigations from our researchers
            </p>
          </div>
          <div className="an-blog-grid">
            {posts.map((post) => {
              const image =
                post._embedded?.['wp:featuredmedia']?.[0]?.source_url;
              return (
                <a
                  key={post.id}
                  href={post.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="an-blog-card"
                >
                  {image && (
                    <div
                      className="an-blog-img"
                      style={{ backgroundImage: `url(${image})` }}
                    />
                  )}
                  <div className="an-blog-content">
                    <h4
                      dangerouslySetInnerHTML={{ __html: post.title.rendered }}
                    />
                    <p
                      dangerouslySetInnerHTML={{
                        __html:
                          post.excerpt.rendered
                            .replace(/<[^>]+>/g, '')
                            .slice(0, 110) + '…',
                      }}
                    />
                  </div>
                </a>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
