import { useState } from "react";
// The classic sign-up resource API (create / prepare / attempt / setActive)
// lives on the legacy hook in @clerk/react 6.x. The default export is a
// newer signal-based API that does not expose these methods.
import { useSignUp } from "@clerk/react/legacy";
import { Link } from "react-router-dom";
import VerifyEmail from "./VerifyEmail";
import { friendlyAuthError, validateCredentials, type FieldName } from "../lib/authErrors";
import { usePasswordPolicy } from "../lib/passwordPolicy";

type SignUpFormProps = {
  /** Called once the session is active and the email is verified. */
  onComplete: () => void;
  signInPath: string;
};

/**
 * Email + password sign-up with a real Clerk email_code verification step.
 *
 * The flow is:
 *   signUp.create()                       -> creates the attempt
 *   prepareEmailAddressVerification()     -> Clerk emails a 6-digit code
 *   attemptEmailAddressVerification()     -> Clerk validates the code
 *   setActive()                           -> session becomes active
 *
 * The session is only activated after Clerk reports `status === "complete"`,
 * so an unverified account can never reach the authenticated app.
 */
export default function SignUpForm({ onComplete, signInPath }: SignUpFormProps) {
  const { isLoaded, signUp, setActive } = useSignUp();
  // Requirements come from the Clerk instance so the form can never disagree
  // with what the server will accept.
  const passwordPolicy = usePasswordPolicy();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);
  // Real deadline for the emailed code, reported by Clerk.
  const [codeExpiresAt, setCodeExpiresAt] = useState<Date | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [errorField, setErrorField] = useState<FieldName>("form");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!isLoaded || submitting) return;

    const invalid = validateCredentials(email, password, passwordPolicy.minLength);
    if (invalid) {
      setError(invalid.message);
      setErrorField(invalid.field);
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      await signUp.create({
        emailAddress: email.trim(),
        password,
        ...(firstName.trim() ? { firstName: firstName.trim() } : {}),
      });

      // Ask Clerk to email the one-time code.
      const prepared = await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setCodeExpiresAt(prepared.verifications?.emailAddress?.expireAt ?? undefined);
      setPendingVerification(true);
    } catch (caught) {
      const result = friendlyAuthError(caught, "We couldn't create your account. Please try again.");
      setError(result.message);
      setErrorField(result.field);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerify(code: string) {
    if (!isLoaded) throw new Error("not-ready");
    const attempt = await signUp.attemptEmailAddressVerification({ code });

    // Only a complete sign-up may activate a session. Anything else means
    // Clerk still wants something, so the user must not enter the app.
    if (attempt.status !== "complete") {
      throw new Error("incomplete");
    }
    await setActive({ session: attempt.createdSessionId });
    onComplete();
  }

  async function handleResend() {
    if (!isLoaded) throw new Error("not-ready");
    const prepared = await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
    const next = prepared.verifications?.emailAddress?.expireAt ?? undefined;
    setCodeExpiresAt(next);
    return next;
  }

  function handleCancel() {
    setPendingVerification(false);
    setError("");
    setPassword("");
  }

  if (!isLoaded) {
    return <div className="auth-skeleton" aria-hidden="true" />;
  }

  if (pendingVerification) {
    return (
      <VerifyEmail
        email={email.trim()}
        onVerify={handleVerify}
        onResend={handleResend}
        onCancel={handleCancel}
        expiresAt={codeExpiresAt}
      />
    );
  }

  return (
    <div className="auth-card">
      <h1 className="auth-card-title">Create your Compass</h1>
      <p className="auth-card-subtitle">Save the places worth coming back to.</p>

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <label className="auth-field">
          <span>First name <em>(optional)</em></span>
          <input
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            autoComplete="given-name"
            disabled={submitting}
          />
        </label>

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
            autoComplete="new-password"
            className={errorField === "password" && error ? "auth-input-error" : ""}
            disabled={submitting}
            required
          />
          {passwordPolicy.hint && <small className="auth-hint">{passwordPolicy.hint}</small>}
        </label>

        {error && <p className="form-message error" role="alert">{error}</p>}

        {/* Clerk's bot protection renders into this element when enabled. */}
        <div id="clerk-captcha" />

        <button type="submit" className="auth-submit" disabled={submitting}>
          {submitting ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="auth-switch">
        Already have an account? <Link to={signInPath}>Sign in</Link>
      </p>
    </div>
  );
}
