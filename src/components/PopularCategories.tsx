type Category = {
  label: string;
  icon: string;
  color: string;
  bg: string;
};

const CATEGORIES: Category[] = [
  { label: "Restaurant", icon: "R", color: "text-[#d66a52]", bg: "bg-[#fff2ed] hover:bg-[#ffe9e1] border-[#f8d9ce] hover:border-[#efb7a8]" },
  { label: "Café",       icon: "C", color: "text-[#b58331]", bg: "bg-[#fff8e5] hover:bg-[#fff1c8] border-[#f2e1b3] hover:border-[#e6ca7c]" },
  { label: "Bar",        icon: "B", color: "text-[#7661c8]", bg: "bg-[#f2efff] hover:bg-[#e9e4ff] border-[#ded6fa] hover:border-[#c3b7ef]" },
  { label: "Retail",     icon: "S", color: "text-[#3f9690]", bg: "bg-[#eaf8f6] hover:bg-[#dcf2ef] border-[#cde9e5] hover:border-[#9fd5cf]" },
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
    <section className="mx-auto max-w-6xl px-5 py-14 sm:px-6 sm:py-16">
      <div className="mb-7 flex items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.22em] text-[#6673cc]">
            Explore the city
          </p>
          <h2 className="text-2xl font-bold tracking-tight text-[#111b3a]">
            Popular categories
          </h2>
          <p className="mt-1 text-sm text-[#697694]">
            Browse by what you're looking for
          </p>
        </div>
        <button
          onClick={() => { onSelect("All"); onScrollToResults(); }}
          className="text-sm font-semibold text-[#5365d1] transition-colors hover:text-[#394aaa]"
        >
          View all →
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {CATEGORIES.map(({ label, icon, color, bg }) => {
          const isActive = selected === label;
          return (
            <button
              key={label}
              onClick={() => handleClick(label)}
              className={`group flex flex-col items-center gap-3 rounded-2xl border p-5 transition-all sm:p-6 ${
                isActive
                   ? "scale-[1.02] border-[#5365d1] bg-[#5365d1] text-white shadow-lg shadow-[#b9c1f0]"
                  : `${bg} border`
              }`}
            >
              <span className={`flex h-11 w-11 items-center justify-center rounded-full bg-white/75 text-sm font-extrabold tracking-[0.12em] shadow-sm ${isActive ? "bg-white/15 text-white" : color}`}>{icon}</span>
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
