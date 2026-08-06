type Category = {
  label: string;
  icon: string;
  color: string;
  bg: string;
};

const CATEGORIES: Category[] = [
  { label: "Restaurant", icon: "🍽️", color: "text-orange-600", bg: "bg-orange-50 hover:bg-orange-100 border-orange-100 hover:border-orange-200" },
  { label: "Café",       icon: "☕",  color: "text-amber-600",  bg: "bg-amber-50 hover:bg-amber-100 border-amber-100 hover:border-amber-200" },
  { label: "Bar",        icon: "🍸",  color: "text-purple-600", bg: "bg-purple-50 hover:bg-purple-100 border-purple-100 hover:border-purple-200" },
  { label: "Retail",     icon: "🛍️",  color: "text-teal-600",   bg: "bg-teal-50 hover:bg-teal-100 border-teal-100 hover:border-teal-200" },
];

type PopularCategoriesProps = {
  selected: string;
  onSelect: (category: string) => void;
  onScrollToResults: () => void;
};

function PopularCategories({ selected, onSelect, onScrollToResults }: PopularCategoriesProps) {
  function handleClick(label: string) {
    onSelect(label === selected ? "All" : label);
    onScrollToResults();
  }

  return (
    <section className="max-w-6xl mx-auto px-6 py-16">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
            Popular categories
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Browse by what you're looking for
          </p>
        </div>
        <button
          onClick={() => { onSelect("All"); onScrollToResults(); }}
          className="text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
        >
          View all →
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {CATEGORIES.map(({ label, icon, color, bg }) => {
          const isActive = selected === label;
          return (
            <button
              key={label}
              onClick={() => handleClick(label)}
              className={`group flex flex-col items-center gap-3 p-6 rounded-2xl border transition-all ${
                isActive
                  ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200 scale-[1.02]"
                  : `${bg} border`
              }`}
            >
              <span className="text-3xl">{icon}</span>
              <span
                className={`text-sm font-semibold ${
                  isActive ? "text-white" : color
                }`}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export default PopularCategories;
