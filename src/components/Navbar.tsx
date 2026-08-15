import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import Icon from "./Icon";
import { useAuthState } from "../lib/authState";

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
  // One shared auth state drives the toolbar, so "Get Started" swaps to the
  // profile button the moment the session is established - no reload needed.
  const { isLoaded, isSignedIn, user } = useAuthState();
  const displayName = user?.name || "Profile";
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
            onClick={() => (isSignedIn ? onSavedClick?.() : navigate("/sign-in"))}
            className="saved-button"
            aria-label={`Saved places${savedCount ? ` (${savedCount})` : ""}`}
          >
            <Icon name="bookmark" size={18} filled={savedCount > 0} />
            <span className="saved-label">{savedCount > 0 ? savedCount : "Saved"}</span>
          </button>
          {!isLoaded ? (
            /* Placeholder while the stored session is restored, so an already
               signed-in user never sees "Get Started" flash on launch. */
            <span className="toolbar-auth-placeholder" aria-hidden="true" />
          ) : isSignedIn ? (
            <button
              type="button"
              onClick={() => navigate("/profile")}
              className="profile-button"
              aria-label={`Open ${displayName}'s profile`}
            >
              {user?.imageUrl ? (
                <img src={user.imageUrl} alt="" className="profile-avatar" referrerPolicy="no-referrer" />
              ) : (
                <span className="profile-avatar profile-avatar-fallback">{displayName.slice(0, 1).toUpperCase()}</span>
              )}
              <span className="profile-label">{displayName}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => navigate("/sign-up")}
              className="toolbar-cta"
            >
              Get Started
            </button>
          )}
        </div>
      </div>
    </motion.nav>
  );
}

export default Navbar;
