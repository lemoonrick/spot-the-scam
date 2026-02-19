import { useEffect, useState } from 'react';

export default function AnalyticsScreen({ results, onRestart }) {
  const total = results.length;
  const correct = results.filter((r) => r.verdictCorrect).length;
  const score = Math.round((correct / total) * 100);

  const [displayScore, setDisplayScore] = useState(0);
  const [posts, setPosts] = useState([]);

  // Determine dynamic color based on score
  const getScoreColor = (s) => {
    if (s < 40) return '#ef4444'; // Red
    if (s < 75) return '#f59e0b'; // Amber
    return '#10b981'; // Green
  };

  const currentColor = getScoreColor(displayScore);

  useEffect(() => {
    let current = 0;
    const interval = setInterval(() => {
      current += 1;
      if (current >= score) {
        current = score;
        clearInterval(interval);
      }
      setDisplayScore(current);
    }, 20);

    if (score >= 80) triggerConfetti(getScoreColor(score));

    return () => clearInterval(interval);
  }, [score]);

  useEffect(() => {
    fetch('https://myfactree.org/wp-json/wp/v2/posts?_embed&per_page=3')
      .then((res) => res.json())
      .then((data) => setPosts(data))
      .catch((err) => console.error('Error fetching blog posts:', err));
  }, []);

  const triggerConfetti = (color) => {
    const canvas = document.createElement('canvas');
    canvas.className = 'confetti-canvas';
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const pieces = Array.from({ length: 100 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      size: Math.random() * 8 + 4,
      speed: Math.random() * 4 + 2,
      color: color,
      rotation: Math.random() * 360,
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
        p.rotation += 2;
      });
      if (pieces[0].y < canvas.height + 100) requestAnimationFrame(animate);
    };
    animate();
    setTimeout(() => canvas.remove(), 4000);
  };

  return (
    <div className="analytics-page">
      <section className="analytics-hero">
        <div className="analytics-inner">
          <h2 className="analytics-title">Media Literacy Analysis</h2>

          {/* New Modern Score Visualization */}
          <div className="score-container">
            <div
              className="score-glow"
              style={{ backgroundColor: currentColor }}
            />
            <div
              className="score-ring-v2"
              style={{
                '--score': displayScore,
                '--score-color': currentColor,
              }}
            >
              <div className="score-content">
                <span className="score-number">{displayScore}</span>
                <span className="score-percent">%</span>
              </div>
            </div>
          </div>

          <p className="analytics-summary">
            You identified <strong>{correct}</strong> out of{' '}
            <strong>{total}</strong> scams correctly.
          </p>

          <div className="analytics-feedback">
            {score >= 80 && (
              <p className="feedback-badge high">
                🧠 Hard to fool. Exceptional instincts.
              </p>
            )}
            {score >= 50 && score < 80 && (
              <p className="feedback-badge mid">
                👍 Good instincts, but stay vigilant.
              </p>
            )}
            {score < 50 && (
              <p className="feedback-badge low">
                ⚠️ You're reacting too fast. Be careful.
              </p>
            )}
          </div>

          <button className="analytics-restart-v2" onClick={onRestart}>
            Retake Assessment
          </button>

          <div className="scroll-indicator">
            <div className="mouse">
              <div className="wheel" />
            </div>
            <span>Deep Dive into Scams</span>
          </div>
        </div>
      </section>

      {/* Blog section remains same... */}
      <section className="blog-section">
        <div className="blog-header">
          <h3>Continue Learning</h3>
          <p>Latest investigations from our researchers</p>
        </div>
        <div className="blog-grid">
          {posts.map((post) => {
            const image = post._embedded?.['wp:featuredmedia']?.[0]?.source_url;
            return (
              <a
                key={post.id}
                href={post.link}
                target="_blank"
                rel="noopener noreferrer"
                className="blog-card"
              >
                {image && (
                  <div
                    className="blog-image"
                    style={{ backgroundImage: `url(${image})` }}
                  />
                )}
                <div className="blog-content">
                  <h4
                    dangerouslySetInnerHTML={{ __html: post.title.rendered }}
                  />
                  <p
                    dangerouslySetInnerHTML={{
                      __html:
                        post.excerpt.rendered
                          .replace(/<[^>]+>/g, '')
                          .slice(0, 110) + '...',
                    }}
                  />
                </div>
              </a>
            );
          })}
        </div>
      </section>
    </div>
  );
}
