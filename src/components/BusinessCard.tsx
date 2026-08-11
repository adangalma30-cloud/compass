import { Link } from "react-router-dom";
import type { Business } from "../types/business";
import BusinessImage from "./BusinessImage";

type BusinessCardProps = Pick<
  Business,
  "id" | "name" | "description" | "rating" | "reviews" | "city" | "category" | "tags"
> & {
  photo: Business["photo"];
  isFavorite?: boolean;
  onToggleFavorite?: (id: number) => void;
};

function BusinessCard({
  id,
  name,
  description,
  rating,
  reviews,
  city,
  category,
  tags,
  photo,
  isFavorite = false,
  onToggleFavorite,
}: BusinessCardProps) {
  return (
    <article className="business-card group">
      <Link to={`/business/${id}`} className="block group">
        <div className="business-card-inner">
          <BusinessImage
            src={photo}
            alt={`${name} storefront or interior`}
            className="business-card-image"
          />
          <div className="business-card-content">
            <div className="business-card-top">
              <div className="min-w-0">
                <span className="business-category">
                  {category}
                </span>
                <h3 className="business-name">
                  {name}
                </h3>
              </div>
              <div className="rating">
                <span>★</span><strong>{rating}</strong>
              </div>
            </div>
            <p className="business-meta">
              <span>{city}</span><span>·</span><span>{reviews.toLocaleString()} reviews</span>
            </p>
            <p className="business-description">
              {description}
            </p>
            <div className="business-tags">
              {tags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="business-tag"
                >
                  {tag}
                </span>
              ))}
              <span className="view-link">
                Details <span>→</span>
              </span>
            </div>
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

export default BusinessCard;
