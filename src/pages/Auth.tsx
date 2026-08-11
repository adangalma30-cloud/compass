import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import Icon from "../components/Icon";

type Mode = "signin" | "signup";

export default function Auth() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [forgotSent, setForgotSent] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setForgotSent(false);
    if (mode === "signup" && name.trim().length < 2) {
      setError("Please enter your name so we know what to call you.");
      return;
    }
    if (!email.includes("@") || !email.includes(".")) {
      setError("Enter a valid email address to continue.");
      return;
    }
    if (password.length < 6) {
      setError("Your password needs at least 6 characters.");
      return;
    }
    try {
      localStorage.setItem("compass-auth", JSON.stringify({ email, name }));
    } catch {
      // Navigation still works when storage is unavailable in a WebView.
    }
    setSubmitted(true);
    window.setTimeout(() => navigate("/"), 700);
  }

  function handleForgotPassword() {
    setError("");
    if (!email.includes("@")) {
      setError("Enter your email above and we’ll send a reset link.");
      return;
    }
    setForgotSent(true);
  }

  function changeMode(nextMode: Mode) {
    setMode(nextMode);
    setError("");
    setForgotSent(false);
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
        <section className="auth-card" aria-labelledby="auth-title">
          <div className="auth-heading">
            <span className="eyebrow"><Icon name="spark" size={14} /> Your next place starts here</span>
            <h1 id="auth-title">{mode === "signin" ? "Welcome back." : "Create your Compass."}</h1>
            <p>{mode === "signin" ? "Save the places worth coming back to." : "Build a shortlist of places you’ll love."}</p>
          </div>
          <div className="auth-toggle" role="tablist" aria-label="Authentication mode">
            <button type="button" role="tab" aria-selected={mode === "signin"} className={mode === "signin" ? "active" : ""} onClick={() => changeMode("signin")}>Sign in</button>
            <button type="button" role="tab" aria-selected={mode === "signup"} className={mode === "signup" ? "active" : ""} onClick={() => changeMode("signup")}>Create account</button>
          </div>
          <form onSubmit={handleSubmit} className="auth-form" noValidate>
            {mode === "signup" && (
              <label className="field">
                <span>Your name</span>
                <div className="field-input"><Icon name="user" size={18} /><input value={name} onChange={(event) => setName(event.target.value)} placeholder="Alex Morgan" autoComplete="name" /></div>
              </label>
            )}
            <label className="field">
              <span>Email address</span>
              <div className="field-input"><Icon name="user" size={18} /><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" autoComplete="email" /></div>
            </label>
            <label className="field">
              <span>Password</span>
              <div className="field-input"><Icon name="bookmark" size={18} /><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 6 characters" autoComplete={mode === "signin" ? "current-password" : "new-password"} /></div>
            </label>
            {mode === "signin" && (
              <button type="button" className="forgot-link" onClick={handleForgotPassword}>Forgot password?</button>
            )}
            {error && <p className="form-message error" role="alert">{error}</p>}
            {forgotSent && <p className="form-message success" role="status">A reset link is on its way. Check your inbox.</p>}
            {submitted ? (
              <div className="auth-success"><Icon name="check" size={19} /> {mode === "signin" ? "Signed in — opening Compass" : "Account created — opening Compass"}</div>
            ) : (
              <button type="submit" className="primary-action">{mode === "signin" ? "Sign in" : "Create account"} <Icon name="arrow-right" size={18} /></button>
            )}
          </form>
          <p className="auth-note">By continuing, you agree to discover thoughtfully.</p>
        </section>
        <Link to="/" className="auth-back"><Icon name="arrow-left" size={16} /> Back to exploring</Link>
      </div>
    </main>
  );
}