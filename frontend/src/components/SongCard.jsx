import { motion } from "framer-motion";
import { Heart, ListPlus, Play } from "lucide-react";
import { useMusic } from "../context/MusicContext";

const formatTime = (seconds) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

export const SongCard = ({ song, songs, isFavorite, onFavorite, onAdd }) => {
  const { playSong } = useMusic();

  return (
    <motion.article
      layout
      whileHover={{ y: -7, scale: 1.015 }}
      className="glass group rounded-lg p-3 transition hover:border-adivi-green/60 hover:shadow-glow"
    >
      <div className="relative aspect-square overflow-hidden rounded-lg">
        <img src={song.coverImage} alt={song.album} className="h-full w-full object-cover transition duration-500 group-hover:scale-110" />
        <button
          onClick={() => playSong(song, songs)}
          className="absolute bottom-3 right-3 grid h-11 w-11 place-items-center rounded-full bg-adivi-green text-slate-950 opacity-0 shadow-glow transition group-hover:opacity-100"
          title="Play"
        >
          <Play size={19} fill="currentColor" />
        </button>
      </div>
      <div className="mt-3">
        <h3 className="truncate font-bold text-white">{song.title}</h3>
        <p className="truncate text-sm text-slate-400">{song.artist}</p>
        <p className="mt-1 text-xs text-slate-500">{song.album}</p>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-adivi-mint">{formatTime(song.duration)}</span>
        <div className="flex items-center gap-2">
          <button onClick={() => onFavorite(song.id)} className={`grid h-9 w-9 place-items-center rounded-full transition ${isFavorite ? "bg-rose-500 text-white" : "bg-white/10 text-slate-300 hover:text-white"}`} title="Favorite">
            <Heart size={17} fill={isFavorite ? "currentColor" : "none"} />
          </button>
          <button onClick={() => onAdd(song)} className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-slate-300 transition hover:bg-adivi-green hover:text-slate-950" title="Add to playlist">
            <ListPlus size={17} />
          </button>
        </div>
      </div>
    </motion.article>
  );
};
