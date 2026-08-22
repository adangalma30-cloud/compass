import { useEffect, useState } from "react";

/**
 * Reads the password rules from the loaded Clerk instance.
 *
 * The minimum length is configurable in the Clerk Dashboard, so hardcoding it
 * in the client guarantees eventual drift: a stale value rejects passwords
 * Clerk would actually accept. Clerk already fetches these rules at startup,
 * so they are read from the loaded client rather than re-requested.
 *
 * If the settings cannot be read the hook returns no minimum, which skips the
 * local length check and lets Clerk validate. That is the safe direction to
 * fail: the server still enforces the real rule.
 */

type PasswordSettings = {
  min_length?: number;
  max_length?: number;
  require_special_char?: boolean;
  require_numbers?: boolean;
  require_uppercase?: boolean;
  require_lowercase?: boolean;
};

export type PasswordPolicy = {
  minLength?: number;
  maxLength?: number;
  /** Human-readable summary shown as form hint text. */
  hint: string;
};

/**
 * Upper bound Compass applies on top of Clerk's own rules.
 *
 * Clerk reports max_length 0 (meaning "no limit") on this instance, but the
 * product requires a bounded password, so the smaller of the two is used.
 */
const COMPASS_MAX_PASSWORD_LENGTH = 15;

function describe(settings: PasswordSettings | undefined): PasswordPolicy {
  const minLength = settings?.min_length && settings.min_length > 0 ? settings.min_length : undefined;
  const providerMax = settings?.max_length && settings.max_length > 0 ? settings.max_length : undefined;
  const maxLength = Math.min(providerMax ?? COMPASS_MAX_PASSWORD_LENGTH, COMPASS_MAX_PASSWORD_LENGTH);

  const extras: string[] = [];
  if (settings?.require_uppercase) extras.push("an uppercase letter");
  if (settings?.require_lowercase) extras.push("a lowercase letter");
  if (settings?.require_numbers) extras.push("a number");
  if (settings?.require_special_char) extras.push("a special character");

  // A minimum above the cap is contradictory, so the range collapses to the
  // value Clerk will actually accept rather than advertising an impossible one.
  const rangeText = minLength
    ? minLength >= maxLength
      ? `At least ${minLength} characters`
      : `${minLength}–${maxLength} characters`
    : `Up to ${maxLength} characters`;

  const extrasPart = extras.length ? `, including ${extras.join(", ")}` : "";
  return { minLength, maxLength, hint: `${rangeText}${extrasPart}.` };
}

/**
 * Pulls password settings off the loaded Clerk instance.
 *
 * The settings live on the underlying clerk-js singleton exposed as
 * `window.Clerk`. The `useClerk()` hook returns an isomorphic wrapper that does
 * not forward `environment`, so the global is read directly and defensively.
 */
function readSettings(): PasswordSettings | undefined {
  if (typeof window === "undefined") return undefined;
  const clerk = (window as unknown as {
    Clerk?: { environment?: { userSettings?: { passwordSettings?: PasswordSettings } } };
  }).Clerk;
  return clerk?.environment?.userSettings?.passwordSettings;
}

export function usePasswordPolicy(): PasswordPolicy {
  const [policy, setPolicy] = useState<PasswordPolicy>(() => describe(readSettings()));

  useEffect(() => {
    // The environment is populated asynchronously while Clerk boots, so poll
    // briefly until it appears rather than reading once and giving up.
    if (policy.minLength) return;
    let attempts = 0;
    const timer = window.setInterval(() => {
      attempts += 1;
      const next = describe(readSettings());
      if (next.minLength || attempts > 40) {
        window.clearInterval(timer);
        if (next.minLength) setPolicy(next);
      }
    }, 150);
    return () => window.clearInterval(timer);
  }, [policy.minLength]);

  return policy;
}
