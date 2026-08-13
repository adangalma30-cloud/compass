import { useClerk, useUser } from "@clerk/react";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import BusinessCard from "../components/BusinessCard";
import Icon from "../components/Icon";
import { api } from "../lib/api";
import type { Business } from "../types/business";

export default function Profile() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const navigate = useNavigate();
  const [savedBusinesses, setSavedBusinesses] = useState<Business[]>([]);
  const [name, setName] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!user) return;
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
        if (!cancelled) setMessage("Saved places are temporarily unavailable.");
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (!isLoaded) {
    return <div className="min-h-screen animate-pulse bg-[#eef1f7]" />;
  }
  if (!user) {
    navigate("/sign-in", { replace: true });
    return null;
  }
  const currentUser = user;

  async function saveName() {
    setSavingName(true);
    setMessage("");
    try {
      const response = await api.updateMe(name);
      await currentUser.update({ firstName: response.user.name });
      setEditingName(false);
      setMessage("Profile updated.");
    } catch {
      setMessage("We couldn't update your profile.");
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
          {user.imageUrl ? <img src={user.imageUrl} alt="" className="profile-large-avatar" /> : <span className="profile-large-avatar profile-avatar-fallback">{(user.firstName?.[0] ?? "C").toUpperCase()}</span>}
          <div>
            <p className="profile-kicker">Your Compass</p>
            <h1>{user.firstName || user.username || "Compass member"}</h1>
            <p>{user.primaryEmailAddress?.emailAddress}</p>
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
              {user.primaryEmailAddress?.verification?.status === "verified" ? "Email verified" : "Verify your email"}
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
                setName(user.firstName || user.username || "");
                setEditingName(true);
              }}>
                {user.firstName || user.username || "Add your name"} <Icon name="arrow-right" size={14} />
              </button>
            )}
          </div>
          <div className="profile-detail-row"><span>Email</span><strong>{user.primaryEmailAddress?.emailAddress}</strong></div>
          {message && <p className="form-message success">{message}</p>}
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

        <button type="button" className="profile-signout" onClick={() => signOut({ redirectUrl: "/" })}>
          Sign out
        </button>
      </main>
    </div>
  );
}