import { useState } from 'react';

// Portrait card sized for Instagram / WhatsApp status.
const W = 1080;
const H = 1350;

const FONT = "'Poppins', system-ui, sans-serif";

function text(ctx, str, x, y, { size = 40, weight = 600, color = '#0f172a', align = 'left' } = {}) {
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.fillText(str, x, y);
}

/** Naive word wrap — enough for the two short strings we draw. */
function wrap(ctx, str, x, y, maxW, lineH, opts) {
  const words = str.split(' ');
  let line = '';
  let cy = y;
  ctx.font = `${opts.weight ?? 600} ${opts.size}px ${FONT}`;
  words.forEach((w) => {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxW && line) {
      text(ctx, line, x, cy, opts);
      line = w;
      cy += lineH;
    } else {
      line = test;
    }
  });
  if (line) text(ctx, line, x, cy, opts);
  return cy + lineH;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawCard(summary) {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  // Background
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#0f172a');
  bg.addColorStop(1, '#1e293b');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  const PAD = 88;
  const up = summary.improvement > 0;
  const accent = up ? '#22c55e' : '#38bdf8';

  // Header
  text(ctx, 'SPOT THE SCAM', PAD, 130, {
    size: 30, weight: 700, color: '#64748b',
  });
  ctx.fillStyle = accent;
  ctx.fillRect(PAD, 158, 86, 5);

  // Hero
  let y = wrap(
    ctx,
    up ? 'I got better at spotting scams in 5 minutes.' : 'I just tested how well I spot scams.',
    PAD, 296, W - PAD * 2, 82,
    { size: 62, weight: 700, color: '#f8fafc' },
  );

  // Before → after blocks
  y += 40;
  const boxW = (W - PAD * 2 - 56) / 2;
  const boxH = 300;

  const block = (x, value, label, caption, color) => {
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    roundRect(ctx, x, y, boxW, boxH, 32);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 2;
    ctx.stroke();

    text(ctx, `${value}%`, x + boxW / 2, y + 150, {
      size: 104, weight: 700, color, align: 'center',
    });
    text(ctx, label, x + boxW / 2, y + 206, {
      size: 30, weight: 600, color: '#e2e8f0', align: 'center',
    });
    text(ctx, caption, x + boxW / 2, y + 250, {
      size: 24, weight: 500, color: '#64748b', align: 'center',
    });
  };

  block(PAD, summary.baselineScore, 'First half', 'before learning', '#94a3b8');
  block(PAD + boxW + 56, summary.trainedScore, 'Second half', 'after learning', accent);

  // Arrow between the two
  text(ctx, '→', W / 2, y + 158, { size: 46, weight: 700, color: '#475569', align: 'center' });

  y += boxH + 76;

  // Delta pill
  if (summary.improvement !== 0) {
    const label = `${up ? '+' : ''}${summary.improvement} points`;
    ctx.font = `700 40px ${FONT}`;
    const pillW = ctx.measureText(label).width + 88;
    ctx.fillStyle = up ? 'rgba(34,197,94,0.16)' : 'rgba(56,189,248,0.16)';
    roundRect(ctx, PAD, y, pillW, 88, 44);
    ctx.fill();
    text(ctx, label, PAD + pillW / 2, y + 58, {
      size: 40, weight: 700, color: accent, align: 'center',
    });
    y += 132;
  }

  // Closing line
  y = wrap(
    ctx,
    'Most people learn about scams after they fall for one. Try it before that happens.',
    PAD, y + 24, W - PAD * 2, 54,
    { size: 36, weight: 500, color: '#94a3b8' },
  );

  // Footer
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.fillRect(PAD, H - 168, W - PAD * 2, 2);
  text(ctx, 'myfactree.org', PAD, H - 96, { size: 34, weight: 600, color: '#e2e8f0' });
  text(ctx, 'Free · No sign-up · 5 minutes', W - PAD, H - 96, {
    size: 30, weight: 500, color: '#64748b', align: 'right',
  });

  return canvas;
}

const SHARE_TEXT = (s) =>
  s.improvement > 0
    ? `I went from ${s.baselineScore}% to ${s.trainedScore}% at spotting scams in 5 minutes. Can you beat me?`
    : `I scored ${s.score}% at spotting real scams. Can you beat me?`;

export default function ShareCard({ summary, shareUrl }) {
  const [status, setStatus] = useState('');

  const toBlob = () =>
    new Promise((resolve) => drawCard(summary).toBlob(resolve, 'image/png'));

  const flash = (msg) => {
    setStatus(msg);
    setTimeout(() => setStatus(''), 2200);
  };

  const handleShare = async () => {
    const blob = await toBlob();
    const file = new File([blob], 'spot-the-scam.png', { type: 'image/png' });
    const payload = { files: [file], text: `${SHARE_TEXT(summary)}\n${shareUrl}` };

    // Native share sheet where it exists (most phones), download elsewhere.
    if (navigator.canShare?.(payload)) {
      try {
        await navigator.share(payload);
        return;
      } catch {
        return; // user dismissed the sheet
      }
    }
    download(blob);
  };

  const download = (blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'spot-the-scam.png';
    a.click();
    URL.revokeObjectURL(url);
    flash('Image saved');
  };

  const handleDownload = async () => download(await toBlob());

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`${SHARE_TEXT(summary)}\n${shareUrl}`);
      flash('Link copied');
    } catch {
      flash('Copy failed');
    }
  };

  return (
    <section className="sc-wrap">
      <div className="sc-copy">
        <h3 className="sc-title">Share your result</h3>
        <p className="sc-sub">
          Every share puts this in front of someone who hasn&rsquo;t seen these
          scams yet — which is the whole point.
        </p>
      </div>
      <div className="sc-actions">
        <button className="sc-btn sc-btn-primary" onClick={handleShare}>
          Share result
        </button>
        <button className="sc-btn" onClick={handleDownload}>
          Save image
        </button>
        <button className="sc-btn" onClick={handleCopy}>
          Copy link
        </button>
        <span className={`sc-status ${status ? 'sc-status-on' : ''}`}>
          {status}
        </span>
      </div>
    </section>
  );
}
