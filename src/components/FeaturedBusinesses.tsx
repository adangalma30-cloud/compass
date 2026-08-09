import { Link } from "react-router-dom";
import type { Business } from "../types/business";
import BusinessImage from "./BusinessImage";

type FeaturedCardProps = Business & {
  isFavorite?: boolean;
  onToggleFavorite?: (id: number) => void;
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
    <article className="group relative flex h-full flex-col overflow-hidden rounded-[1.35rem] border border-[#e5eaf5] bg-white shadow-[0_10px_28px_rgba(28,45,88,0.07)] transition-all duration-300 hover:-translate-y-1 hover:border-[#cfd9f5] hover:shadow-[0_20px_42px_rgba(28,45,88,0.14)] active:scale-[0.99]">
      <Link to={`/business/${id}`} className="block h-full">
        <BusinessImage
          src={photo}
          alt={`${name} atmosphere`}
          fallbackLabel={category}
          className="aspect-[1.45] h-auto w-full sm:aspect-[1.55]"
        />
        <div className="absolute left-4 top-4">
          <span className="rounded-full border border-white/25 bg-[#07122d]/55 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white backdrop-blur-md">
            {category}
          </span>
        </div>
        <div className="flex flex-1 flex-col p-5">
          <div className="mb-1 flex items-start justify-between gap-2">
            <h3 className="pr-8 text-base font-bold leading-tight text-[#111b3a] transition-colors group-hover:text-[#4c5ec7]">
              {name}
            </h3>
            <div className="flex shrink-0 items-center gap-1 rounded-lg bg-[#fff8e8] px-2 py-1">
              <span className="text-sm text-[#edaa2c]">★</span>
              <span className="text-sm font-bold text-[#17213f]">{rating}</span>
            </div>
          </div>
          <p className="mb-3 text-xs font-medium text-[#7883a1]">
            {city} <span className="mx-1 text-[#c5cbe0]">·</span> {reviews.toLocaleString()} reviews
          </p>
          <p className="mb-4 line-clamp-3 flex-1 text-sm leading-relaxed text-[#5e6a88]">
            {description}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-[#f5f6fb] px-2.5 py-1 text-[11px] font-medium text-[#77829e]"
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

type FeaturedBusinessesProps = {
  businesses: Business[];
  favoriteIds?: number[];
  onToggleFavorite?: (id: number) => void;
};

function FeaturedBusinesses({
  businesses,
  favoriteIds = [],
  onToggleFavorite,
}: FeaturedBusinessesProps) {
  const featured = businesses.filter((b) => b.featured);
  if (featured.length === 0) return null;

  return (
    <section className="border-y border-[#e2e7f3] bg-[#f4f6fb] py-12 sm:py-16">
      <div className="mx-auto max-w-6xl px-5 sm:px-6">
        <div className="mb-7 flex items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.22em] text-[#6673cc]">
              Community favourites
            </p>
            <h2 className="text-2xl font-bold tracking-tight text-[#111b3a]">
              Featured picks
            </h2>
            <p className="mt-1 text-sm text-[#697694]">
              Highly rated and loved by the community
            </p>
          </div>
          <div className="hidden items-center gap-1.5 rounded-full border border-[#d9def5] bg-white px-3 py-1.5 text-xs font-semibold text-[#5968c5] shadow-sm sm:flex">
            <span className="text-[#ef6262]">●</span>
            <span>AI curated</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
