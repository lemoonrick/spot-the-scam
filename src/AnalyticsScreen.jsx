import { useEffect, useState } from 'react';

export default function AnalyticsScreen({ results, onRestart }) {
  const total = results.length;
  const correct = results.filter((r) => r.verdictCorrect).length;
  const score = Math.round((correct / total) * 100);

  const [displayScore, setDisplayScore] = useState(0);
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    let current = 0;
    const interval = setInterval(() => {
      current += 1;
      if (current >= score) {
        current = score;
        clearInterval(interval);
      }
      setDisplayScore(current);
    }, 15);

    if (score >= 80) triggerConfetti();

    return () => clearInterval(interval);
  }, [score]);

  // Fetch latest blog posts
  useEffect(() => {
    fetch('https://myfactree.org/wp-json/wp/v2/posts?_embed&per_page=3')
      .then((res) => res.json())
      .then((data) => {
        setPosts(data);
      })
      .catch((err) => {
        console.error('Error fetching blog posts:', err);
      });
  }, []);

  const triggerConfetti = () => {
    const canvas = document.createElement('canvas');
    canvas.className = 'confetti-canvas';
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const pieces = Array.from({ length: 80 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      size: Math.random() * 6 + 4,
      speed: Math.random() * 3 + 2,
    }));

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pieces.forEach((p) => {
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(p.x, p.y, p.size, p.size);
        p.y += p.speed;
      });
      requestAnimationFrame(animate);
    };

    animate();
    setTimeout(() => canvas.remove(), 2500);
  };

  return (
    <div className="analytics-page">
      {/* Analytics Section */}
      <section className="analytics-hero">
        <div className="analytics-inner">
          <h2>Your Media Literacy Score</h2>

          <div
            className="score-ring-modern"
            style={{ '--score': displayScore }}
          >
            <div className="score-modern">{displayScore}%</div>
          </div>

          <p className="analytics-summary">
            You identified {correct} out of {total} scams correctly.
          </p>

          <div className="analytics-feedback">
            {score >= 80 && <p>🧠 Very hard to fool. Nice.</p>}
            {score >= 50 && score < 80 && (
              <p>👍 Decent instincts, but some tricks slipped through.</p>
            )}
            {score < 50 && (
              <p>⚠️ These tactics are designed to manipulate fast reactions.</p>
            )}
          </div>

          <button className="analytics-restart" onClick={onRestart}>
            Try Again
          </button>

          <div className="scroll-indicator">
            <div className="mouse">
              <div className="wheel" />
            </div>
            <span>Scroll to read more</span>
          </div>
        </div>
      </section>

      {/* Blog Section */}
      <section className="blog-section">
        <div className="blog-header">
          <h3>Educate yourself even more</h3>
          <p>Latest insights from our blog</p>
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
                          .slice(0, 120) + '...',
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
