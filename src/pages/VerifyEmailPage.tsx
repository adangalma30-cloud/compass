import { useEffect, useState } from "react";
import { useUser } from "@clerk/react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import Icon from "../components/Icon";
import VerifyEmail from "../components/VerifyEmail";
import { useAuthState } from "../lib/authState";

/**
 * Verification for a user who is already signed in but whose email is not yet
 * verified.
 *
 * This covers the case where the app is closed mid sign-up: the account exists
 * and the session may be active, but the address is still unverified. The
 * badge and every gated feature stay locked until Clerk confirms the code, so
 * closing the app can never produce a false verified state.
 */
export default function VerifyEmailPage() {
  const { isLoaded, isSignedIn, isVerified, user } = useAuthState();
  const { user: clerkUser } = useUser();
  const navigate = useNavigate();
  const [preparing, setPreparing] = useState(true);
  const [prepareError, setPrepareError] = useState("");
  const [codeExpiresAt, setCodeExpiresAt] = useState<Date | undefined>();

  const emailAddress = clerkUser?.primaryEmailAddress;

  // Send a code as soon as the screen opens so the user is not left waiting
  // on a button they did not know to press.
  useEffect(() => {
    if (!isLoaded || !isSignedIn || isVerified || !emailAddress) return;
    let cancelled = false;
    emailAddress
      .prepareVerification({ strategy: "email_code" })
      .then((result) => {
        if (!cancelled) setCodeExpiresAt(result?.verification?.expireAt ?? undefined);
      })
      .catch(() => {
        if (!cancelled) setPrepareError("We couldn't send a code. Try resending below.");
      })
      .finally(() => {
        if (!cancelled) setPreparing(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, isVerified, emailAddress]);

  if (!isLoaded) return <div className="min-h-screen animate-pulse bg-[#eef1f7]" />;
  if (!isSignedIn) return <Navigate to="/sign-in" replace />;
  // Already verified: nothing to do here.
  if (isVerified) return <Navigate to="/" replace />;

  async function handleVerify(code: string) {
    if (!emailAddress) throw new Error("no-email");
    const result = await emailAddress.attemptVerification({ code });
    if (result?.verification?.status !== "verified") throw new Error("not-verified");
    // Refresh so the badge and gated features update immediately.
    await clerkUser?.reload();
    navigate("/", { replace: true });
  }

  async function handleResend() {
    if (!emailAddress) throw new Error("no-email");
    setPrepareError("");
    const result = await emailAddress.prepareVerification({ strategy: "email_code" });
    const next = result?.verification?.expireAt ?? undefined;
    setCodeExpiresAt(next);
    return next;
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
        <div className="auth-clerk-shell">
          {preparing ? (
            <div className="auth-skeleton" aria-hidden="true" />
          ) : (
            <>
              {prepareError && <p className="form-message error">{prepareError}</p>}
              <VerifyEmail
                email={user?.email ?? emailAddress?.emailAddress ?? ""}
                onVerify={handleVerify}
                onResend={handleResend}
                onCancel={() => navigate("/", { replace: true })}
                expiresAt={codeExpiresAt}
              />
            </>
          )}
        </div>
        <Link to="/" className="auth-back"><Icon name="arrow-left" size={16} /> Back to exploring</Link>
      </div>
    </main>
  );
}
