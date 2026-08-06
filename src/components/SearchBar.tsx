type SearchBarProps = {
  search: string;
  setSearch: (value: string) => void;
};

function SearchBar({ search, setSearch }: SearchBarProps) {
  return (
    <div className="search-box">
      <input
        type="text"
        placeholder="Search businesses..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <button>Search</button>
    </div>
  );
}

export default SearchBar;