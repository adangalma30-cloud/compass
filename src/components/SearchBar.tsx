type SearchBarProps = {
  search: string;
  setSearch: (value: string) => void;
  resultCount: number;
};

function SearchBar({ search, setSearch, resultCount }: SearchBarProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div className="relative flex-1 max-w-md">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-sm">
          🔍
        </span>
        <input
          type="text"
          placeholder="Filter results..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
        />
      </div>
      <p className="text-sm text-gray-400 shrink-0">
        {resultCount} {resultCount === 1 ? "result" : "results"}
      </p>
    </div>
  );
}

export default SearchBar;
