import type { Business } from "../types/business";

type BusinessCardProps = Pick<Business, "name" | "rating" | "reviews" | "city" | "tags">;

function BusinessCard({ name, rating, reviews, city, tags }: BusinessCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-lg font-semibold text-gray-900">{name}</h3>
        <div className="flex items-center gap-1 text-sm font-medium text-amber-500 shrink-0">
          ⭐ {rating}
          <span className="text-gray-400 font-normal ml-1">({reviews})</span>
        </div>
      </div>
      <p className="text-sm text-gray-500 mt-1">📍 {city}</p>
      <div className="flex flex-wrap gap-2 mt-3">
        {tags.map((tag) => (
          <span
            key={tag}
            className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

export default BusinessCard;
