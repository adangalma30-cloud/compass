import { Link, useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import BusinessCard from "../components/BusinessCard";
import businesses from "../data/businesses";
import { useFavorites } from "../hooks/useFavorites";

function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-6">
      <p className="text-5xl mb-4">🧭</p>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Business not found</h1>
      <p className="text-gray-500 mb-6">This listing may have moved or been removed.</p>
      <Link
        to="/"
        className="text-sm font-semibold bg-indigo-600 text-white px-5 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors"
      >
        Back to Compass
      </Link>
    </div>
  );
}

function StarRow({ rating, reviews }: { rating: number; reviews: number }) {
  const full = Math.floor(rating);
  const partial = rating % 1 >= 0.5;
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }, (_, i) => (
          <span
            key={i}
            className={`text-lg ${
              i < full
                ? "text-amber-400"
                : i === full && partial
                  ? "text-amber-300"
                  : "text-gray-200"
            }`}
          >
            ★
          </span>
        ))}
      </div>
      <span className="text-sm font-bold text-gray-900">{rating}</span>
      <span className="text-sm text-gray-400">
        ({reviews.toLocaleString()} reviews)
      </span>
    </div>
  );
}

export default function BusinessDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [shareCopied, setShareCopied] = useState(false);
  const { toggleFavorite, isFavorite } = useFavorites();

  const business = businesses.find((b) => b.id === Number(id));
  useEffect(() => {
    if (!business) return;
    document.title = `${business.name} — Compass`;
    return () => {
      document.title = "Compass — Find Local Businesses";
    };
  }, [business]);

  if (!business) return <NotFound />;

  async function handleShare() {
    if (!business) return;
    const shareBusiness = business;
    const shareData = {
      title: `${shareBusiness.name} on Compass`,
      text: shareBusiness.description,
      url: window.location.href,
    };
    if (navigator.share) {
      await navigator.share(shareData);
      return;
    }
    await navigator.clipboard.writeText(window.location.href);
    setShareCopied(true);
    window.setTimeout(() => setShareCopied(false), 2200);
  }

  const related = businesses.filter(
    (b) => b.category === business.category && b.id !== business.id
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-8 transition-colors group"
        >
          <span className="group-hover:-translate-x-0.5 transition-transform">←</span>
          Back to results
        </button>

        {/* Hero card */}
        <div className="bg-white rounded-3xl border border-gray-100 p-6 md:p-8 mb-6 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            {/* Icon */}
            <div className="flex-shrink-0 w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-gradient-to-br from-indigo-50 to-indigo-100 flex items-center justify-center text-4xl md:text-5xl shadow-inner">
              {business.icon}
            </div>

            {/* Meta */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="text-xs font-semibold bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-full">
                  {business.category}
                </span>
                <span className="text-xs text-gray-400">📍 {business.city}</span>
              </div>

              <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight mb-3">
                {business.name}
              </h1>

              <StarRow rating={business.rating} reviews={business.reviews} />

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mt-4">
                {business.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs text-gray-500 bg-gray-50 border border-gray-100 px-3 py-1 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => toggleFavorite(business.id)}
                className={`rounded-xl border px-4 py-2 text-sm font-semibold transition-colors ${
                  isFavorite(business.id)
                    ? "border-indigo-600 bg-indigo-600 text-white"
                    : "border-gray-200 bg-white text-gray-700 hover:border-indigo-300 hover:text-indigo-600"
                }`}
              >
                {isFavorite(business.id) ? "Saved" : "Save place"}
              </button>
              <button
                type="button"
                onClick={handleShare}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:border-indigo-300 hover:text-indigo-600 transition-colors"
              >
                {shareCopied ? "Link copied" : "Share"}
              </button>
            </div>
          </div>
        </div>

        {/* Body grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: AI + About */}
          <div className="lg:col-span-2 space-y-6">
            {/* AI Recommends */}
            {business.aiSummary && (
              <div className="bg-slate-950 rounded-2xl p-6 text-white">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-indigo-400 text-base">✦</span>
                  <span className="text-xs font-semibold text-indigo-300 uppercase tracking-widest">
                    AI Recommends
                  </span>
                </div>
                <p className="text-slate-200 text-sm leading-relaxed">
                  {business.aiSummary}
                </p>
                <p className="text-slate-600 text-xs mt-4">
                  Based on ratings, reviews, and community signals ·{" "}
                  <span className="italic">AI Recommends. People Decide.</span>
                </p>
              </div>
            )}

            {/* About */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="text-base font-bold text-gray-900 mb-3">About</h2>
              <p className="text-gray-600 text-sm leading-relaxed">
                {business.description}
              </p>
            </div>
          </div>

          {/* Right: Business info */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="text-base font-bold text-gray-900 mb-4">
                Business info
              </h2>

              <div className="space-y-4 text-sm">
                {/* Hours */}
                {business.hours && business.hours.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                      Hours
                    </p>
                    <div className="space-y-1.5">
                      {business.hours.map((h) => (
                        <div
                          key={h.days}
                          className="flex justify-between gap-4"
                        >
                          <span className="text-gray-500 shrink-0">{h.days}</span>
                          <span
                            className={`text-right font-medium ${
                              h.time === "Closed"
                                ? "text-gray-400"
                                : "text-gray-900"
                            }`}
                          >
                            {h.time}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Address */}
                {business.address && (
                  <div className="pt-4 border-t border-gray-50">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                      Address
                    </p>
                    <p className="text-gray-700">{business.address}</p>
                  </div>
                )}

                {/* Phone */}
                {business.phone && (
                  <div className="pt-4 border-t border-gray-50">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                      Phone
                    </p>
                    <a
                      href={`tel:${business.phone}`}
                      className="text-indigo-600 hover:text-indigo-700 transition-colors"
                    >
                      {business.phone}
                    </a>
                  </div>
                )}

                {/* Website */}
                {business.website && (
                  <div className="pt-4 border-t border-gray-50">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                      Website
                    </p>
                    <a
                      href={`https://${business.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-700 transition-colors break-all"
                    >
                      {business.website} ↗
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Related businesses */}
        {related.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              More in {business.category}
            </h2>
            <p className="text-sm text-gray-500 mb-5">
              Other businesses you might like
            </p>
            <div className="grid gap-3">
              {related.map((b) => (
                <BusinessCard
                  key={b.id}
                  id={b.id}
                  name={b.name}
                  description={b.description}
                  rating={b.rating}
                  reviews={b.reviews}
                  city={b.city}
                  category={b.category}
                  tags={b.tags}
                  icon={b.icon}
                  isFavorite={isFavorite(b.id)}
                  onToggleFavorite={toggleFavorite}
                />
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white mt-16">
        <div className="max-w-5xl mx-auto px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-400">
          <Link
            to="/"
            className="flex items-center gap-2 font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            <span>🧭</span>
            <span>Compass</span>
          </Link>
          <p>AI Recommends. People Decide.</p>
          <p>© {new Date().getFullYear()} Compass.</p>
        </div>
      </footer>
    </div>
  );
}
