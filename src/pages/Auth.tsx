import { SignIn, SignUp } from "@clerk/react";
import { Link, Navigate, useLocation } from "react-router-dom";
import Icon from "../components/Icon";
import { appPath, basePath } from "../lib/clerk";
import { useAuthState } from "../lib/authState";

type AuthProps = {
  mode: "signin" | "signup";
};

export default function Auth({ mode }: AuthProps) {
  const signInPath = appPath("/sign-in");
  const signUpPath = appPath("/sign-up");
  const homePath = basePath || "/";
  const { isLoaded, isSignedIn } = useAuthState();
  const location = useLocation();

  // Once the session is established, leave the auth screen immediately. This
  // is what makes a successful sign-in land on Home instead of sitting on the
  // form: Clerk updates the shared auth state, and this redirect reacts to it.
  if (isLoaded && isSignedIn) {
    const from = (location.state as { from?: string } | null)?.from;
    return <Navigate to={from && from !== "/sign-in" && from !== "/sign-up" ? from : "/"} replace />;
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
            <SignIn
              routing="path"
              path={signInPath}
              signUpUrl={signUpPath}
              // Send the user to Home as soon as the credentials are accepted.
              forceRedirectUrl={homePath}
              fallbackRedirectUrl={homePath}
            />
          ) : (
            <SignUp
              routing="path"
              path={signUpPath}
              signInUrl={signInPath}
              // A new account signs straight in, so it lands on Home too.
              forceRedirectUrl={homePath}
              fallbackRedirectUrl={homePath}
              // Keep the user in the app while they confirm their email.
              signInFallbackRedirectUrl={homePath}
            />
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
