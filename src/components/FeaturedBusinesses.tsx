import type { Business } from "../types/business";

type FeaturedCardProps = Business;

function FeaturedCard({ name, description, rating, reviews, city, category, tags, icon }: FeaturedCardProps) {
  return (
    <article className="group flex flex-col bg-white rounded-2xl border border-gray-100 overflow-hidden hover:border-indigo-100 hover:shadow-xl hover:shadow-indigo-50/80 transition-all duration-200 cursor-pointer">
      {/* Image area */}
      <div className="relative h-36 bg-gradient-to-br from-indigo-50 to-indigo-100 flex items-center justify-center">
        <span className="text-5xl">{icon}</span>
        <span className="absolute top-3 right-3 text-xs font-semibold bg-white text-indigo-600 px-2.5 py-1 rounded-full shadow-sm border border-indigo-100">
          {category}
        </span>
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-5">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-semibold text-gray-900 text-base leading-tight group-hover:text-indigo-700 transition-colors">
            {name}
          </h3>
          <div className="flex items-center gap-1 flex-shrink-0">
            <span className="text-amber-400 text-sm">★</span>
            <span className="text-sm font-semibold text-gray-900">{rating}</span>
          </div>
        </div>

        <p className="text-xs text-gray-400 mb-3">
          📍 {city} &middot; {reviews.toLocaleString()} reviews
        </p>

        <p className="text-sm text-gray-500 leading-relaxed line-clamp-3 flex-1 mb-4">
          {description}
        </p>

        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span
              key={tag}
              className="text-xs text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}

type FeaturedBusinessesProps = {
  businesses: Business[];
};

function FeaturedBusinesses({ businesses }: FeaturedBusinessesProps) {
  const featured = businesses.filter((b) => b.featured);
  if (featured.length === 0) return null;

  return (
    <section className="bg-gray-50/80 border-y border-gray-100 py-16">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
              Featured picks
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Highly rated and loved by the community
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-full">
            <span>✦</span>
            <span>AI curated</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {featured.map((business) => (
            <FeaturedCard key={business.id} {...business} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default FeaturedBusinesses;
