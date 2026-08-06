import type { FormEvent } from "react";

const SUGGESTED_PROMPTS = [
  "Best coffee shops with wifi ☕",
  "Highly rated restaurants nearby 🍽️",
  "Unique local bookshops 📚",
  "Craft cocktail bars 🍸",
];

type HeroProps = {
  search: string;
  onSearch: (value: string) => void;
  onScrollToResults: () => void;
};

function Hero({ search, onSearch, onScrollToResults }: HeroProps) {
  function handlePromptClick(prompt: string) {
    // Strip the trailing emoji for a cleaner search query
    const clean = prompt.replace(/\s[\u{1F300}-\u{1FFFF}]$/u, "").trim();
    onSearch(clean);
    onScrollToResults();
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (search.trim()) onScrollToResults();
  }

  return (
    <section className="relative overflow-hidden bg-slate-950 text-white">
      {/* Subtle radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(99,102,241,0.18) 0%, transparent 70%)",
        }}
      />

      {/* Grid texture */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative max-w-4xl mx-auto px-6 py-24 md:py-32 text-center">
        {/* Badge */}
        <div className="animate-fade-in inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-xs font-medium text-indigo-300 mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
          AI-powered local discovery
        </div>

        {/* Headline */}
        <h1 className="animate-fade-up text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.05] mb-5">
          <span className="text-white">Find.</span>{" "}
          <span className="text-gradient">Compare.</span>{" "}
          <span className="text-white">Decide.</span>
        </h1>

        {/* Sub-headline */}
        <p className="animate-fade-up-delay-1 text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          Compass uses AI to surface the businesses that matter — so you spend
          less time searching and more time experiencing.
        </p>

        {/* AI Search */}
        <form
          onSubmit={handleSubmit}
          className="animate-fade-up-delay-2 relative max-w-2xl mx-auto"
        >
          <div className="ai-search-glow flex items-center bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl overflow-hidden transition-all focus-within:bg-white/15 focus-within:border-indigo-400/60">
            {/* Sparkle icon */}
            <span className="flex-shrink-0 pl-5 text-indigo-400 text-lg select-none">
              ✦
            </span>

            <input
              type="text"
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              placeholder='Try "best coffee with wifi in Seattle"…'
              className="flex-1 bg-transparent px-4 py-5 text-white placeholder-slate-500 text-base focus:outline-none"
            />

            <button
              type="submit"
              className="flex-shrink-0 m-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-sm font-semibold rounded-xl transition-all"
            >
              Search
            </button>
          </div>
        </form>

        {/* Suggested prompts */}
        <div className="animate-fade-up-delay-3 flex flex-wrap justify-center gap-2 mt-5">
          {SUGGESTED_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              onClick={() => handlePromptClick(prompt)}
              className="text-xs text-slate-400 border border-white/10 hover:border-indigo-400/50 hover:text-indigo-300 bg-white/5 hover:bg-white/10 rounded-full px-4 py-2 transition-all"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Hero;
