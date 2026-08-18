import { useEffect, useRef, useState } from "react";
import Icon from "./Icon";
import { friendlyAuthError } from "../lib/authErrors";

const CODE_LENGTH = 6;
const RESEND_COOLDOWN_SECONDS = 30;

type VerifyEmailProps = {
  /** Address the code was sent to, shown so the user can spot a typo. */
  email: string;
  /** Submits the OTP to Clerk. Rejects when the code is wrong or expired. */
  onVerify: (code: string) => Promise<void>;
  /**
   * Asks Clerk to send a fresh code. Resolves with the new expiry when Clerk
   * reports one, so the countdown tracks the real code rather than a guess.
   */
  onResend: () => Promise<Date | undefined>;
  /** Abandons the attempt and returns to the form. */
  onCancel: () => void;
  /** When the current code stops being valid, as reported by Clerk. */
  expiresAt?: Date;
};

/** Formats remaining milliseconds as m:ss. */
function formatRemaining(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

/**
 * One-time passcode screen for email verification.
 *
 * This owns only the UI and input handling. Every code is validated by Clerk;
 * nothing here decides whether an address is verified.
 */
export default function VerifyEmail({ email, onVerify, onResend, onCancel, expiresAt }: VerifyEmailProps) {
  const [digits, setDigits] = useState<string[]>(() => Array(CODE_LENGTH).fill(""));
  const [status, setStatus] = useState<"idle" | "verifying" | "resending" | "verified">("idle");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);
  // Set by a resend so the countdown can outlive the original prop value.
  const [resentExpiry, setResentExpiry] = useState<Date | undefined>();
  // A ticking clock. Remaining time is derived from it rather than mirrored
  // into state, so there is one source of truth for the deadline.
  const [now, setNow] = useState(() => Date.now());
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  const code = digits.join("");
  const busy = status === "verifying" || status === "resending";
  const expiry = resentExpiry ?? expiresAt;
  const remainingMs = expiry ? expiry.getTime() - now : undefined;
  const expired = remainingMs !== undefined && remainingMs <= 0;

  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  // Advances the clock once a second so the countdown re-renders. Stops once
  // the code has expired; there is nothing further to count.
  useEffect(() => {
    if (!expiry || expired) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [expiry, expired]);

  // Cooldown stops users hammering the resend button into a rate limit.
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(() => setCooldown((current) => current - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  async function submit(fullCode: string) {
    if (fullCode.length !== CODE_LENGTH || busy) return;
    if (expired) {
      setError("That code has expired. Request a new one.");
      return;
    }
    setStatus("verifying");
    setError("");
    setNotice("");
    try {
      await onVerify(fullCode);
      // The parent redirects on success; showing the success state avoids a
      // flash of the empty form while that happens.
      setStatus("verified");
    } catch (caught) {
      const { message } = friendlyAuthError(caught, "Something went wrong while verifying your email.");
      setError(message);
      setStatus("idle");
      setDigits(Array(CODE_LENGTH).fill(""));
      inputsRef.current[0]?.focus();
    }
  }

  function updateDigit(index: number, rawValue: string) {
    const value = rawValue.replace(/\D/g, "");
    if (!value) {
      setDigits((current) => current.map((digit, position) => (position === index ? "" : digit)));
      return;
    }

    // A pasted or autofilled code fills the whole row from this position.
    const next = [...digits];
    for (let offset = 0; offset < value.length && index + offset < CODE_LENGTH; offset += 1) {
      next[index + offset] = value[offset];
    }
    setDigits(next);
    setError("");

    const nextEmpty = next.findIndex((digit) => !digit);
    const focusIndex = nextEmpty === -1 ? CODE_LENGTH - 1 : nextEmpty;
    inputsRef.current[focusIndex]?.focus();

    const joined = next.join("");
    if (joined.length === CODE_LENGTH && !next.includes("")) void submit(joined);
  }

  function handleKeyDown(index: number, event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
    if (event.key === "ArrowLeft" && index > 0) inputsRef.current[index - 1]?.focus();
    if (event.key === "ArrowRight" && index < CODE_LENGTH - 1) inputsRef.current[index + 1]?.focus();
  }

  async function resend() {
    // Mirrors the button's disabled rule exactly. An expired code bypasses the
    // cooldown, otherwise an enabled button would silently do nothing.
    if ((cooldown > 0 && !expired) || busy) return;
    setStatus("resending");
    setError("");
    setNotice("");
    try {
      const nextExpiry = await onResend();
      setResentExpiry(nextExpiry);
      setNow(Date.now());
      setNotice(`We sent a new code to ${email}.`);
      setCooldown(RESEND_COOLDOWN_SECONDS);
      setDigits(Array(CODE_LENGTH).fill(""));
      inputsRef.current[0]?.focus();
    } catch (caught) {
      const { message } = friendlyAuthError(caught, "We couldn't send a new code. Please try again.");
      setError(message);
    } finally {
      setStatus((current) => (current === "resending" ? "idle" : current));
    }
  }

  return (
    <div className="otp-card">
      <div className="otp-icon" aria-hidden="true"><Icon name="mail" size={22} /></div>
      <h1 className="otp-title">Verify your email</h1>
      <p className="otp-subtitle">
        Enter the {CODE_LENGTH}-digit code we sent to
        <strong> {email}</strong>
      </p>

      <form
        className="otp-form"
        onSubmit={(event) => {
          event.preventDefault();
          void submit(code);
        }}
      >
        <div className="otp-inputs" role="group" aria-label="Verification code">
          {digits.map((digit, index) => (
            <input
              key={index}
              ref={(element) => {
                inputsRef.current[index] = element;
              }}
              className={`otp-input${error ? " otp-input-error" : ""}`}
              value={digit}
              onChange={(event) => updateDigit(index, event.target.value)}
              onKeyDown={(event) => handleKeyDown(index, event)}
              inputMode="numeric"
              autoComplete={index === 0 ? "one-time-code" : "off"}
              maxLength={CODE_LENGTH}
              aria-label={`Digit ${index + 1}`}
              disabled={busy || status === "verified" || expired}
            />
          ))}
        </div>

        {remainingMs !== undefined && status !== "verified" && (
          expired ? (
            <p className="otp-expiry otp-expiry-done" role="status">
              This code has expired. Request a new one below.
            </p>
          ) : (
            <p className={`otp-expiry${remainingMs <= 60_000 ? " otp-expiry-soon" : ""}`} role="status">
              Code expires in {formatRemaining(remainingMs)}
            </p>
          )
        )}

        {error && <p className="form-message error" role="alert">{error}</p>}
        {notice && !error && <p className="form-message success">{notice}</p>}
        {status === "verified" && <p className="form-message success">Email verified. Taking you to Compass…</p>}

        <button
          type="submit"
          className="otp-submit"
          disabled={code.length !== CODE_LENGTH || busy || status === "verified" || expired}
        >
          {status === "verifying" ? "Verifying…" : status === "verified" ? "Verified" : "Verify"}
        </button>
      </form>

      <div className="otp-actions">
        <button
          type="button"
          onClick={resend}
          /* An expired code is useless, so the cooldown is bypassed to avoid
             stranding the user until it elapses. */
          disabled={(cooldown > 0 && !expired) || busy || status === "verified"}
        >
          {status === "resending"
            ? "Sending…"
            : cooldown > 0 && !expired
              ? `Resend code in ${cooldown}s`
              : "Resend code"}
        </button>
        <button type="button" className="otp-cancel" onClick={onCancel} disabled={busy}>
          Use a different email
        </button>
      </div>
    </div>
  );
}
