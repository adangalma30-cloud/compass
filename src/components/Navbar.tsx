import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import Icon from "./Icon";

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
  const navigate = useNavigate();
  return (
    <motion.nav
      className="app-toolbar"
      initial={animate ? { y: -64, opacity: 0 } : false}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="toolbar-inner">
        <Link to="/" className="brand-lockup" aria-label="Compass home">
          <span className="brand-mark"><Icon name="compass" size={21} /></span>
          <span>Compass</span>
        </Link>
        <div className="toolbar-actions">
          <button
            type="button"
            onClick={onSavedClick}
            className="saved-button"
            aria-label={`Saved places${savedCount ? ` (${savedCount})` : ""}`}
          >
            <Icon name="bookmark" size={18} filled={savedCount > 0} />
            <span className="saved-label">{savedCount > 0 ? savedCount : "Saved"}</span>
          </button>
          <button
            type="button"
            onClick={() => navigate("/auth")}
            className="toolbar-cta"
          >
            Get Started
          </button>
        </div>
      </div>
    </motion.nav>
  );
}

export default Navbar;
