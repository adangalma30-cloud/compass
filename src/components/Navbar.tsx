import { motion } from "framer-motion";

type NavbarProps = {
  /** When true the navbar slides down into view. Default true. */
  animate?: boolean;
};

function Navbar({ animate = true }: NavbarProps) {
  return (
    <motion.nav
      className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100"
      initial={animate ? { y: -64, opacity: 0 } : false}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <span className="text-xl">🧭</span>
          <span className="text-lg font-bold text-gray-900 tracking-tight">
            Compass
          </span>
        </div>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-500">
          <a href="#" className="hover:text-gray-900 transition-colors">
            Explore
          </a>
          <a href="#" className="hover:text-gray-900 transition-colors">
            For Business
          </a>
          <a href="#" className="hover:text-gray-900 transition-colors">
            About
          </a>
        </div>

        {/* CTA */}
        <div className="flex items-center gap-3">
          <button className="hidden sm:block text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
            Sign in
          </button>
          <button className="text-sm font-semibold bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 active:scale-95 transition-all">
            Get started
          </button>
        </div>
      </div>
    </motion.nav>
  );
}

export default Navbar;
