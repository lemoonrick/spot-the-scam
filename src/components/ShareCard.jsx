import { useCallback, useEffect, useState } from 'react';
import { drawCard } from './drawShareCard';

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
