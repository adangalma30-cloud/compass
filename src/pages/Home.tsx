import { useRef, useState } from "react";

import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import PopularCategories from "../components/PopularCategories";
import FeaturedBusinesses from "../components/FeaturedBusinesses";
import SearchBar from "../components/SearchBar";
import CategoryFilter from "../components/CategoryFilter";
import BusinessCard from "../components/BusinessCard";

import businesses from "../data/businesses";

function Home() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const resultsRef = useRef<HTMLDivElement>(null);

  function scrollToResults() {
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const filteredBusinesses = businesses.filter((business) => {
    const q = search.toLowerCase();
    const matchesSearch =
      business.name.toLowerCase().includes(q) ||
      business.description.toLowerCase().includes(q) ||
      business.tags.some((tag) => tag.toLowerCase().includes(q));
    const matchesCategory =
      selectedCategory === "All" || business.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const isFiltering = search.trim().length > 0 || selectedCategory !== "All";

  return (
    <div className="min-h-screen">
      <Navbar />

      <Hero
        search={search}
        onSearch={setSearch}
        onScrollToResults={scrollToResults}
      />

      <PopularCategories
        selected={selectedCategory}
        onSelect={setSelectedCategory}
        onScrollToResults={scrollToResults}
      />

      <FeaturedBusinesses businesses={businesses} />

      {/* Browse / Results section */}
      <section ref={resultsRef} className="max-w-6xl mx-auto px-6 py-16">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight mb-1">
            {isFiltering ? "Search results" : "Browse all"}
          </h2>
          <p className="text-sm text-gray-500">
            {isFiltering
              ? "Showing businesses matching your query"
              : "Every business on Compass, sorted by rating"}
          </p>
        </div>

        <SearchBar
          search={search}
          setSearch={setSearch}
          resultCount={filteredBusinesses.length}
        />

        <CategoryFilter
          selected={selectedCategory}
          onSelect={setSelectedCategory}
        />

        <div className="mt-6">
          {filteredBusinesses.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-5xl mb-4">🔍</p>
              <p className="text-lg font-semibold text-gray-700">
                No businesses found
              </p>
              <p className="text-sm text-gray-400 mt-2">
                Try adjusting your search or selecting a different category
              </p>
              <button
                onClick={() => {
                  setSearch("");
                  setSelectedCategory("All");
                }}
                className="mt-6 text-sm font-medium text-indigo-600 hover:text-indigo-700 underline-offset-2 hover:underline transition-all"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="grid gap-3">
              {filteredBusinesses.map((business) => (
                <BusinessCard
                  key={business.id}
                  id={business.id}
                  name={business.name}
                  description={business.description}
                  rating={business.rating}
                  reviews={business.reviews}
                  city={business.city}
                  category={business.category}
                  tags={business.tags}
                  icon={business.icon}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-400">
          <div className="flex items-center gap-2 font-medium text-gray-600">
            <span>🧭</span>
            <span>Compass</span>
          </div>
          <p>AI Recommends. People Decide.</p>
          <p>© {new Date().getFullYear()} Compass. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default Home;
