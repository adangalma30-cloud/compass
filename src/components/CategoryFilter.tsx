type CategoryFilterProps = {
  selected: string;
  onSelect: (category: string) => void;
};

const CATEGORIES = ["All", "Restaurant", "Café", "Bar", "Retail"];

function CategoryFilter({ selected, onSelect }: CategoryFilterProps) {
  return (
    <div className="filter-row">
      {CATEGORIES.map((category) => (
        <button
          key={category}
          onClick={() => onSelect(category)}
          className={`filter-pill ${selected === category ? "selected" : ""}`}
        >
          {category}
        </button>
      ))}
    </div>
  );
}

export default CategoryFilter;
