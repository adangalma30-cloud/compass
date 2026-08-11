import { Link, useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import BusinessCard from "../components/BusinessCard";
import businesses from "../data/businesses";
import { useFavorites } from "../hooks/useFavorites";
import BusinessImage from "../components/BusinessImage";
import Icon from "../components/Icon";

function NotFound() {
  return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#fbfcff] px-6 text-center">
       <span className="mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-[#5365d1] text-white"><Icon name="compass" size={34} /></span>
      <h1 className="mb-2 text-2xl font-bold text-[#111b3a]">Business not found</h1>
      <p className="mb-6 text-[#697694]">This listing may have moved or been removed.</p>
       <Link
        to="/"
         className="rounded-xl bg-[#5365d1] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#4354c0]"
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
    <div className="detail-rating">
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }, (_, i) => (
          <span
            key={i}
            className={`text-sm ${
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
      <span className="text-xs text-gray-400">
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
    <div className="detail-page">
      <Navbar />

      <main className="detail-main">
        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="detail-back"
        >
          <Icon name="arrow-left" size={16} />
          Back to results
        </button>

        {/* Hero card */}
        <div className="detail-hero-card">
          <BusinessImage
            src={business.photo}
            alt={`${business.name} interior`}
             className="detail-hero-image"
          />
           <div className="detail-hero-content">
             <div className="detail-title-row">
               <div className="min-w-0">
                 <div className="detail-eyebrows">
                   <span className="detail-category">
                    {business.category}
                  </span>
                   <span className="detail-city"><Icon name="map-pin" size={13} /> {business.city}</span>
                </div>

                 <h1 className="detail-title">
                  {business.name}
                </h1>

                <StarRow rating={business.rating} reviews={business.reviews} />

                 <div className="detail-tags">
                  {business.tags.map((tag) => (
                    <span
                      key={tag}
                       className="business-tag"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
               <div className="detail-actions">
                <button
                  type="button"
                  onClick={() => toggleFavorite(business.id)}
                   className={`detail-action ${isFavorite(business.id) ? "active" : ""} ${
                    isFavorite(business.id)
                      ? "border-[#5365d1] bg-[#5365d1] text-white"
                      : "border-[#dfe4f0] bg-white text-[#65718e] hover:border-[#aab5ed] hover:text-[#5365d1]"
                  }`}
                >
                   <Icon name="heart" size={17} filled={isFavorite(business.id)} /> {isFavorite(business.id) ? "Saved" : "Save"}
                </button>
                <button
                  type="button"
                  onClick={handleShare}
                   className="detail-action"
                >
                   <Icon name="share" size={17} /> {shareCopied ? "Copied" : "Share"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Body grid */}
         <div className="detail-grid">
          {/* Left: AI + About */}
           <div className="detail-column">
            {/* AI Recommends */}
            {business.aiSummary && (
               <div className="recommendation-card">
                 <div className="recommendation-label">
                   <Icon name="spark" size={15} />
                   <span>
                    AI Recommends
                  </span>
                </div>
                 <p>
                  {business.aiSummary}
                </p>
                 <p className="recommendation-note">
                  Based on ratings, reviews, and community signals ·{" "}
                    <span className="italic text-[#8190c5]">AI Recommends. People Decide.</span>
                </p>
              </div>
            )}

            {/* About */}
             <div className="detail-panel">
               <h2>About</h2>
               <p>
                {business.description}
              </p>
            </div>
          </div>

          {/* Right: Business info */}
           <div className="detail-column">
             <div className="detail-panel">
               <h2>
                Business info
              </h2>

               <div className="detail-info">
                {/* Hours */}
                {business.hours && business.hours.length > 0 && (
                   <div className="detail-info-block">
                     <p>
                      Hours
                    </p>
                     <div className="hours-list">
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
                   <div className="detail-info-block">
                      <p>
                      Address
                    </p>
                      <p><Icon name="map-pin" size={15} /> {business.address}</p>
                  </div>
                )}

                {/* Phone */}
                {business.phone && (
                   <div className="detail-info-block">
                      <p>
                      Phone
                    </p>
                     <a className="detail-link"
                      href={`tel:${business.phone}`}
                    >
                      {business.phone}
                    </a>
                  </div>
                )}

                {/* Website */}
                {business.website && (
                   <div className="detail-info-block">
                      <p>
                      Website
                    </p>
                     <a className="detail-link"
                      href={`https://${business.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
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
           <div className="related-section">
             <h2>
              More in {business.category}
            </h2>
             <p>
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
       <footer>
         <div>
          <Link
            to="/"
             className="brand-lockup"
          >
             <span className="brand-mark"><Icon name="compass" size={18} /></span>
            <span>Compass</span>
          </Link>
          <p>AI Recommends. People Decide.</p>
          <p>© {new Date().getFullYear()} Compass.</p>
        </div>
      </footer>
    </div>
  );
}
