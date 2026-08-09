import type { FormEvent } from "react";

const SUGGESTED_PROMPTS = [
  "Best coffee shops with wifi",
  "Highly rated restaurants nearby",
  "Unique local bookshops",
  "Craft cocktail bars",
];

type HeroProps = {
  search: string;
  onSearch: (value: string) => void;
  onScrollToResults: () => void;
};

function Hero({ search, onSearch, onScrollToResults }: HeroProps) {
  function handlePromptClick(prompt: string) {
    onSearch(prompt);
    onScrollToResults();
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (search.trim()) onScrollToResults();
  }

  return (
    <section className="relative overflow-hidden bg-[#07132f] text-white">
      {/* Subtle radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(91,102,224,0.32) 0%, transparent 70%)",
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

      <div className="relative mx-auto max-w-4xl px-4 py-14 text-center sm:px-6 sm:py-20 md:py-24">
        {/* Badge */}
        <div className="animate-fade-in mb-5 inline-flex max-w-full items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-[11px] font-medium text-[#aeb8ff] backdrop-blur-sm sm:mb-7 sm:px-4 sm:text-xs">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#f06464]" />
          AI-powered local discovery
        </div>

        {/* Headline */}
        <h1 className="animate-fade-up mb-4 text-[2.15rem] font-extrabold leading-[1.04] tracking-tight sm:mb-5 sm:text-5xl md:text-6xl lg:text-7xl">
          <span className="text-white">Find.</span>{" "}
          <span className="text-gradient">Compare.</span>{" "}
          <span className="text-white">Decide.</span>
        </h1>

        {/* Sub-headline */}
        <p className="animate-fade-up-delay-1 mx-auto mb-7 max-w-2xl text-sm leading-relaxed text-[#aab4cf] sm:mb-9 sm:text-lg md:text-xl">
          Compass uses AI to surface the businesses that matter — so you spend
          less time searching and more time experiencing.
        </p>

        {/* AI Search */}
        <form
          onSubmit={handleSubmit}
          className="animate-fade-up-delay-2 relative mx-auto max-w-2xl"
        >
          <div className="ai-search-glow flex min-h-[3.75rem] items-center overflow-hidden rounded-2xl border border-white/20 bg-white/10 backdrop-blur-sm transition-all focus-within:border-[#8490ff]/80 focus-within:bg-white/15 sm:min-h-[4.25rem]">
            {/* Sparkle icon */}
              <span className="flex-shrink-0 pl-4 text-lg text-[#9da8ff] select-none sm:pl-5">
              +
            </span>

            <input
              type="text"
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              placeholder='Try "best coffee with wifi in Seattle"…'
              className="min-w-0 flex-1 bg-transparent px-2.5 py-4 text-sm text-white placeholder-[#7783a7] focus:outline-none sm:px-4 sm:py-5 sm:text-base"
            />

            <button
              type="submit"
              className="m-1.5 shrink-0 rounded-xl bg-[#5b68da] px-3.5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#6e7bf0] active:scale-95 sm:m-2 sm:px-5 sm:py-3"
            >
              Search
            </button>
          </div>
        </form>

        {/* Suggested prompts */}
        <div className="animate-fade-up-delay-3 mx-auto mt-4 flex max-w-3xl flex-wrap justify-center gap-2 sm:mt-5">
          {SUGGESTED_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              onClick={() => handlePromptClick(prompt)}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[11px] leading-tight text-[#a2acc6] transition-all hover:border-[#8490ff]/50 hover:bg-white/10 hover:text-white sm:px-4 sm:text-xs"
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
