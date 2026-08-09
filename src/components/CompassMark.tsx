type CompassMarkProps = {
  size?: number;
  className?: string;
};

export default function CompassMark({ size = 32, className = "" }: CompassMarkProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
    >
      <defs>
        <radialGradient id="compass-mark-glow" cx="50%" cy="36%" r="70%">
          <stop offset="0" stopColor="currentColor" stopOpacity="0.22" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="compass-mark-north" x1="24" y1="9" x2="24" y2="27" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F2F4FF" />
          <stop offset="1" stopColor="#8794FF" />
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="21" fill="url(#compass-mark-glow)" />
      <circle cx="24" cy="24" r="19" stroke="currentColor" strokeWidth="1.5" opacity="0.48" />
      <circle cx="24" cy="24" r="15.5" stroke="currentColor" strokeWidth="0.9" opacity="0.3" />
      <path
        d="M24 9.25 27.65 23.05 24 24.75 20.35 23.05 24 9.25Z"
        fill="url(#compass-mark-north)"
      />
      <path
        d="M24 38.75 20.35 24.95 24 23.25 27.65 24.95 24 38.75Z"
        fill="#F06464"
      />
      <circle cx="24" cy="24" r="3.15" fill="currentColor" />
      <circle cx="24" cy="24" r="1.35" fill="#08142E" />
    </svg>
  );
}