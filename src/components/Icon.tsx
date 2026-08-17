type IconName =
  | "arrow-left"
  | "arrow-right"
  | "bookmark"
  | "check"
  | "chevron-down"
  | "compass"
  | "heart"
  | "mail"
  | "map-pin"
  | "menu"
  | "phone"
  | "search"
  | "share"
  | "spark"
  | "star"
  | "store"
  | "user"
  | "utensils"
  | "coffee"
  | "glass"
  | "bag"
  | "x";

type IconProps = {
  name: IconName;
  size?: number;
  strokeWidth?: number;
  className?: string;
  filled?: boolean;
};

export default function Icon({
  name,
  size = 20,
  strokeWidth = 1.8,
  className = "",
  filled = false,
}: IconProps) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: filled ? "currentColor" : "none",
    stroke: "currentColor",
    strokeWidth,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
    "aria-hidden": true,
  };

  switch (name) {
    case "compass":
      return <svg {...common}><circle cx="12" cy="12" r="8.5" /><path d="m15.8 8.2-2.1 5.5-5.5 2.1 2.1-5.5 5.5-2.1Z" /><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" /></svg>;
    case "arrow-left":
      return <svg {...common}><path d="m15 18-6-6 6-6" /></svg>;
    case "arrow-right":
      return <svg {...common}><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
    case "bookmark":
      return <svg {...common}><path d="M6.5 4.5A1.5 1.5 0 0 1 8 3h8a1.5 1.5 0 0 1 1.5 1.5V21L12 17.5 6.5 21V4.5Z" /></svg>;
    case "check":
      return <svg {...common}><path d="m5 12 4 4L19 6" /></svg>;
    case "chevron-down":
      return <svg {...common}><path d="m6 9 6 6 6-6" /></svg>;
    case "heart":
      return <svg {...common} fill={filled ? "currentColor" : "none"}><path d="M20.8 8.8c0 5.3-8.8 10-8.8 10s-8.8-4.7-8.8-10A4.7 4.7 0 0 1 12 6.2a4.7 4.7 0 0 1 8.8 2.6Z" /></svg>;
    case "mail":
      return <svg {...common}><rect x="3" y="5" width="18" height="14" rx="2.5" /><path d="m3.5 7.5 7.4 5.2a2 2 0 0 0 2.2 0l7.4-5.2" /></svg>;
    case "map-pin":
      return <svg {...common}><path d="M20 10.5c0 5-8 10-8 10s-8-5-8-10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10.5" r="2.4" /></svg>;
    case "menu":
      return <svg {...common}><path d="M4 7h16M4 12h16M4 17h16" /></svg>;
    case "phone":
      return <svg {...common}><path d="M7 4.5 9.4 4l1.4 3.5-1.7 1.5a13.7 13.7 0 0 0 6 6l1.5-1.7 3.4 1.4-.5 2.4a2 2 0 0 1-2.3 1.5C10.8 17.7 6.3 13.2 5.4 6.8A2 2 0 0 1 7 4.5Z" /></svg>;
    case "search":
      return <svg {...common}><circle cx="10.8" cy="10.8" r="6.3" /><path d="m16 16 4.2 4.2" /></svg>;
    case "share":
      return <svg {...common}><circle cx="18" cy="5" r="2.2" /><circle cx="6" cy="12" r="2.2" /><circle cx="18" cy="19" r="2.2" /><path d="m8 11 7.8-4.6M8 13l7.8 4.6" /></svg>;
    case "spark":
      return <svg {...common}><path d="m12 3 1.3 5.7L19 10l-5.7 1.3L12 17l-1.3-5.7L5 10l5.7-1.3L12 3ZM19 16l.6 2.4L22 19l-2.4.6L19 22l-.6-2.4L16 19l2.4-.6L19 16Z" /></svg>;
    case "star":
      return <svg {...common} fill={filled ? "currentColor" : "none"}><path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-2.9-5.6 2.9 1.1-6.2L3 9.6l6.2-.9L12 3Z" /></svg>;
    case "store":
      return <svg {...common}><path d="M4 10v9h16v-9M3 10l2-6h14l2 6M3 10a3 3 0 0 0 5 0 3 3 0 0 0 5 0 3 3 0 0 0 5 0 3 3 0 0 0 3 0" /><path d="M9 19v-5h6v5" /></svg>;
    case "user":
      return <svg {...common}><circle cx="12" cy="8" r="3.5" /><path d="M5 20a7 7 0 0 1 14 0" /></svg>;
    case "utensils":
      return <svg {...common}><path d="M7 3v7M4.5 3v4a2.5 2.5 0 0 0 5 0V3M7 10v11M16 3v18M16 3c2 2 2 5 0 7" /></svg>;
    case "coffee":
      return <svg {...common}><path d="M5 8h11v6a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V8ZM16 10h2a3 3 0 0 1 0 6h-2M3 21h15M8 5c-1-1 1-2 0-3M12 5c-1-1 1-2 0-3" /></svg>;
    case "glass":
      return <svg {...common}><path d="m5 3 7 9 7-9M12 12v9M8 21h8M4 3h16" /></svg>;
    case "bag":
      return <svg {...common}><path d="M5 8h14l-1 12H6L5 8ZM8 8a4 4 0 0 1 8 0M9 12h6" /></svg>;
    case "x":
      return <svg {...common}><path d="m6 6 12 12M18 6 6 18" /></svg>;
  }
}