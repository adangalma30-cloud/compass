import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Geolocation } from "@capacitor/geolocation";

import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import PopularCategories from "../components/PopularCategories";
import FeaturedBusinesses from "../components/FeaturedBusinesses";
import SearchBar from "../components/SearchBar";
import CategoryFilter from "../components/CategoryFilter";
import BusinessCard from "../components/BusinessCard";
import { useFavorites } from "../hooks/useFavorites";
import businesses from "../data/businesses";
import { api } from "../lib/api";
import AuthPrompt from "../components/AuthPrompt";
import { useAuthState } from "../lib/authState";

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
  // Shared auth state: the same source the navbar and profile read.
  const { isLoaded: authLoaded, isSignedIn, isVerified } = useAuthState();
  const [search, setSearch]                     = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedCity, setSelectedCity]         = useState("All cities");
  const [sortBy, setSortBy]                     = useState("recommended");
  const [showSaved, setShowSaved]               = useState(false);
  const [businessesFromApi, setBusinessesFromApi] = useState(businesses);
  const [dataSource, setDataSource] = useState<"preview" | "live">("preview");
  const [liveDiscoveryConfigured, setLiveDiscoveryConfigured] = useState(false);
  const [loadingBusinesses, setLoadingBusinesses] = useState(true);
  const [businessError, setBusinessError] = useState("");
  const { favoriteIds, toggleFavorite, isFavorite, favoriteError } = useFavorites(
    isSignedIn,
    isVerified,
  );
  const [authPrompt, setAuthPrompt] = useState<"save" | "search" | "location" | "verify" | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationMessage, setLocationMessage] = useState("");

  const resultsRef = useRef<HTMLDivElement>(null);

  function scrollToResults() {
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const cities = useMemo(
    () => [
      "All cities",
      ...Array.from(new Set(businessesFromApi.map((business) => business.city))),
    ],
    [businessesFromApi],
  );

  useEffect(() => {
    if (!authLoaded) return;
    let cancelled = false;
    api
      .getBusinesses({
        query: isSignedIn ? search : undefined,
        category: isSignedIn ? selectedCategory : undefined,
        city: isSignedIn ? selectedCity : undefined,
        limit: isSignedIn ? 100 : 4,
      })
      .then((response) => {
        if (cancelled) return;
        setBusinessError("");
        if (response.businesses.length > 0) setBusinessesFromApi(response.businesses);
        setDataSource(response.source);
        setLiveDiscoveryConfigured(response.liveDiscoveryConfigured);
      })
      .catch(() => {
        if (!cancelled) setBusinessError("We couldn't load Compass right now.");
      })
      .finally(() => {
        if (!cancelled) setLoadingBusinesses(false);
      });
    return () => {
      cancelled = true;
    };
  }, [authLoaded, isSignedIn, search, selectedCategory, selectedCity]);

  function handleFavorite(id: string | number) {
    if (!isSignedIn) {
      setAuthPrompt("save");
      return;
    }
    if (!isVerified) {
      setAuthPrompt("verify");
      return;
    }
    void toggleFavorite(id);
  }

  async function handleLocationRequest() {
    if (!isSignedIn) {
      setAuthPrompt("location");
      return;
    }
    if (!isVerified) {
      setAuthPrompt("verify");
      return;
    }
    setLocationLoading(true);
    setLocationMessage("");
    try {
      const permission = await Geolocation.requestPermissions();
      if (permission.location !== "granted") {
        setLocationMessage("Location permission is needed for nearby discovery. You can try again whenever you’re ready.");
        return;
      }
      const position = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 12000 });
      const response = await api.getBusinesses({
        nearby: true,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        limit: 100,
      });
      setBusinessesFromApi(response.businesses);
      setDataSource(response.source);
      setLiveDiscoveryConfigured(response.liveDiscoveryConfigured);
      setSearch("");
      setSelectedCategory("All");
      setSelectedCity("All cities");
      setLocationMessage(
        response.source === "live"
          ? "Showing live places near your current location."
          : "Live location discovery is not configured yet, so Compass is showing preview listings.",
      );
      window.setTimeout(scrollToResults, 0);
    } catch {
      setLocationMessage("Compass couldn't access your location. Check that location services are enabled and try again.");
    } finally {
      setLocationLoading(false);
    }
  }

  const filteredBusinesses = useMemo(() => {
    const q = search.toLowerCase().trim();
    const results = businessesFromApi.filter((business) => {
      const matchesSearch =
        business.name.toLowerCase().includes(q) ||
        business.description.toLowerCase().includes(q) ||
        business.city.toLowerCase().includes(q) ||
        business.tags.some((t) => t.toLowerCase().includes(q));
      const matchesCategory =
        selectedCategory === "All" || business.category === selectedCategory;
      const matchesCity =
        selectedCity === "All cities" || business.city === selectedCity;
      const matchesSaved = !showSaved || favoriteIds.includes(String(business.id));
      return matchesSearch && matchesCategory && matchesCity && matchesSaved;
    });

    return [...results].sort((a, b) => {
      if (sortBy === "rating") return b.rating - a.rating || b.reviews - a.reviews;
      if (sortBy === "reviews") return b.reviews - a.reviews;
      if (sortBy === "name") return a.name.localeCompare(b.name);
      return Number(b.featured) - Number(a.featured) || b.rating - a.rating;
    });
  }, [businessesFromApi, favoriteIds, search, selectedCategory, selectedCity, showSaved, sortBy]);

  const isFiltering =
    search.trim().length > 0 ||
    selectedCategory !== "All" ||
    selectedCity !== "All cities" ||
    showSaved;

  function showSavedPlaces() {
    if (!isSignedIn) return;
    setShowSaved(true);
    setSelectedCategory("All");
    setSelectedCity("All cities");
    setSearch("");
    window.setTimeout(scrollToResults, 0);
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#fbfcff]">
      {/* Navbar slides down from above */}
      <Navbar
        animate={pageReady}
        savedCount={favoriteIds.length}
        onSavedClick={showSavedPlaces}
      />

      {/* Hero fades up */}
      <motion.div {...fadeUp(0.15)} animate={pageReady ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}>
        <Hero
          search={search}
          onSearch={setSearch}
          onScrollToResults={scrollToResults}
          onSearchRequest={() => {
            if (!isSignedIn) {
              setAuthPrompt("search");
              return false;
            }
            if (!isVerified) {
              setAuthPrompt("verify");
              return false;
            }
            return true;
          }}
          onLocationRequest={() => void handleLocationRequest()}
          locationLoading={locationLoading}
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
          <FeaturedBusinesses
          businesses={businessesFromApi}
          favoriteIds={favoriteIds}
          onToggleFavorite={handleFavorite}
        />
      </motion.div>

      {/* Browse / results section */}
      <section id="discover" ref={resultsRef} className="mx-auto max-w-6xl scroll-mt-16 px-4 py-12 sm:px-6 sm:py-16">
        <motion.div
          {...fadeUp(0.35)}
          animate={pageReady ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          className="mb-8"
        >
          <h2 className="mb-1 text-2xl font-bold tracking-tight text-[#111b3a]">
            {isFiltering ? "Search results" : "Browse all"}
          </h2>
          <p className="text-sm text-[#697694]">
            {loadingBusinesses
              ? "Loading current Compass discovery…"
              : businessError
                ? businessError
                : dataSource === "preview"
                  ? isSignedIn && !liveDiscoveryConfigured
                    ? "Preview listings are available while live discovery is configured"
                    : "A limited preview of Compass discovery"
                  : isFiltering
              ? "Showing businesses matching your query"
              : "Live businesses discovered through Compass"}
          </p>
          {favoriteError && <p className="mt-2 text-xs font-semibold text-[#c85a67]">{favoriteError}</p>}
          {locationMessage && <p className="mt-2 text-xs font-semibold text-[#5365d1]">{locationMessage}</p>}
          {authPrompt && (
            <AuthPrompt
              title={
                authPrompt === "save"
                  ? "Save your next place"
                  : authPrompt === "location"
                    ? "Unlock nearby discovery"
                    : authPrompt === "verify"
                      ? "Verify your email first"
                      : "Sign in for full search"
              }
              message={
                authPrompt === "verify"
                  ? "A verified account unlocks saved places, live search, and location-aware discovery."
                  : "Create a free Compass account to unlock this feature."
              }
              needsVerification={authPrompt === "verify"}
              onDismiss={() => setAuthPrompt(null)}
            />
          )}
          {isSignedIn && !liveDiscoveryConfigured && (
            <p className="mt-2 text-xs text-[#7d88a4]">
              Live search and location discovery need the server-side Google Places integration.
            </p>
          )}
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

          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
            <label className="flex-1">
              <span className="sr-only">City</span>
              <select
                value={selectedCity}
                onChange={(event) => {
                  setSelectedCity(event.target.value);
                  setShowSaved(false);
                }}
                className="w-full rounded-xl border border-[#dfe4f0] bg-white px-3 py-3 text-sm text-[#65718e] shadow-sm focus:border-[#7080df] focus:outline-none focus:ring-4 focus:ring-[#7080df]/10"
              >
                {cities.map((city) => <option key={city}>{city}</option>)}
              </select>
            </label>
            <label className="flex-1">
              <span className="sr-only">Sort results</span>
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
                className="w-full rounded-xl border border-[#dfe4f0] bg-white px-3 py-3 text-sm text-[#65718e] shadow-sm focus:border-[#7080df] focus:outline-none focus:ring-4 focus:ring-[#7080df]/10"
              >
                <option value="recommended">Sort: Recommended</option>
                <option value="rating">Sort: Highest rated</option>
                <option value="reviews">Sort: Most reviewed</option>
                <option value="name">Sort: Name</option>
              </select>
            </label>
            {favoriteIds.length > 0 && (
              <button
                type="button"
                onClick={() => setShowSaved((current) => !current)}
                className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors ${
                  showSaved
                     ? "border-[#5365d1] bg-[#5365d1] text-white"
                     : "border-[#dfe4f0] bg-white text-[#65718e] hover:border-[#aab5ed] hover:text-[#5365d1]"
                }`}
              >
                {showSaved ? "Showing saved" : "Saved places"}
              </button>
            )}
          </div>

          <CategoryFilter
            selected={selectedCategory}
            onSelect={setSelectedCategory}
          />
        </motion.div>

        {/* Business cards — staggered slide-up */}
        <div className="mt-6">
          {loadingBusinesses ? (
            <div className="grid gap-3" aria-label="Loading businesses">
              {Array.from({ length: 3 }, (_, index) => (
                <div key={index} className="h-36 animate-pulse rounded-2xl bg-[#eef1f7]" />
              ))}
            </div>
          ) : businessError ? (
            <div className="rounded-2xl border border-[#f0d9dc] bg-[#fff8f8] px-6 py-12 text-center">
              <p className="text-lg font-semibold text-[#6d3540]">We couldn't load Compass right now.</p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="mt-4 rounded-xl bg-[#5365d1] px-5 py-3 text-sm font-semibold text-white"
              >
                Try again
              </button>
            </div>
          ) : filteredBusinesses.length === 0 ? (
            <motion.div
              {...fadeUp(0.45)}
              animate={pageReady ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              className="text-center py-20"
            >
              <p className="mb-4 text-5xl text-[#5365d1]">⌕</p>
              <p className="text-lg font-semibold text-[#1a2544]">
                No businesses found
              </p>
              <p className="mt-2 text-sm text-[#7d88a4]">
                Try adjusting your search or selecting a different category
              </p>
              <button
                onClick={() => {
                  setSearch("");
                  setSelectedCategory("All");
                  setSelectedCity("All cities");
                  setShowSaved(false);
                }}
                 className="mt-6 text-sm font-semibold text-[#5365d1] underline-offset-2 transition-all hover:text-[#394aaa] hover:underline"
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
                    photo={business.photo}
                    isFavorite={isFavorite(business.id)}
                    onToggleFavorite={handleFavorite}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#e4e8f2] bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-10 text-sm text-[#8a94ad] sm:flex-row sm:px-6">
          <div className="flex items-center gap-2 font-semibold text-[#52618c]">
            <span className="text-[#5365d1]">+</span>
            <span>Compass</span>
          </div>
          <p id="about">AI Recommends. People Decide.</p>
          <p>© {new Date().getFullYear()} Compass. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default Home;
