import { useState } from "react";

import Navbar from "../components/Navbar";
import SearchBar from "../components/SearchBar";
import CategoryFilter from "../components/CategoryFilter";
import BusinessCard from "../components/BusinessCard";

import businesses from "../data/businesses";

function Home() {
  const [search, setSearch] = useState("");

  const filteredBusinesses = businesses.filter((business) =>
    business.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <Navbar />

      <main className="max-w-6xl mx-auto px-6 py-10">

        <h1 className="text-4xl font-bold text-center mb-2">
          Discover Local Businesses
        </h1>

        <p className="text-center text-gray-500 mb-8">
          Find trusted businesses near you.
        </p>

        <SearchBar
          search={search}
          setSearch={setSearch}
        />

        <div className="my-8">
          <CategoryFilter />
        </div>

        <div className="grid gap-6">
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

      </main>
    </>
  );
}

export default Home;