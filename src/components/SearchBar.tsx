import Icon from "./Icon";

type SearchBarProps = {
  search: string;
  setSearch: (value: string) => void;
  resultCount: number;
};

function SearchBar({ search, setSearch, resultCount }: SearchBarProps) {
  return (
    <div className="results-search">
      <div className="results-input">
        <Icon name="search" size={18} />
        <input
          type="text"
          placeholder="Filter results..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="results-input-field"
        />
      </div>
      <p className="results-count">
        {resultCount} {resultCount === 1 ? "result" : "results"}
      </p>
    </div>
  );
}

export default SearchBar;
