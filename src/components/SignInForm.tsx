import { useState } from "react";
// See SignUpForm: the classic resource API is on the legacy hook.
import { useSignIn } from "@clerk/react/legacy";
import { Link } from "react-router-dom";
import PasswordField from "./PasswordField";
import VerifyEmail from "./VerifyEmail";
import { friendlyAuthError, type FieldName } from "../lib/authErrors";

type SignInFormProps = {
  onComplete: () => void;
  signUpPath: string;
};

/**
 * Email + password sign-in.
 *
 * Clerk's sign-in is a state machine, not a single call. `signIn.create()` can
 * return any of several statuses and only "complete" means the user is in.
 * Previously every other status produced one generic "we need another step"
 * message with no way forward, which stranded returning users whose account
 * needed an email code.
 *
 * Each outstanding status is now handled: an email code is prepared and
 * collected, a second factor is collected, and anything that genuinely cannot
 * be completed here explains itself and points at the right recovery.
 */
export default function SignInForm({ onComplete, signUpPath }: SignInFormProps) {
  const { isLoaded, signIn, setActive } = useSignIn();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [errorField, setErrorField] = useState<FieldName>("form");
  /** Outstanding verification step, if Clerk asked for one. */
  const [pendingFactor, setPendingFactor] = useState<"first" | "second" | null>(null);
  const [codeExpiresAt, setCodeExpiresAt] = useState<Date | undefined>();

  /**
   * Advances the sign-in after any step. Returns true when the session is
   * active, so callers know whether more work is outstanding.
   */
  async function applyResult(
    resource: NonNullable<typeof signIn>,
    activate: NonNullable<typeof setActive>,
    result: Awaited<ReturnType<NonNullable<typeof signIn>["create"]>>,
  ) {
    if (result.status === "complete") {
      await activate({ session: result.createdSessionId });
      onComplete();
      return true;
    }

    if (result.status === "needs_first_factor") {
      // The password was accepted but the account still owes a verification.
      // Prefer an email code, which is what this instance issues.
      const emailFactor = result.supportedFirstFactors?.find(
        (factor): factor is Extract<typeof factor, { strategy: "email_code" }> =>
          factor.strategy === "email_code",
      );
      if (emailFactor) {
        const prepared = await resource.prepareFirstFactor({
          strategy: "email_code",
          emailAddressId: emailFactor.emailAddressId,
        });
        setCodeExpiresAt(prepared.firstFactorVerification?.expireAt ?? undefined);
        setPendingFactor("first");
        return false;
      }
      // No strategy we can drive from here (passkey, SSO, and similar).
      setError("This account needs a different sign-in method. Try 'Forgot password' or sign in on the web.");
      setErrorField("form");
      return false;
    }

    if (result.status === "needs_second_factor") {
      const emailFactor = result.supportedSecondFactors?.find(
        (factor): factor is Extract<typeof factor, { strategy: "email_code" }> =>
          factor.strategy === "email_code",
      );
      if (emailFactor) {
        const prepared = await resource.prepareSecondFactor({ strategy: "email_code" });
        setCodeExpiresAt(prepared.secondFactorVerification?.expireAt ?? undefined);
      }
      // A TOTP app code needs no preparation; the input is the same either way.
      setPendingFactor("second");
      return false;
    }

    if (result.status === "needs_new_password") {
      setError("Your password needs to be reset before you can sign in. Use 'Forgot password'.");
      setErrorField("form");
      return false;
    }

    if (result.status === "needs_identifier") {
      setError("Enter the email address for your account.");
      setErrorField("identifier");
      return false;
    }

    // Any remaining status is one this screen cannot drive.
    setError("We couldn't finish signing you in. Please try again.");
    setErrorField("form");
    return false;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!isLoaded || submitting) return;

    // Only presence is validated here. Length rules belong to sign-up: an
    // existing account may predate a stricter policy, and rejecting its owner
    // at the client would lock them out of their own account.
    if (!email.trim()) {
      setError("Enter your email address.");
      setErrorField("identifier");
      return;
    }
    if (!password) {
      setError("Enter your password.");
      setErrorField("password");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const attempt = await signIn.create({ identifier: email.trim(), password });
      await applyResult(signIn, setActive, attempt);
    } catch (caught) {
      const result = friendlyAuthError(caught, "We couldn't sign you in. Please try again.");
      setError(result.message);
      setErrorField(result.field);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerify(code: string) {
    if (!isLoaded) throw new Error("not-ready");
    const attempt = pendingFactor === "second"
      ? await signIn.attemptSecondFactor({ strategy: "email_code", code })
      : await signIn.attemptFirstFactor({ strategy: "email_code", code });
    const done = await applyResult(signIn, setActive, attempt);
    if (!done) throw new Error("incomplete");
  }

  async function handleResend() {
    if (!isLoaded) throw new Error("not-ready");
    if (pendingFactor === "second") {
      const prepared = await signIn.prepareSecondFactor({ strategy: "email_code" });
      const next = prepared.secondFactorVerification?.expireAt ?? undefined;
      setCodeExpiresAt(next);
      return next;
    }
    const emailFactor = signIn.supportedFirstFactors?.find(
      (factor): factor is Extract<typeof factor, { strategy: "email_code" }> =>
        factor.strategy === "email_code",
    );
    const prepared = await signIn.prepareFirstFactor({
      strategy: "email_code",
      emailAddressId: emailFactor?.emailAddressId ?? "",
    });
    const next = prepared.firstFactorVerification?.expireAt ?? undefined;
    setCodeExpiresAt(next);
    return next;
  }

  if (!isLoaded) {
    return <div className="auth-skeleton" aria-hidden="true" />;
  }

  // Clerk asked for a code. The same screen used at sign-up is reused so the
  // experience is identical wherever a code is required.
  if (pendingFactor) {
    return (
      <VerifyEmail
        email={email.trim()}
        onVerify={handleVerify}
        onResend={handleResend}
        onCancel={() => {
          setPendingFactor(null);
          setPassword("");
          setError("");
        }}
        expiresAt={codeExpiresAt}
      />
    );
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

        <PasswordField
          label="Password"
          value={password}
          onChange={(value) => {
            setPassword(value);
            setError("");
          }}
          autoComplete="current-password"
          invalid={errorField === "password" && Boolean(error)}
          disabled={submitting}
        />

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
