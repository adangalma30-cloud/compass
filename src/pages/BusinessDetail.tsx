import { Link, useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import BusinessCard from "../components/BusinessCard";
import businesses from "../data/businesses";
import { useFavorites } from "../hooks/useFavorites";
import BusinessImage from "../components/BusinessImage";
import CompassMark from "../components/CompassMark";

function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#fbfcff] px-6 text-center">
      <CompassMark size={68} className="mb-4 text-[#5365d1]" />
      <h1 className="mb-2 text-2xl font-bold text-[#111b3a]">Business not found</h1>
      <p className="mb-6 text-[#697694]">This listing may have moved or been removed.</p>
      <Link
        to="/"
        className="rounded-xl bg-[#5365d1] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#4354c0]"
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
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShareCopied(true);
      window.setTimeout(() => setShareCopied(false), 2200);
    } catch {
      setShareCopied(false);
    }
  }

  const related = businesses.filter(
    (b) => b.category === business.category && b.id !== business.id
  );

  return (
    <div className="min-h-screen bg-[#f5f7fc]">
      <Navbar />

      <main className="mx-auto max-w-5xl px-5 py-6 sm:px-6 sm:py-8">
        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="group mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-[#697694] transition-colors hover:text-[#1c2a51] sm:mb-8"
        >
          <span className="group-hover:-translate-x-0.5 transition-transform">←</span>
          Back to results
        </button>

        {/* Hero card */}
        <div className="mb-6 overflow-hidden rounded-[1.75rem] border border-[#e1e6f2] bg-white shadow-[0_14px_36px_rgba(28,45,88,0.08)]">
          <BusinessImage
            src={business.photo}
            alt={`${business.name} interior`}
            className="h-64 w-full sm:h-80 md:h-[26rem]"
          />
          <div className="p-5 sm:p-8">
            <div className="flex flex-col items-start gap-5 sm:flex-row">
              <div className="min-w-0 flex-1">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[#eef1ff] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#5365d1]">
                    {business.category}
                  </span>
                  <span className="text-xs font-medium text-[#7883a1]">{business.city}</span>
                </div>

                <h1 className="mb-3 text-3xl font-extrabold tracking-tight text-[#111b3a] sm:text-4xl">
                  {business.name}
                </h1>

                <StarRow rating={business.rating} reviews={business.reviews} />

                <div className="mt-4 flex flex-wrap gap-2">
                  {business.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-[#e4e8f2] bg-[#f7f8fc] px-3 py-1 text-xs text-[#697694]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex w-full flex-wrap gap-2 sm:w-auto">
                <button
                  type="button"
                  onClick={() => toggleFavorite(business.id)}
                  className={`rounded-xl border px-4 py-2 text-sm font-semibold transition-colors ${
                    isFavorite(business.id)
                      ? "border-[#5365d1] bg-[#5365d1] text-white"
                      : "border-[#dfe4f0] bg-white text-[#65718e] hover:border-[#aab5ed] hover:text-[#5365d1]"
                  }`}
                >
                  {isFavorite(business.id) ? "Saved" : "Save place"}
                </button>
                <button
                  type="button"
                  onClick={handleShare}
                  className="rounded-xl border border-[#dfe4f0] bg-white px-4 py-2 text-sm font-semibold text-[#65718e] transition-colors hover:border-[#aab5ed] hover:text-[#5365d1]"
                >
                  {shareCopied ? "Link copied" : "Share"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Body grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: AI + About */}
          <div className="lg:col-span-2 space-y-6">
            {/* AI Recommends */}
            {business.aiSummary && (
              <div className="rounded-2xl bg-[#07132f] p-6 text-white shadow-[0_12px_30px_rgba(7,19,47,0.16)]">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-base text-[#9da8ff]">+</span>
                  <span className="text-xs font-semibold uppercase tracking-widest text-[#aeb8ff]">
                    AI Recommends
                  </span>
                </div>
                <p className="text-slate-200 text-sm leading-relaxed">
                  {business.aiSummary}
                </p>
                <p className="text-slate-600 text-xs mt-4">
                  Based on ratings, reviews, and community signals ·{" "}
                    <span className="italic text-[#8190c5]">AI Recommends. People Decide.</span>
                </p>
              </div>
            )}

            {/* About */}
            <div className="rounded-2xl border border-[#e1e6f2] bg-white p-6">
              <h2 className="mb-3 text-base font-bold text-[#111b3a]">About</h2>
              <p className="text-sm leading-relaxed text-[#5e6a88]">
                {business.description}
              </p>
            </div>
          </div>

          {/* Right: Business info */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-[#e1e6f2] bg-white p-6">
              <h2 className="mb-4 text-base font-bold text-[#111b3a]">
                Business info
              </h2>

              <div className="space-y-4 text-sm">
                {/* Hours */}
                {business.hours && business.hours.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#8a94ad]">
                      Hours
                    </p>
                    <div className="space-y-1.5">
                      {business.hours.map((h) => (
                        <div
                          key={h.days}
                          className="flex justify-between gap-4"
                        >
                           <span className="shrink-0 text-[#697694]">{h.days}</span>
                          <span
                            className={`text-right font-medium ${
                              h.time === "Closed"
                                 ? "text-[#9aa4bc]"
                                 : "text-[#1c2a51]"
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
                     <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[#8a94ad]">
                      Address
                    </p>
                     <p className="text-[#53617e]">{business.address}</p>
                  </div>
                )}

                {/* Phone */}
                {business.phone && (
                  <div className="pt-4 border-t border-gray-50">
                     <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[#8a94ad]">
                      Phone
                    </p>
                    <a
                      href={`tel:${business.phone}`}
                       className="text-[#5365d1] transition-colors hover:text-[#394aaa]"
                    >
                      {business.phone}
                    </a>
                  </div>
                )}

                {/* Website */}
                {business.website && (
                  <div className="pt-4 border-t border-gray-50">
                     <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[#8a94ad]">
                      Website
                    </p>
                    <a
                      href={`https://${business.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                       className="break-all text-[#5365d1] transition-colors hover:text-[#394aaa]"
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
            <div className="grid gap-4">
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
                  photo={b.photo}
                  isFavorite={isFavorite(b.id)}
                  onToggleFavorite={toggleFavorite}
                />
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-[#e4e8f2] bg-white">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-5 py-10 text-sm text-[#8a94ad] sm:flex-row sm:px-6">
          <Link
            to="/"
            className="flex items-center gap-2 font-semibold text-[#52618c] transition-colors hover:text-[#1c2a51]"
          >
            <CompassMark size={24} className="text-[#5365d1]" />
            <span>Compass</span>
          </Link>
          <p>AI Recommends. People Decide.</p>
          <p>© {new Date().getFullYear()} Compass.</p>
        </div>
      </footer>
    </div>
  );
}
