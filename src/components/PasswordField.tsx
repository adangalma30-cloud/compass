import { useState } from "react";

type PasswordFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: "current-password" | "new-password";
  invalid?: boolean;
  disabled?: boolean;
  hint?: string;
};

/**
 * Password input with a show/hide toggle.
 *
 * Shared by sign-in and sign-up so both behave identically. The toggle is a
 * button rather than a checkbox so screen readers announce the action, and it
 * reports the current state through aria-pressed.
 */
export default function PasswordField({
  label,
  value,
  onChange,
  autoComplete,
  invalid = false,
  disabled = false,
  hint,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <label className="auth-field">
      <span>{label}</span>
      <div className={`password-wrap${invalid ? " password-wrap-error" : ""}`}>
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          disabled={disabled}
          required
        />
        <button
          type="button"
          className="password-toggle"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          disabled={disabled}
          // Keeps focus in the input so toggling does not interrupt typing.
          tabIndex={-1}
        >
          {visible ? (
            // Eye with a slash: currently visible, tapping hides it.
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M10.6 5.2A9.9 9.9 0 0 1 12 5c5.5 0 9 6 9 6a15.5 15.5 0 0 1-3 3.6M6.5 6.6A15.6 15.6 0 0 0 3 11s3.5 6 9 6a9.6 9.6 0 0 0 4-.85" />
              <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
              <path d="m3 3 18 18" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 11s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6Z" />
              <circle cx="12" cy="11" r="2.8" />
            </svg>
          )}
        </button>
      </div>
      {hint && <small className="auth-hint">{hint}</small>}
    </label>
  );
}
