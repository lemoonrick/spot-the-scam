import { useCallback, useEffect, useState } from 'react';

// Portrait card sized for Instagram / WhatsApp status.
const W = 1080;
const H = 1350;
const FONT = "'Poppins', system-ui, sans-serif";

const INK = '#0f172a';
const MUTED = '#64748b';
const FAINT = '#94a3b8';
const LINE = '#e2e8f0';
const WASH = '#f8fafc';
const GREEN = '#16a34a';
const GREEN_WASH = '#f0fdf4';
const GREEN_LINE = '#bbf7d0';
const BLUE = '#2563eb';

function text(ctx, str, x, y, o = {}) {
  const { size = 40, weight = 600, color = INK, align = 'left', spacing = 0 } = o;
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  if ('letterSpacing' in ctx) ctx.letterSpacing = `${spacing}px`;
  ctx.fillText(str, x, y);
  if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
}

/** Word wrap; returns the y position just past the last line drawn. */
function wrap(ctx, str, x, y, maxW, lineH, o) {
  ctx.font = `${o.weight ?? 600} ${o.size}px ${FONT}`;
  let line = '';
  let cy = y;
  str.split(' ').forEach((w) => {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxW && line) {
      text(ctx, line, x, cy, o);
      line = w;
      cy += lineH;
    } else {
      line = test;
    }
  });
  if (line) text(ctx, line, x, cy, o);
  return cy;
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

function panel(ctx, x, y, w, h, { fill = WASH, stroke = LINE } = {}) {
  roundRect(ctx, x, y, w, h, 28);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 2;
  ctx.stroke();
}

function pill(ctx, label, x, y, { bg, fg, size = 40 }) {
  ctx.font = `700 ${size}px ${FONT}`;
  const w = ctx.measureText(label).width + 76;
  const h = 84;
  roundRect(ctx, x, y, w, h, h / 2);
  ctx.fillStyle = bg;
  ctx.fill();
  text(ctx, label, x + w / 2, y + h / 2 + size * 0.35, {
    size, weight: 700, color: fg, align: 'center',
  });
  return y + h;
}

/** Rightward arrow drawn as a stroked path — reads far better than a glyph. */
function arrow(ctx, cx, cy, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 8;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - 24, cy);
  ctx.lineTo(cx + 22, cy);
  ctx.moveTo(cx + 6, cy - 18);
  ctx.lineTo(cx + 23, cy);
  ctx.lineTo(cx + 6, cy + 18);
  ctx.stroke();
}

export function drawCard(summary) {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  // A decline is real and the app reports it honestly on screen — but it
  // makes a discouraging, misleading thing to broadcast. So the card leads
  // with the before/after only when there IS a gain; otherwise it shows
  // the plain score and turns it into a challenge. Never an invented number.
  const improved = summary.improvement > 0;
  const accent = improved ? GREEN : BLUE;
  const PAD = 88;
  const INNER = W - PAD * 2;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);
  const tint = ctx.createLinearGradient(0, 0, 0, 460);
  tint.addColorStop(0, improved ? GREEN_WASH : '#eff6ff');
  tint.addColorStop(1, '#ffffff');
  ctx.fillStyle = tint;
  ctx.fillRect(0, 0, W, 460);

  // ── Wordmark ──
  text(ctx, 'SPOT THE SCAM', PAD, 132, { size: 30, weight: 700, spacing: 4 });
  roundRect(ctx, PAD, 158, 84, 7, 4);
  ctx.fillStyle = accent;
  ctx.fill();

  // ── Headline ──
  let y = wrap(
    ctx,
    improved
      ? 'In 5 minutes, I got better at spotting scams.'
      : 'I tested how well I spot real scams.',
    PAD, 288, INNER, 84,
    { size: 64, weight: 700, color: INK },
  );

  y += 100;

  if (improved) {
    // ── Before → after ──
    const boxW = (INNER - 64) / 2;
    const boxH = 300;

    const scoreBox = (x, value, label, caption, opts) => {
      panel(ctx, x, y, boxW, boxH, opts.panel);
      text(ctx, `${value}%`, x + boxW / 2, y + 146, {
        size: 106, weight: 700, color: opts.color, align: 'center',
      });
      text(ctx, label, x + boxW / 2, y + 202, {
        size: 32, weight: 600, color: INK, align: 'center',
      });
      text(ctx, caption, x + boxW / 2, y + 246, {
        size: 26, weight: 500, color: FAINT, align: 'center',
      });
    };

    scoreBox(PAD, summary.baselineScore, 'First half', 'before learning', {
      color: MUTED, panel: {},
    });
    scoreBox(PAD + boxW + 64, summary.trainedScore, 'Second half', 'after learning', {
      color: GREEN, panel: { fill: GREEN_WASH, stroke: GREEN_LINE },
    });

    arrow(ctx, W / 2, y + boxH / 2, '#94a3b8');
    y += boxH + 70;

    y = pill(ctx, `+${summary.improvement} points`, PAD, y, {
      bg: GREEN_WASH, fg: GREEN,
    });
  } else {
    // ── Plain score + challenge ──
    const boxH = 300;
    panel(ctx, PAD, y, INNER, boxH);
    text(ctx, `${summary.score}%`, W / 2, y + 152, {
      size: 128, weight: 700, color: INK, align: 'center',
    });
    text(
      ctx,
      `${summary.correct} of ${summary.total} caught correctly`,
      W / 2, y + 218,
      { size: 32, weight: 600, color: MUTED, align: 'center' },
    );
    y += boxH + 70;

    y = pill(ctx, 'Can you beat me?', PAD, y, { bg: '#eff6ff', fg: BLUE });
  }

  // ── Closing line ──
  wrap(
    ctx,
    'Most people learn about scams after they fall for one. Try it before that happens.',
    PAD, y + 112, INNER, 58,
    { size: 38, weight: 500, color: MUTED },
  );

  // ── Footer ──
  ctx.fillStyle = LINE;
  ctx.fillRect(PAD, H - 170, INNER, 2);
  text(ctx, 'myfactree.org', PAD, H - 92, { size: 36, weight: 700, color: INK });
  text(ctx, 'Free · No sign-up · 5 minutes', W - PAD, H - 92, {
    size: 30, weight: 500, color: FAINT, align: 'right',
  });

  return canvas;
}

const shareText = (s) =>
  s.improvement > 0
    ? `I went from ${s.baselineScore}% to ${s.trainedScore}% at spotting scams in 5 minutes. Can you beat me?`
    : `I scored ${s.score}% at spotting real scams. Can you beat me?`;

export default function ShareCard({ summary, shareUrl }) {
  const [preview, setPreview] = useState(null);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  const message = `${shareText(summary)}\n${shareUrl}`;

  // Render the real card once fonts are ready, so the preview the user sees
  // is byte-identical to what they share — no blind "Share" button.
  useEffect(() => {
    let alive = true;
    const render = () => {
      if (!alive) return;
      setPreview(drawCard(summary).toDataURL('image/png'));
    };
    if (document.fonts?.ready) document.fonts.ready.then(render);
    else render();
    return () => {
      alive = false;
    };
  }, [summary]);

  const flash = (msg) => {
    setStatus(msg);
    setTimeout(() => setStatus(''), 2600);
  };

  const toBlob = useCallback(
    () => new Promise((resolve) => drawCard(summary).toBlob(resolve, 'image/png')),
    [summary],
  );

  const saveImage = async (blob) => {
    const url = URL.createObjectURL(blob || (await toBlob()));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'spot-the-scam-result.png';
    a.click();
    URL.revokeObjectURL(url);
    flash('Image saved to your downloads');
  };

  const handleShare = async () => {
    setBusy(true);
    try {
      const blob = await toBlob();
      const file = new File([blob], 'spot-the-scam-result.png', {
        type: 'image/png',
      });
      const payload = { files: [file], text: message };

      if (navigator.canShare?.(payload)) {
        try {
          await navigator.share(payload);
        } catch (err) {
          // AbortError just means they closed the sheet — not a failure.
          if (err?.name !== 'AbortError') await saveImage(blob);
        }
      } else {
        // Desktop browsers mostly can't share files: save it instead and
        // say so, rather than appearing to do nothing.
        await saveImage(blob);
      }
    } finally {
      setBusy(false);
    }
  };

  const handleWhatsApp = () => {
    window.open(
      `https://wa.me/?text=${encodeURIComponent(message)}`,
      '_blank',
      'noopener,noreferrer',
    );
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      flash('Message and link copied');
    } catch {
      flash("Couldn't copy — try Save image instead");
    }
  };

  return (
    <section className="sc-wrap">
      <div className="sc-preview">
        {preview ? (
          <img src={preview} alt="Preview of your shareable result card" />
        ) : (
          <div className="sc-preview-skeleton" />
        )}
      </div>

      <div className="sc-body">
        <p className="sc-eyebrow">Share</p>
        <h3 className="sc-title">Pass it on</h3>
        <p className="sc-sub">
          Every share puts these scams in front of someone who hasn&rsquo;t
          seen them yet &mdash; which is the whole point.
        </p>

        <div className="sc-actions">
          <button
            className="sc-btn sc-btn-primary"
            onClick={handleShare}
            disabled={busy}
          >
            <Icon name="share" />
            {busy ? 'Preparing…' : 'Share result'}
          </button>
          <button className="sc-btn sc-btn-whatsapp" onClick={handleWhatsApp}>
            <Icon name="whatsapp" />
            WhatsApp
          </button>
          <button className="sc-btn" onClick={() => saveImage()}>
            <Icon name="download" />
            Save image
          </button>
          <button className="sc-btn" onClick={handleCopy}>
            <Icon name="link" />
            Copy link
          </button>
        </div>

        <p className={`sc-status ${status ? 'sc-status-on' : ''}`} role="status">
          {status || ' '}
        </p>
      </div>
    </section>
  );
}

function Icon({ name }) {
  const common = {
    width: 17, height: 17, viewBox: '0 0 24 24', fill: 'none',
    stroke: 'currentColor', strokeWidth: 2,
    strokeLinecap: 'round', strokeLinejoin: 'round',
    'aria-hidden': true,
  };
  if (name === 'share')
    return (
      <svg {...common}>
        <path d="M12 16V3M8 7l4-4 4 4M4 15v4a2 2 0 002 2h12a2 2 0 002-2v-4" />
      </svg>
    );
  if (name === 'download')
    return (
      <svg {...common}>
        <path d="M12 3v13M8 12l4 4 4-4M4 21h16" />
      </svg>
    );
  if (name === 'link')
    return (
      <svg {...common}>
        <path d="M10 13a5 5 0 007.5.5l3-3a5 5 0 00-7-7l-1.5 1.5" />
        <path d="M14 11a5 5 0 00-7.5-.5l-3 3a5 5 0 007 7l1.5-1.5" />
      </svg>
    );
  return (
    <svg {...common} fill="currentColor" stroke="none">
      <path d="M12.04 2A9.9 9.9 0 002.1 11.9a9.8 9.8 0 001.34 4.95L2 22l5.3-1.38a9.9 9.9 0 004.74 1.2h.01a9.9 9.9 0 009.94-9.9A9.9 9.9 0 0012.04 2zm5.8 14.05c-.24.68-1.4 1.3-1.94 1.35-.5.05-.97.23-3.27-.68-2.75-1.08-4.5-3.87-4.63-4.05-.14-.18-1.11-1.48-1.11-2.82 0-1.34.7-2 .95-2.27.25-.27.54-.34.72-.34l.52.01c.17 0 .39-.06.6.46l.83 2c.07.14.11.3.02.48l-.3.5c-.1.13-.2.28-.09.47.11.2.5.83 1.08 1.34.74.66 1.37.87 1.56.97.2.1.31.08.43-.05l.61-.72c.16-.18.29-.14.48-.07l1.9.9c.2.1.32.14.37.22.05.09.05.5-.19 1.18z" />
    </svg>
  );
}
