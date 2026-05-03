import { Search, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "../api/client";
import { Logo } from "./Logo";

export const Topbar = ({ search, setSearch, sortBy, setSortBy }) => {
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!search.trim()) {
        setSuggestions([]);
        return;
      }
      api.get(`/songs/suggestions?q=${encodeURIComponent(search)}`).then(({ data }) => setSuggestions(data.suggestions)).catch(() => setSuggestions([]));
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  return (
    <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-center justify-between">
        <div className="lg:hidden">
          <Logo />
        </div>
        <div className="hidden lg:block">
          <p className="text-sm uppercase tracking-[0.25em] text-adivi-mint">Adivi Dashboard</p>
          <h1 className="mt-1 text-3xl font-black text-white">Music Playlist Manager</h1>
        </div>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search any song or artist"
            className="h-12 w-full rounded-lg border border-white/10 bg-white/10 pl-11 pr-4 text-sm text-white outline-none transition focus:border-adivi-green sm:w-80"
          />
          {suggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-14 z-20 overflow-hidden rounded-lg border border-white/10 bg-slate-950 shadow-2xl">
              {suggestions.map((item) => (
                <button key={item.id} onClick={() => setSearch(item.title)} className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-slate-300 hover:bg-white/10">
                  <Sparkles size={15} className="text-adivi-green" />
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <select
          value={sortBy}
          onChange={(event) => setSortBy(event.target.value)}
          className="h-12 rounded-lg border border-white/10 bg-slate-900 px-4 text-sm text-white outline-none focus:border-adivi-green"
        >
          <option value="title">Sort by song name</option>
          <option value="artist">Sort by artist</option>
          <option value="duration">Sort by duration</option>
        </select>
      </div>
    </header>
  );
};
