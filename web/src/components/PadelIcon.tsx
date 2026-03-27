interface PadelIconProps {
  className?: string;
}

export default function PadelIcon({ className = "w-5 h-5" }: PadelIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Racket head (oval) */}
      <ellipse cx="12" cy="9" rx="6.5" ry="7.5" />
      {/* Handle */}
      <line x1="12" y1="16.5" x2="12" y2="23" />
      {/* Grip lines */}
      <line x1="10.5" y1="19" x2="13.5" y2="19" />
      <line x1="10.5" y1="21" x2="13.5" y2="21" />
      {/* Holes in racket face */}
      <circle cx="10" cy="7" r="0.7" fill="currentColor" stroke="none" />
      <circle cx="14" cy="7" r="0.7" fill="currentColor" stroke="none" />
      <circle cx="12" cy="5" r="0.7" fill="currentColor" stroke="none" />
      <circle cx="12" cy="9" r="0.7" fill="currentColor" stroke="none" />
      <circle cx="10" cy="11" r="0.7" fill="currentColor" stroke="none" />
      <circle cx="14" cy="11" r="0.7" fill="currentColor" stroke="none" />
    </svg>
  );
}
