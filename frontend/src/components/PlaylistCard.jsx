import { motion } from "framer-motion";
import { Music, Play } from "lucide-react";
import { useMusic } from "../context/MusicContext";

export const PlaylistCard = ({ playlist, onSelect }) => {
  const { playSong } = useMusic();
  const first = playlist.songs?.[0];

  return (
    <motion.button
      type="button"
      whileHover={{ y: -5 }}
      onClick={() => onSelect?.(playlist)}
      className="glass group rounded-lg p-4 text-left transition hover:border-adivi-green/60"
    >
      <div className={`grid aspect-square place-items-center rounded-lg bg-gradient-to-br ${playlist.coverGradient || "from-adivi-green to-cyan-300"}`}>
        <Music size={42} className="text-slate-950" />
      </div>
      <div className="mt-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-black text-white">{playlist.name}</h3>
          <p className="mt-1 line-clamp-2 text-sm text-slate-400">{playlist.description || `${playlist.songCount || playlist.songs?.length || 0} songs`}</p>
        </div>
        {first && (
          <span
            onClick={(event) => {
              event.stopPropagation();
              playSong(first, playlist.songs);
            }}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-adivi-green text-slate-950 opacity-0 transition group-hover:opacity-100"
            title="Play playlist"
          >
            <Play size={17} fill="currentColor" />
          </span>
        )}
      </div>
    </motion.button>
  );
};
