import { Link } from "react-router-dom";
import type { Business } from "../types/business";
import BusinessImage from "./BusinessImage";

type FeaturedCardProps = Business & {
  isFavorite?: boolean;
  onToggleFavorite?: (id: string | number) => void;
};

function FeaturedCard({
  id,
  name,
  description,
  rating,
  reviews,
  city,
  category,
  tags,
  photo,
  isFavorite,
  onToggleFavorite,
}: FeaturedCardProps) {
  return (
    <article className="featured-card group">
      <Link to={`/business/${id}`} className="block h-full">
        <BusinessImage
          src={photo}
          alt={`${name} atmosphere`}
          fallbackLabel={category}
          className="featured-card-image"
        />
        <div className="absolute left-4 top-4">
          <span className="featured-category">
            {category}
          </span>
        </div>
        <div className="featured-content">
          <div className="featured-top">
            <h3 className="featured-name">
              {name}
            </h3>
            <div className="rating">
              <span>★</span><strong>{rating}</strong>
            </div>
          </div>
          <p className="business-meta">
            <span>{city}</span><span>·</span><span>{reviews.toLocaleString()} reviews</span>
          </p>
          <p className="featured-description">
            {description}
          </p>
          <div className="business-tags">
            {tags.map((tag) => (
              <span
                key={tag}
                className="business-tag"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </Link>
      {onToggleFavorite && (
        <button
          type="button"
          aria-label={isFavorite ? `Remove ${name} from saved places` : `Save ${name}`}
          aria-pressed={isFavorite}
          onClick={() => onToggleFavorite(id)}
          className={`favorite-button ${isFavorite ? "active" : ""} absolute right-3 top-3 z-10 ${
            isFavorite
              ? "border-[#d9dcff] bg-[#eef1ff] text-[#5265d0]"
              : "border-white/80 bg-white/90 text-[#7180a5] hover:border-[#d9dcff] hover:text-[#5265d0]"
          }`}
        >
          {isFavorite ? "♥" : "♡"}
        </button>
      )}
    </article>
  );
}

type FeaturedBusinessesProps = {
  businesses: Business[];
  favoriteIds?: Array<string | number>;
  onToggleFavorite?: (id: string | number) => void;
};

function FeaturedBusinesses({
  businesses,
  favoriteIds = [],
  onToggleFavorite,
}: FeaturedBusinessesProps) {
  const featured = businesses.filter((b) => b.featured);
  if (featured.length === 0) return null;

  return (
    <section className="featured-section">
      <div className="page-width">
        <div className="section-heading">
          <div>
            <p className="section-kicker">
              Community favourites
            </p>
            <h2>
              Featured picks
            </h2>
            <p>
              Highly rated and loved by the community
            </p>
          </div>
          <div className="curated-badge">
            <span className="text-[#ef6262]">●</span>
            <span>AI curated</span>
          </div>
        </div>

        <div className="featured-grid">
          {featured.map((business) => (
            <FeaturedCard
              key={business.id}
              {...business}
              isFavorite={favoriteIds.includes(business.id)}
              onToggleFavorite={onToggleFavorite}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export default FeaturedBusinesses;
