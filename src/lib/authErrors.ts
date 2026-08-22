/**
 * Converts Clerk errors into safe, user-facing copy.
 *
 * Raw provider errors are never rendered: they leak implementation detail and
 * are rarely actionable. Everything funnels through `friendlyAuthError`.
 */

export type FieldName = "identifier" | "password" | "code" | "form";

export type AuthErrorResult = {
  message: string;
  field: FieldName;
  /** True when the code is dead and the user must request a new one. */
  expired?: boolean;
};

type ClerkApiError = {
  code?: string;
  message?: string;
  longMessage?: string;
  meta?: { paramName?: string };
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/** Clerk attaches a structured `errors` array to failed requests. */
function clerkErrors(error: unknown): ClerkApiError[] {
  if (!isRecord(error)) return [];
  const errors = (error as { errors?: unknown }).errors;
  return Array.isArray(errors) ? (errors as ClerkApiError[]) : [];
}

function fieldForParam(param: string | undefined): FieldName {
  if (param === "password") return "password";
  if (param === "code") return "code";
  if (param === "identifier" || param === "email_address") return "identifier";
  return "form";
}

/** Connectivity failure rather than a credential problem. */
function isNetworkError(error: unknown): boolean {
  if (typeof navigator !== "undefined" && navigator.onLine === false) return true;
  if (error instanceof TypeError) return true;
  if (isRecord(error)) {
    const message = String((error as { message?: unknown }).message ?? "");
    return /network|failed to fetch|timeout|connection/i.test(message);
  }
  return false;
}

/** Codes that mean the OTP is no longer usable and must be re-sent. */
const EXPIRED_CODES = new Set([
  "verification_expired",
  "verification_failed",
  "form_code_expired",
  "client_state_invalid",
]);

const MESSAGES: Record<string, string> = {
  // Sign in
  form_identifier_not_found: "We couldn't find an account with that email.",
  form_password_incorrect: "That password is incorrect. Please try again.",
  // Sign up
  form_identifier_exists: "An account with that email already exists. Try signing in instead.",
  form_password_pwned: "That password has appeared in a data breach. Please choose a different one.",
  form_password_validation_failed: "That password doesn't meet the requirements.",
  // Shared validation
  form_param_format_invalid: "Enter a valid email address.",
  form_param_nil: "Please fill in every field.",
  // OTP
  form_code_incorrect: "That code is incorrect. Please try again.",
  verification_expired: "That code has expired. Request a new one.",
  form_code_expired: "That code has expired. Request a new one.",
  verification_failed: "Too many incorrect attempts. Request a new code.",
  client_state_invalid: "That code has expired. Request a new one.",
  // Rate limiting / bot protection
  too_many_requests: "Too many attempts. Please wait a moment and try again.",
  captcha_invalid: "We couldn't verify this device. Please try again.",
  captcha_unavailable: "We couldn't verify this device. Please try again.",
  session_exists: "You're already signed in.",
};

/** Maps any thrown authentication error to a safe message and target field. */
export function friendlyAuthError(error: unknown, fallback?: string): AuthErrorResult {
  if (isNetworkError(error)) {
    return {
      message: "We couldn't reach Compass. Check your connection and try again.",
      field: "form",
    };
  }

  const [first] = clerkErrors(error);
  if (first) {
    const code = first.code ?? "";
    const mapped = MESSAGES[code];
    if (mapped) {
      return {
        message: mapped,
        field: fieldForParam(first.meta?.paramName),
        expired: EXPIRED_CODES.has(code),
      };
    }
    // Clerk's longMessage is written for end users; prefer it over a generic
    // message, but never surface internal codes or stack traces.
    if (first.longMessage) {
      return { message: first.longMessage, field: fieldForParam(first.meta?.paramName) };
    }
  }

  return { message: fallback ?? "Something went wrong. Please try again.", field: "form" };
}

/**
 * Client-side validation so obvious mistakes never hit the network.
 *
 * `minPasswordLength` comes from the Clerk instance at runtime rather than
 * being hardcoded: the requirement is configurable in the Clerk Dashboard, and
 * a stale local copy rejects passwords that Clerk would actually accept.
 * Passing `undefined` skips the length check and lets Clerk be the authority.
 */
export function validateCredentials(
  email: string,
  password: string,
  minPasswordLength?: number,
  maxPasswordLength?: number,
): AuthErrorResult | undefined {
  if (!email.trim()) return { message: "Enter your email address.", field: "identifier" };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return { message: "Enter a valid email address.", field: "identifier" };
  }
  if (!password) return { message: "Enter your password.", field: "password" };
  if (minPasswordLength && password.length < minPasswordLength) {
    return {
      message: `Use a password with at least ${minPasswordLength} characters.`,
      field: "password",
    };
  }
  if (maxPasswordLength && password.length > maxPasswordLength) {
    return {
      message: `Use a password of ${maxPasswordLength} characters or fewer.`,
      field: "password",
    };
  }
  return undefined;
}
