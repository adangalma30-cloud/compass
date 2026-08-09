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
    <article className="group relative overflow-hidden rounded-[1.35rem] border border-[#e5eaf5] bg-white shadow-[0_8px_24px_rgba(28,45,88,0.06)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#cfd9f5] hover:shadow-[0_16px_34px_rgba(28,45,88,0.12)] active:scale-[0.99]">
      <Link to={`/business/${id}`} className="block group">
        <div className="flex flex-col sm:flex-row">
          <BusinessImage
            src={photo}
            alt={`${name} storefront or interior`}
            className="h-48 w-full shrink-0 sm:h-auto sm:min-h-[12rem] sm:w-52"
          />
          <div className="min-w-0 flex-1 p-4 sm:p-5">
            <div className="flex items-start justify-between gap-10">
              <div className="min-w-0">
                <span className="mb-2 inline-flex rounded-full bg-[#eef1ff] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#4f5fc5]">
                  {category}
                </span>
                <h3 className="truncate text-base font-bold leading-tight text-[#111b3a] transition-colors group-hover:text-[#4c5ec7]">
                  {name}
                </h3>
              </div>
              <div className="flex shrink-0 items-center gap-1 rounded-lg bg-[#fff8e8] px-2 py-1">
                <span className="text-sm text-[#edaa2c]">★</span>
                <span className="text-sm font-bold text-[#17213f]">{rating}</span>
              </div>
            </div>
            <p className="mt-2 text-xs font-medium text-[#7883a1]">
              {city} <span className="mx-1 text-[#c5cbe0]">·</span> {reviews.toLocaleString()} reviews
            </p>
            <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-[#5e6a88]">
              {description}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-1.5">
              {tags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-[#f5f6fb] px-2.5 py-1 text-[11px] font-medium text-[#77829e]"
                >
                  {tag}
                </span>
              ))}
              <span className="ml-auto text-sm font-semibold text-[#5365cf] transition-transform group-hover:translate-x-0.5">
                View →
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
          className={`absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full border text-xl shadow-sm transition-all ${
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
