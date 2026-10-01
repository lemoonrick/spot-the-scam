import { useRef, useState } from 'react';
import { roomLink } from '../lib/room';
import QrCode from './QrCode';

/**
 * Everything a facilitator needs to put a workshop on screen: a QR code
 * to scan, the code in letters big enough to read from the back of a
 * room, and the link to paste into a chat.
 */
export default function SharePanel({ room, onClose }) {
  const link = roomLink(room.code);
  const [copied, setCopied] = useState('');
  const qrRef = useRef(null);

  const copy = async (text, what) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(what);
    } catch {
      setCopied('');
      window.prompt('Copy this:', text);
    }
    setTimeout(() => setCopied(''), 2000);
  };

  return (
    <div className="ad-share" role="dialog" aria-label={`Share ${room.name}`}>
      <div className="ad-share-head">
        <div>
          <p className="ad-eyebrow">Share with the room</p>
          <h2 className="ad-share-title">{room.name}</h2>
        </div>
        {onClose && (
          <button className="ad-btn" onClick={onClose}>
            Done
          </button>
        )}
      </div>

      <div className="ad-share-body">
        <div className="ad-share-qr" ref={qrRef}>
          <QrCode value={link} size={240} title={`QR code to join ${room.name}`} />
          <button className="ad-btn" onClick={() => downloadQr(qrRef.current, room.code)}>
            Download QR for slides
          </button>
        </div>

        <div className="ad-share-info">
          <p className="ad-label">Or type the code</p>
          <p className="ad-share-code" aria-label={`Code ${room.code.split('').join(' ')}`}>
            {room.code}
          </p>
          <p className="ad-muted">
            At {window.location.host}
            {import.meta.env.BASE_URL}, under “Joining a workshop?”
          </p>

          <p className="ad-label ad-share-gap">Link</p>
          <div className="ad-share-link">
            <code>{link}</code>
            <button className="ad-btn ad-btn-primary" onClick={() => copy(link, 'link')}>
              {copied === 'link' ? 'Copied ✓' : 'Copy link'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Save the QR code as a PNG. Slide tools take PNGs everywhere; SVG
 * support is patchy (Google Slides refuses it). Drawn large, so it stays
 * sharp when stretched across a projector screen.
 */
function downloadQr(container, code) {
  const svg = container?.querySelector('svg');
  if (!svg) return;
  const size = 1200;
  const xml = new XMLSerializer().serializeToString(svg);
  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, 0, 0, size, size);
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `spot-the-scam-${code}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, 'image/png');
  };
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(xml)}`;
}
