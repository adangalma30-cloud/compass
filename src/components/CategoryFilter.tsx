type CategoryFilterProps = {
  selected: string;
  onSelect: (category: string) => void;
};

const CATEGORIES = ["All", "Restaurant", "Café", "Bar", "Retail"];

function CategoryFilter({ selected, onSelect }: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {CATEGORIES.map((category) => (
        <button
          key={category}
          onClick={() => onSelect(category)}
          className={`px-4 py-2 rounded-full border text-sm font-medium transition-all ${
            selected === category
              ? "border-[#5365d1] bg-[#5365d1] text-white shadow-[0_6px_14px_rgba(83,101,209,0.2)]"
              : "border-[#dfe4f0] bg-white text-[#65718e] hover:border-[#aab5ed] hover:text-[#5365d1]"
          }`}
        >
          {category}
        </button>
      ))}
    </div>
  );
}

export default CategoryFilter;
