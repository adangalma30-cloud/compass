import { useState } from "react";

import Navbar from "../components/Navbar";
import SearchBar from "../components/SearchBar";
import CategoryFilter from "../components/CategoryFilter";
import BusinessCard from "../components/BusinessCard";

import businesses from "../data/businesses";

function Home() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const filteredBusinesses = businesses.filter((business) => {
    const matchesSearch = business.name
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" || business.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <>
      <Navbar />

      <main className="max-w-4xl mx-auto px-6 py-10">
        <h1 className="text-4xl font-bold text-center mb-2 text-gray-900">
          Discover Local Businesses
        </h1>
        <p className="text-center text-gray-500 mb-8">
          Find trusted businesses near you.
        </p>

        <SearchBar search={search} setSearch={setSearch} />

        <div className="my-6">
          <CategoryFilter
            selected={selectedCategory}
            onSelect={setSelectedCategory}
          />
        </div>

        {filteredBusinesses.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">🔍</p>
            <p className="text-lg font-medium text-gray-500">No businesses found</p>
            <p className="text-sm mt-1">Try a different search or category</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredBusinesses.map((business) => (
              <BusinessCard
                key={business.id}
                name={business.name}
                rating={business.rating}
                reviews={business.reviews}
                city={business.city}
                tags={business.tags}
              />
            ))}
          </div>
        )}
      </main>
    </>
  );
}

export default Home;
