import { useEffect, useMemo, useRef, useState } from 'react';
import { scams as allScams } from './scams';
import { buildSessionSummary } from './session';
import { saveSession } from './lib/saveSession';
import ImpactPanel from './components/ImpactPanel';
import ShareCard from './components/ShareCard';
import './AnalyticsScreen.css';

const SHARE_URL = 'https://spot-the-scam-ebon.vercel.app/';

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
      text: 'Good instincts, but stay sharp.',
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

export default function AnalyticsScreen({ results, onRestart, identity }) {
  // One anonymous record per run — the same shape Phase 2 will store.
  const summary = useMemo(
    () => buildSessionSummary(results, { personalised: !!identity?.personalised }),
    [results, identity],
  );
  const { total, correct, score } = summary;

  const [displayScore, setDisplayScore] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [posts, setPosts] = useState([]);
  const [filter, setFilter] = useState('all');
  const savedRef = useRef(false);

  // Record the run once. StrictMode runs effects twice in development,
  // and a "Try Again" remount would fire it again — the ref keeps one
  // completed quiz to exactly one row.
  useEffect(() => {
    if (savedRef.current) return;
    savedRef.current = true;
    saveSession(summary);
  }, [summary]);

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

  const wrongCount = breakdown.filter((b) => !b.verdictCorrect).length;
  const shown =
    filter === 'wrong' ? breakdown.filter((b) => !b.verdictCorrect) : breakdown;

  return (
    <div className="an-page">
      {/* ── Headline: who, and how they did ── */}
      <section className="an-top">
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
                transition: 'stroke-dashoffset 0.04s linear, stroke 0.3s ease',
              }}
            />
          </svg>
          <div className="an-ring-inner">
            <span className="an-score-num">{displayScore}</span>
            <span className="an-score-pct">%</span>
          </div>
        </div>

        <div className="an-top-copy">
          <h1 className="an-headline">
            {identity?.name ? `${identity.name}, you got ` : 'You got '}
            <strong>
              {correct} of {total}
            </strong>{' '}
            right.
          </h1>
          <p className={`an-verdict an-verdict-${feedback.tier}`}>
            {feedback.text}
          </p>
        </div>
      </section>

      {/* ── Learning impact: baseline vs trained ── */}
      <ImpactPanel summary={summary} />

      {/* ── Share ── */}
      <ShareCard summary={summary} shareUrl={SHARE_URL} />

      {/* ── Answer by answer. Reference detail, so it sits after the
             finding rather than burying it. ── */}
      <section className="an-review">
        <div className="an-review-head">
          <h2 className="an-review-title">Every answer</h2>
          {wrongCount > 0 && (
            <div className="an-filter" role="group" aria-label="Filter answers">
              <button
                className={filter === 'all' ? 'is-on' : ''}
                onClick={() => setFilter('all')}
              >
                All {total}
              </button>
              <button
                className={filter === 'wrong' ? 'is-on' : ''}
                onClick={() => setFilter('wrong')}
              >
                Got wrong ({wrongCount})
              </button>
            </div>
          )}
        </div>

        <div className="an-review-grid">
          {shown.map((item, i) => {
            const { scam, verdictCorrect, verdictChosen } = item;
            if (!scam) return null;
            return (
              <article
                key={`${scam.id}-${i}`}
                className={`an-row ${verdictCorrect ? 'an-row-ok' : 'an-row-bad'}`}
                style={{ animationDelay: revealed ? `${i * 0.04}s` : '0s' }}
              >
                <span className="an-row-icon" aria-hidden="true">
                  {TYPE_ICON[scam.type] || '📱'}
                </span>

                <div className="an-row-main">
                  <div className="an-row-top">
                    <span className="an-row-type">{TYPE_LABEL[scam.type]}</span>
                    <span className="an-row-chip">
                      {verdictCorrect ? 'Correct' : 'Wrong'}
                    </span>
                  </div>

                  {/* Only spell out the mix-up when they got it wrong.
                      On a correct answer it is noise. */}
                  {!verdictCorrect && (
                    <p className="an-row-said">
                      You said{' '}
                      {verdictChosen === 'phishing' ? 'Phishing' : 'Legitimate'}
                      . It was{' '}
                      <strong>
                        {scam.verdict === 'phishing'
                          ? 'Phishing'
                          : 'Legitimate'}
                      </strong>
                      .
                    </p>
                  )}

                  <p className="an-row-why">{scam.explanation.short}</p>

                  {scam.article && (
                    <a
                      href={scam.article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="an-row-link"
                    >
                      {scam.article.title}
                    </a>
                  )}
                </div>
              </article>
            );
          })}
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

      <section className="an-again">
        <button className="an-restart" onClick={onRestart}>
          Try again
        </button>
        <p className="an-again-hint">
          A fresh set, shuffled. Your score is not saved between runs.
        </p>
      </section>
    </div>
  );
}
