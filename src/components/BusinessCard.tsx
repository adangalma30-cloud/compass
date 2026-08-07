import { Link } from "react-router-dom";
import type { Business } from "../types/business";

type BusinessCardProps = Pick<
  Business,
  "id" | "name" | "description" | "rating" | "reviews" | "city" | "category" | "tags" | "icon"
> & {
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
  icon,
  isFavorite = false,
  onToggleFavorite,
}: BusinessCardProps) {
  return (
    <article className="relative bg-white rounded-2xl border border-gray-100 p-5 group-hover:border-indigo-100 group-hover:shadow-lg group-hover:shadow-indigo-50/80 transition-all duration-200">
      <Link to={`/business/${id}`} className="block group">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-2xl">
            {icon}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-10 mb-1">
              <h3 className="font-semibold text-gray-900 text-base leading-tight group-hover:text-indigo-700 transition-colors truncate">
                {name}
              </h3>
              <div className="flex items-center gap-1 flex-shrink-0">
                <span className="text-amber-400 text-sm">★</span>
                <span className="text-sm font-semibold text-gray-900">{rating}</span>
              </div>
            </div>

            <p className="text-xs text-gray-400 mb-2">
              {city} &middot; {reviews.toLocaleString()} reviews
            </p>

            <p className="text-sm text-gray-500 leading-relaxed line-clamp-2 mb-3">
              {description}
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-full">
                {category}
              </span>
              {tags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="text-xs text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Arrow */}
          <span className="flex-shrink-0 text-gray-300 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all text-lg self-center">
            →
          </span>
        </div>
      </Link>
      {onToggleFavorite && (
        <button
          type="button"
          aria-label={isFavorite ? `Remove ${name} from saved places` : `Save ${name}`}
          aria-pressed={isFavorite}
          onClick={() => onToggleFavorite(id)}
          className={`absolute right-4 top-4 z-10 h-8 w-8 rounded-full border text-lg transition-all ${
            isFavorite
              ? "border-indigo-100 bg-indigo-50 text-indigo-600"
              : "border-gray-100 bg-white text-gray-300 hover:border-indigo-100 hover:text-indigo-500"
          }`}
        >
          {isFavorite ? "♥" : "♡"}
        </button>
      )}
    </article>
  );
}

export default BusinessCard;
