import { SignIn, SignUp } from "@clerk/react";
import { Link, Navigate } from "react-router-dom";
import Icon from "../components/Icon";
import { basePath } from "../lib/clerk";

type AuthProps = {
  mode: "signin" | "signup";
};

export default function Auth({ mode }: AuthProps) {
  const signInPath = `${basePath}/sign-in`;
  const signUpPath = `${basePath}/sign-up`;

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
            <SignIn routing="path" path={signInPath} signUpUrl={signUpPath} />
          ) : (
            <SignUp routing="path" path={signUpPath} signInUrl={signInPath} />
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