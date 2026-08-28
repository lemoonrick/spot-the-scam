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
