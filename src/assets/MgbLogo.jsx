// Placeholder MGB mark — a blue-and-green leaf/sprout echoing Maharashtra Gramin Bank's
// identity. Swap for the official logo asset when available (keep the same size prop).
export default function MgbLogo({ size = 40, className = '' }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 48 48"
      role="img"
      aria-hidden="true"
      fill="none"
    >
      {/* left green leaf */}
      <path
        d="M23 33C12 30 6 22 6 12c11 2 17 10 17 21z"
        fill="var(--brand-green, #4ca62f)"
      />
      {/* right green leaf */}
      <path
        d="M25 33c11-3 17-11 17-21-11 2-17 10-17 21z"
        fill="var(--brand-green-dark, #3c8a24)"
      />
      {/* central blue petal */}
      <path
        d="M24 3c6 9 6 18 0 27-6-9-6-18 0-27z"
        fill="var(--brand-primary, #14539a)"
      />
      {/* blue drop / stem */}
      <path
        d="M24 30c4 6 4 11 0 15-4-4-4-9 0-15z"
        fill="var(--brand-primary-dark, #0e3d73)"
      />
    </svg>
  );
}
