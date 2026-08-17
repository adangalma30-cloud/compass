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
  /** Asks Clerk to send a fresh code. */
  onResend: () => Promise<void>;
  /** Abandons the attempt and returns to the form. */
  onCancel: () => void;
};

/**
 * One-time passcode screen for email verification.
 *
 * This owns only the UI and input handling. Every code is validated by Clerk;
 * nothing here decides whether an address is verified.
 */
export default function VerifyEmail({ email, onVerify, onResend, onCancel }: VerifyEmailProps) {
  const [digits, setDigits] = useState<string[]>(() => Array(CODE_LENGTH).fill(""));
  const [status, setStatus] = useState<"idle" | "verifying" | "resending" | "verified">("idle");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  const code = digits.join("");
  const busy = status === "verifying" || status === "resending";

  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  // Cooldown stops users hammering the resend button into a rate limit.
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(() => setCooldown((current) => current - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  async function submit(fullCode: string) {
    if (fullCode.length !== CODE_LENGTH || busy) return;
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
    if (cooldown > 0 || busy) return;
    setStatus("resending");
    setError("");
    setNotice("");
    try {
      await onResend();
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
              disabled={busy || status === "verified"}
            />
          ))}
        </div>

        {error && <p className="form-message error" role="alert">{error}</p>}
        {notice && !error && <p className="form-message success">{notice}</p>}
        {status === "verified" && <p className="form-message success">Email verified. Taking you to Compass…</p>}

        <button
          type="submit"
          className="otp-submit"
          disabled={code.length !== CODE_LENGTH || busy || status === "verified"}
        >
          {status === "verifying" ? "Verifying…" : status === "verified" ? "Verified" : "Verify"}
        </button>
      </form>

      <div className="otp-actions">
        <button type="button" onClick={resend} disabled={cooldown > 0 || busy || status === "verified"}>
          {status === "resending"
            ? "Sending…"
            : cooldown > 0
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
