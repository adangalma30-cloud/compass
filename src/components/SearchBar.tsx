type SearchBarProps = {
  search: string;
  setSearch: (value: string) => void;
  resultCount: number;
};

function SearchBar({ search, setSearch, resultCount }: SearchBarProps) {
  return (
    <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
      <div className="relative w-full max-w-md flex-1">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-[#7f8aa6]">
          ⌕
        </span>
        <input
          type="text"
          placeholder="Filter results..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-[#dfe4f0] bg-white py-3 pl-10 pr-4 text-sm text-[#182445] placeholder-[#9aa4bc] shadow-sm transition focus:border-[#7080df] focus:outline-none focus:ring-4 focus:ring-[#7080df]/10"
        />
      </div>
      <p className="shrink-0 text-sm text-[#8a94ad]">
        {resultCount} {resultCount === 1 ? "result" : "results"}
      </p>
    </div>
  );
}

export default SearchBar;
