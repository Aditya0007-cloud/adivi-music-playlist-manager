import { ExternalLink, Heart, Loader2, Pause, Play, SkipBack, SkipForward, Volume2 } from "lucide-react";
import { useMusic } from "../context/MusicContext";
import { getYoutubeSearchUrl } from "../utils/youtubePlayer";

const formatTime = (seconds = 0) => {
  if (!Number.isFinite(seconds)) return "0:00";
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
};

export const MusicPlayer = () => {
  const {
    currentSong,
    isPlaying,
    progress,
    currentTime,
    duration,
    volume,
    loadingPreview,
    sourceInfo,
    togglePlay,
    next,
    previous,
    changeVolume,
    seekTo
  } = useMusic();

  return (
    <footer className="glass fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 px-4 py-3 lg:left-72">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-3 md:grid-cols-[1fr_1.2fr_1fr]">
        <div className="flex min-w-0 items-center gap-3">
          {currentSong ? (
            <img src={currentSong.coverImage} alt={currentSong.album} className="h-14 w-14 rounded-lg object-cover" />
          ) : (
            <div className="grid h-14 w-14 place-items-center rounded-lg bg-white/10 text-adivi-green">
              <Heart size={20} />
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate font-bold text-white">{currentSong?.title || "Adivi Player"}</p>
            <p className="truncate text-sm text-slate-400">{currentSong?.artist || "Pick a track to begin"}</p>
          </div>
        </div>
        <div>
          <div className="flex items-center justify-center gap-4">
            <button onClick={previous} className="text-slate-300 transition hover:text-white" title="Previous">
              <SkipBack size={20} />
            </button>
            <button onClick={togglePlay} className="grid h-11 w-11 place-items-center rounded-full bg-white text-slate-950 transition hover:scale-105" title="Play or pause">
              {loadingPreview ? <Loader2 size={20} className="animate-spin" /> : isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
            </button>
            <button onClick={next} className="text-slate-300 transition hover:text-white" title="Next">
              <SkipForward size={20} />
            </button>
          </div>
          <div className="mt-3 grid grid-cols-[42px_1fr_42px] items-center gap-3">
            <span className="text-right text-xs tabular-nums text-slate-500">{formatTime(currentTime)}</span>
            <div className="relative h-5">
              <div className="pointer-events-none absolute left-0 right-0 top-1/2 h-1.5 -translate-y-1/2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-gradient-to-r from-adivi-green to-cyan-300 transition-all" style={{ width: `${progress}%` }} />
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="0.1"
                value={Number.isFinite(progress) ? progress : 0}
                disabled={!currentSong || loadingPreview}
                onChange={(event) => seekTo(event.target.value)}
                className="absolute inset-0 h-5 w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
                title="Seek song"
              />
            </div>
            <span className="text-xs tabular-nums text-slate-500">{formatTime(duration)}</span>
          </div>
        </div>
        <div className="hidden items-center justify-end gap-3 md:flex">
          <div className="min-w-0 text-right">
            <p className="truncate text-xs font-bold text-adivi-mint">{sourceInfo?.source ? `${sourceInfo.source} preview` : "Original preview"}</p>
            <p className="truncate text-xs text-slate-500">{sourceInfo?.sourceTitle || "30 second legal audio"}</p>
          </div>
          <Volume2 size={18} className="text-slate-400" />
          <input type="range" min="0" max="1" step="0.01" value={volume} onChange={(event) => changeVolume(event.target.value)} className="w-28 accent-adivi-green" />
          {currentSong && (
            <a
              href={getYoutubeSearchUrl(currentSong)}
              target="_blank"
              rel="noreferrer"
              className="grid h-10 w-10 place-items-center rounded-lg bg-white/10 text-slate-300 transition hover:bg-red-500 hover:text-white"
              title="Open on YouTube"
            >
              <ExternalLink size={17} />
            </a>
          )}
        </div>
      </div>
    </footer>
  );
};
