import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import Icon from "../components/Icon";
import SignInForm from "../components/SignInForm";
import SignUpForm from "../components/SignUpForm";
import { appPath } from "../lib/clerk";
import { useAuthState } from "../lib/authState";

type AuthProps = {
  mode: "signin" | "signup";
};

export default function Auth({ mode }: AuthProps) {
  const signInPath = appPath("/sign-in");
  const signUpPath = appPath("/sign-up");
  const { isLoaded, isSignedIn, isVerified } = useAuthState();
  const location = useLocation();
  const navigate = useNavigate();

  // Once a session exists, leave the auth screen. An unverified account is
  // routed to verification rather than into the app.
  if (isLoaded && isSignedIn) {
    if (!isVerified) return <Navigate to="/verify-email" replace />;
    const from = (location.state as { from?: string } | null)?.from;
    return <Navigate to={from && from !== "/sign-in" && from !== "/sign-up" ? from : "/"} replace />;
  }

  function handleComplete() {
    navigate("/", { replace: true });
  }

  return (
    <main className="auth-page">
      <div className="auth-glow auth-glow-one" />
      <div className="auth-glow auth-glow-two" />
      <div className="auth-wrap">
        <Link to="/" className="auth-brand" aria-label="Back to Compass home">
          <span className="brand-mark"><Icon name="compass" size={22} /></span>
          <span>Compass</span>
        </Link>
        <div className="auth-clerk-shell">
          {mode === "signin" ? (
            <SignInForm onComplete={handleComplete} signUpPath={signUpPath} />
          ) : (
            <SignUpForm onComplete={handleComplete} signInPath={signInPath} />
          )}
        </div>
        <Link to="/" className="auth-back"><Icon name="arrow-left" size={16} /> Back to exploring</Link>
      </div>
    </main>
  );
}

export function AuthRedirect() {
  return <Navigate to="/sign-in" replace />;
}
