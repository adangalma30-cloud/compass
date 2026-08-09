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
      <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="2.2" opacity="0.42" />
      <circle cx="24" cy="24" r="15.5" stroke="currentColor" strokeWidth="1.2" opacity="0.34" />
      <path d="M29.9 15.6 26.2 25.9l-10.1 6.5 3.7-10.3 10.1-6.5Z" fill="currentColor" />
      <path d="m29.9 15.6-3.7 10.3-10.1 6.5 10.1-3.8 3.7-13Z" fill="#f15b5b" />
      <circle cx="24" cy="24" r="3" fill="currentColor" />
      <circle cx="24" cy="24" r="1.1" fill="#08142e" />
    </svg>
  );
}