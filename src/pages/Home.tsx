import { useRef, useState } from "react";
import { motion } from "framer-motion";

import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import PopularCategories from "../components/PopularCategories";
import FeaturedBusinesses from "../components/FeaturedBusinesses";
import SearchBar from "../components/SearchBar";
import CategoryFilter from "../components/CategoryFilter";
import BusinessCard from "../components/BusinessCard";

import businesses from "../data/businesses";

// ─── Animation helpers ────────────────────────────────────

/** Slide-up + fade-in used for most page sections. */
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
});

/** Stagger container for children. */
const staggerContainer = {
  animate: { transition: { staggerChildren: 0.07 } },
};

/** Card child variant — used by the stagger container. */
const cardVariant = {
  initial: { opacity: 0, y: 16 },
  animate:  { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } },
};

// ─── Component ────────────────────────────────────────────

type HomeProps = {
  /**
   * Set to true once the splash screen has completed.
   * Controls whether page-entry animations play.
   */
  pageReady?: boolean;
};

function Home({ pageReady = true }: HomeProps) {
  const [search, setSearch]                     = useState("");
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
      business.tags.some((t) => t.toLowerCase().includes(q));
    const matchesCategory =
      selectedCategory === "All" || business.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const isFiltering = search.trim().length > 0 || selectedCategory !== "All";

  return (
    <div className="min-h-screen">
      {/* Navbar slides down from above */}
      <Navbar animate={pageReady} />

      {/* Hero fades up */}
      <motion.div {...fadeUp(0.15)} animate={pageReady ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}>
        <Hero
          search={search}
          onSearch={setSearch}
          onScrollToResults={scrollToResults}
        />
      </motion.div>

      {/* Popular categories */}
      <motion.div {...fadeUp(0.25)} animate={pageReady ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}>
        <PopularCategories
          selected={selectedCategory}
          onSelect={setSelectedCategory}
          onScrollToResults={scrollToResults}
        />
      </motion.div>

      {/* Featured businesses */}
      <motion.div {...fadeUp(0.3)} animate={pageReady ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}>
        <FeaturedBusinesses businesses={businesses} />
      </motion.div>

      {/* Browse / results section */}
      <section ref={resultsRef} className="max-w-6xl mx-auto px-6 py-16">
        <motion.div
          {...fadeUp(0.35)}
          animate={pageReady ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight mb-1">
            {isFiltering ? "Search results" : "Browse all"}
          </h2>
          <p className="text-sm text-gray-500">
            {isFiltering
              ? "Showing businesses matching your query"
              : "Every business on Compass, sorted by rating"}
          </p>
        </motion.div>

        <motion.div
          {...fadeUp(0.4)}
          animate={pageReady ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        >
          <SearchBar
            search={search}
            setSearch={setSearch}
            resultCount={filteredBusinesses.length}
          />

          <CategoryFilter
            selected={selectedCategory}
            onSelect={setSelectedCategory}
          />
        </motion.div>

        {/* Business cards — staggered slide-up */}
        <div className="mt-6">
          {filteredBusinesses.length === 0 ? (
            <motion.div
              {...fadeUp(0.45)}
              animate={pageReady ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              className="text-center py-20"
            >
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
            </motion.div>
          ) : (
            <motion.div
              className="grid gap-3"
              variants={staggerContainer}
              initial="initial"
              animate={pageReady ? "animate" : "initial"}
            >
              {filteredBusinesses.map((business) => (
                <motion.div key={business.id} variants={cardVariant}>
                  <BusinessCard
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
                </motion.div>
              ))}
            </motion.div>
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
