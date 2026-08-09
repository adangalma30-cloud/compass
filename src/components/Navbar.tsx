import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import CompassMark from "./CompassMark";

type NavbarProps = {
  /** When true the navbar slides down into view. Default true. */
  animate?: boolean;
  savedCount?: number;
  onSavedClick?: () => void;
};

function Navbar({
  animate = true,
  savedCount = 0,
  onSavedClick,
}: NavbarProps) {
  return (
    <motion.nav
      className="sticky top-0 z-50 border-b border-[#e4e8f2]/80 bg-white/85 backdrop-blur-md"
      initial={animate ? { y: -64, opacity: 0 } : false}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="mx-auto flex h-[4.5rem] max-w-6xl items-center justify-between px-5 sm:px-6">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5" aria-label="Compass home">
          <CompassMark size={31} className="text-[#5667d6]" />
          <span className="text-lg font-bold tracking-tight text-[#111b3a]">
            Compass
          </span>
        </Link>

        {/* Nav links */}
        <div className="hidden items-center gap-8 text-sm font-semibold text-[#77829f] md:flex">
          <a href="/#discover" className="transition-colors hover:text-[#1c2a51]">
            Explore
          </a>
          <a
            href="mailto:hello@compass.local?subject=Compass business listing"
            className="transition-colors hover:text-[#1c2a51]"
          >
            For Business
          </a>
          <a href="/#about" className="transition-colors hover:text-[#1c2a51]">
            About
          </a>
        </div>

        {/* CTA */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onSavedClick}
            className="hidden text-sm font-semibold text-[#65718e] transition-colors hover:text-[#1c2a51] sm:block"
          >
            Saved{savedCount > 0 ? ` (${savedCount})` : ""}
          </button>
          <a
            href="/#discover"
            className="rounded-xl bg-[#5365d1] px-3.5 py-2.5 text-sm font-semibold text-white shadow-[0_6px_16px_rgba(83,101,209,0.22)] transition-all hover:bg-[#6173e4] active:scale-95 sm:px-4"
          >
            Get started
          </a>
        </div>
      </div>
    </motion.nav>
  );
}

export default Navbar;
