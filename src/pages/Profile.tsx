import { useClerk } from "@clerk/react";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import BusinessCard from "../components/BusinessCard";
import Icon from "../components/Icon";
import { ApiError, api } from "../lib/api";
import { useAuthState } from "../lib/authState";
import type { Business } from "../types/business";

/** Shape returned by the authenticated /api/me endpoint. */
type AccountDetails = {
  id: string;
  name: string;
  email: string;
  profileImage?: string;
  emailVerified: boolean;
};

export default function Profile() {
  // Route access is enforced by RequireAuth; this reads the shared auth state.
  const { isLoaded, isSignedIn, isVerified, user } = useAuthState();
  const { signOut } = useClerk();
  const navigate = useNavigate();
  const [savedBusinesses, setSavedBusinesses] = useState<Business[]>([]);
  // The authenticated account as the server sees it. Never hardcoded.
  const [account, setAccount] = useState<AccountDetails | undefined>();
  const [name, setName] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Load the signed-in account from the backend, which resolves the user from
  // the verified session token - never from a client-supplied id.
  useEffect(() => {
    if (!isSignedIn) return;
    let cancelled = false;
    api
      .getMe()
      .then((response) => {
        if (!cancelled) setAccount(response.user);
      })
      .catch(() => {
        if (!cancelled) setErrorMessage("We couldn't load your account details.");
      });
    return () => {
      cancelled = true;
    };
  }, [isSignedIn]);

  useEffect(() => {
    if (!isSignedIn || !isVerified) return;
    let cancelled = false;
    api
      .getFavorites()
      .then(async (favoriteIds) => {
        const businesses = await Promise.all(
          favoriteIds.map(async (id) => {
            try {
              return (await api.getBusiness(id)).business;
            } catch {
              return undefined;
            }
          }),
        );
        if (!cancelled) setSavedBusinesses(businesses.filter((business): business is Business => Boolean(business)));
      })
      .catch(() => {
        if (!cancelled) setErrorMessage("Saved places are temporarily unavailable.");
      });
    return () => {
      cancelled = true;
    };
  }, [isSignedIn, isVerified]);

  if (!isLoaded) {
    return <div className="min-h-screen animate-pulse bg-[#eef1f7]" />;
  }
  if (!isSignedIn || !user) {
    return null;
  }

  // Prefer the server's copy of the account, falling back to the session user
  // while the request is in flight.
  const displayName = account?.name || user.name;
  const displayEmail = account?.email || user.email;
  const displayImage = account?.profileImage || user.imageUrl;
  const emailVerified = account?.emailVerified ?? user.emailVerified;

  async function handleSignOut() {
    setSigningOut(true);
    try {
      // Clears the stored session so reopening the app returns a guest home.
      await signOut();
      navigate("/", { replace: true });
    } catch {
      setSigningOut(false);
      setErrorMessage("We couldn't sign you out. Please try again.");
    }
  }

  async function saveName() {
    setSavingName(true);
    setMessage("");
    setErrorMessage("");
    try {
      const response = await api.updateMe(name);
      setAccount(response.user);
      setEditingName(false);
      setMessage("Profile updated.");
    } catch (error) {
      setErrorMessage(
        error instanceof ApiError && error.isVerificationError
          ? "Verify your email before updating your profile."
          : "We couldn't update your profile.",
      );
    } finally {
      setSavingName(false);
    }
  }

  return (
    <div className="profile-page">
      <header className="profile-header">
        <Link to="/" className="brand-lockup" aria-label="Compass home">
          <span className="brand-mark"><Icon name="compass" size={21} /></span>
          <span>Compass</span>
        </Link>
        <Link to="/" className="profile-back"><Icon name="arrow-left" size={15} /> Explore</Link>
      </header>
      <main className="profile-main">
        <section className="profile-hero">
          {displayImage ? (
            <img src={displayImage} alt="" className="profile-large-avatar" referrerPolicy="no-referrer" />
          ) : (
            <span className="profile-large-avatar profile-avatar-fallback">{(displayName[0] ?? "C").toUpperCase()}</span>
          )}
          <div>
            <p className="profile-kicker">Your Compass</p>
            <h1>{displayName}</h1>
            <p>{displayEmail}</p>
          </div>
        </section>

        <section className="profile-panel">
          <div className="profile-panel-heading">
            <div>
              <p className="profile-kicker">Account</p>
              <h2>Account details</h2>
            </div>
            <span className="verification-pill">
              <span className="verification-dot" />
              {emailVerified ? "Email verified" : "Verify your email"}
            </span>
          </div>
          <div className="profile-detail-row">
            <span>Name</span>
            {editingName ? (
              <div className="profile-edit">
                <input value={name} onChange={(event) => setName(event.target.value)} aria-label="Profile name" />
                <button type="button" onClick={saveName} disabled={savingName}>{savingName ? "Saving…" : "Save"}</button>
                <button type="button" className="profile-cancel" onClick={() => setEditingName(false)}>Cancel</button>
              </div>
            ) : (
              <button type="button" className="profile-edit-link" onClick={() => {
                setName(displayName);
                setEditingName(true);
              }}>
                {displayName || "Add your name"} <Icon name="arrow-right" size={14} />
              </button>
            )}
          </div>
          <div className="profile-detail-row"><span>Email</span><strong>{displayEmail}</strong></div>
          {message && <p className="form-message success">{message}</p>}
          {errorMessage && <p className="form-message error">{errorMessage}</p>}
        </section>

        <section className="profile-panel">
          <div className="profile-panel-heading">
            <div>
              <p className="profile-kicker">Your shortlist</p>
              <h2>Saved places</h2>
            </div>
            <span className="profile-count">{savedBusinesses.length}</span>
          </div>
          {savedBusinesses.length > 0 ? (
            <div className="grid gap-3">
              {savedBusinesses.map((business) => (
                <BusinessCard
                  key={business.id}
                  id={business.id}
                  name={business.name}
                  description={business.description}
                  rating={business.rating}
                  reviews={business.reviews}
                  city={business.city}
                  category={business.category}
                  tags={business.tags}
                  photo={business.photo}
                  isFavorite
                />
              ))}
            </div>
          ) : (
            <div className="profile-empty">
              <span><Icon name="bookmark" size={22} /></span>
              <p>No saved places yet.</p>
              <Link to="/">Start exploring</Link>
            </div>
          )}
        </section>

        <button type="button" className="profile-signout" onClick={handleSignOut} disabled={signingOut}>
          {signingOut ? "Signing out…" : "Sign out"}
        </button>
      </main>
    </div>
  );
}