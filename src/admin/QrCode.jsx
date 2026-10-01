import { useMemo } from 'react';
import { encode } from 'uqr';

/**
 * A QR code for a room's link, drawn as plain SVG squares.
 *
 * The library only works out which squares are dark; the drawing is
 * done here, so no generated markup is ever injected into the page.
 * It only loads on the admin page, so players never download it.
 *
 * High error correction, so a code photographed off a projector at an
 * angle, or partly covered by a pointer, still scans.
 */
export default function QrCode({ value, size = 220, title }) {
  const { cells, n } = useMemo(() => {
    const qr = encode(value, { ecc: 'H', border: 2 });
    const dark = [];
    qr.data.forEach((row, y) =>
      row.forEach((on, x) => {
        if (on) dark.push(`M${x} ${y}h1v1h-1z`);
      }),
    );
    return { cells: dark.join(''), n: qr.size };
  }, [value]);

  return (
    <svg
      className="qr"
      width={size}
      height={size}
      viewBox={`0 0 ${n} ${n}`}
      shapeRendering="crispEdges"
      role="img"
      aria-label={title ?? `QR code for ${value}`}
    >
      <rect width={n} height={n} fill="#fff" />
      <path d={cells} fill="#0f172a" />
    </svg>
  );
}
