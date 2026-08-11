import type { FormEvent } from "react";
import Icon from "./Icon";

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
    <section className="hero">
      <div className="hero-orb hero-orb-one" />
      <div className="hero-orb hero-orb-two" />
      <div className="hero-inner">
        <div className="hero-kicker"><span className="status-dot" /> AI-powered local discovery</div>
        <h1 className="hero-title">Find. <span>Compare.</span><br />Decide.</h1>
        <p className="hero-copy">A smarter way to find places you’ll actually want to visit.</p>
        <form onSubmit={handleSubmit} className="hero-search">
          <Icon name="search" size={20} />
          <input type="text" value={search} onChange={(e) => onSearch(e.target.value)} placeholder="What are you looking for?" aria-label="Search for a place" />
          <button type="submit" aria-label="Search"><Icon name="arrow-right" size={19} /></button>
        </form>
        <div className="suggested-row" aria-label="Suggested searches">
          {SUGGESTED_PROMPTS.map((prompt) => (
            <button key={prompt} onClick={() => handlePromptClick(prompt)}>{prompt}</button>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Hero;
