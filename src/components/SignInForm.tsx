import { useState } from "react";
// See SignUpForm: the classic resource API is on the legacy hook.
import { useSignIn } from "@clerk/react/legacy";
import { Link } from "react-router-dom";
import { friendlyAuthError, validateCredentials, type FieldName } from "../lib/authErrors";

type SignInFormProps = {
  onComplete: () => void;
  signUpPath: string;
};

/**
 * Email + password sign-in.
 *
 * The session is activated only when Clerk reports `status === "complete"`.
 * Any other status means Clerk still requires a step, so the user stays here
 * instead of being let into the app.
 */
export default function SignInForm({ onComplete, signUpPath }: SignInFormProps) {
  const { isLoaded, signIn, setActive } = useSignIn();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [errorField, setErrorField] = useState<FieldName>("form");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!isLoaded || submitting) return;

    const invalid = validateCredentials(email, password);
    if (invalid) {
      setError(invalid.message);
      setErrorField(invalid.field);
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const attempt = await signIn.create({ identifier: email.trim(), password });

      if (attempt.status !== "complete") {
        // e.g. MFA or another factor is outstanding. Do not mark as signed in.
        setError("We need another step to sign you in. Please try again or reset your password.");
        setErrorField("form");
        return;
      }

      await setActive({ session: attempt.createdSessionId });
      onComplete();
    } catch (caught) {
      const result = friendlyAuthError(caught, "We couldn't sign you in. Please try again.");
      setError(result.message);
      setErrorField(result.field);
    } finally {
      setSubmitting(false);
    }
  }

  if (!isLoaded) {
    return <div className="auth-skeleton" aria-hidden="true" />;
  }

  return (
    <div className="auth-card">
      <h1 className="auth-card-title">Welcome back</h1>
      <p className="auth-card-subtitle">Sign in to keep exploring Compass.</p>

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <label className="auth-field">
          <span>Email</span>
          <input
            type="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setError("");
            }}
            autoComplete="email"
            inputMode="email"
            className={errorField === "identifier" && error ? "auth-input-error" : ""}
            disabled={submitting}
            required
          />
        </label>

        <label className="auth-field">
          <span>Password</span>
          <input
            type="password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setError("");
            }}
            autoComplete="current-password"
            className={errorField === "password" && error ? "auth-input-error" : ""}
            disabled={submitting}
            required
          />
        </label>

        {error && <p className="form-message error" role="alert">{error}</p>}

        <div id="clerk-captcha" />

        <button type="submit" className="auth-submit" disabled={submitting}>
          {submitting ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="auth-switch">
        New to Compass? <Link to={signUpPath}>Create an account</Link>
      </p>
    </div>
  );
}
