import { motion } from "framer-motion";
import { Link } from "react-router-dom";

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
      className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100"
      initial={animate ? { y: -64, opacity: 0 } : false}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2" aria-label="Compass home">
          <span className="text-xl">🧭</span>
          <span className="text-lg font-bold text-gray-900 tracking-tight">
            Compass
          </span>
        </Link>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-500">
          <a href="/#discover" className="hover:text-gray-900 transition-colors">
            Explore
          </a>
          <a
            href="mailto:hello@compass.local?subject=Compass business listing"
            className="hover:text-gray-900 transition-colors"
          >
            For Business
          </a>
          <a href="/#about" className="hover:text-gray-900 transition-colors">
            About
          </a>
        </div>

        {/* CTA */}
        <div className="flex items-center gap-3">
          <button
            onClick={onSavedClick}
            className="hidden sm:block text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            Saved{savedCount > 0 ? ` (${savedCount})` : ""}
          </button>
          <a
            href="/#discover"
            className="text-sm font-semibold bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 active:scale-95 transition-all"
          >
            Get started
          </a>
        </div>
      </div>
    </motion.nav>
  );
}

export default Navbar;
