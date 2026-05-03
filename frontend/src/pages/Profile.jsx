import { Heart, Mail, Music2, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "../api/client";
import { Layout } from "../components/Layout";
import { useAuth } from "../context/AuthContext";
import { useMusic } from "../context/MusicContext";

export default function Profile() {
  const { user } = useAuth();
  const { playSong } = useMusic();
  const [library, setLibrary] = useState({ favorites: [], recentlyPlayed: [] });

  useEffect(() => {
    api.get("/songs/library/me").then(({ data }) => setLibrary(data)).catch(() => {});
  }, []);

  return (
    <Layout>
      <section className="glass mb-6 rounded-lg p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="grid h-24 w-24 place-items-center rounded-lg bg-gradient-to-br from-adivi-green to-cyan-300 text-slate-950">
            <UserRound size={42} />
          </div>
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-adivi-mint">Beatify Profile</p>
            <h1 className="mt-2 text-3xl font-black text-white">{user?.name}</h1>
            <p className="mt-2 flex items-center gap-2 text-slate-400">
              <Mail size={16} /> {user?.email}
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="glass rounded-lg p-5">
          <h2 className="mb-4 flex items-center gap-2 text-xl font-black text-white">
            <Heart className="text-rose-400" /> Favorite Songs
          </h2>
          <SongList songs={library.favorites} playSong={playSong} empty="Favorite songs on the dashboard to build your personal library." />
        </section>
        <section className="glass rounded-lg p-5">
          <h2 className="mb-4 flex items-center gap-2 text-xl font-black text-white">
            <Music2 className="text-adivi-green" /> Recently Played
          </h2>
          <SongList songs={library.recentlyPlayed} playSong={playSong} empty="Play tracks and they will appear here." />
        </section>
      </div>
    </Layout>
  );
}

const SongList = ({ songs = [], playSong, empty }) => (
  <div className="space-y-2">
    {songs.map((song) => (
      <button key={song.id || song._id} onClick={() => playSong({ ...song, id: song.id || song._id }, songs)} className="flex w-full items-center gap-3 rounded-lg bg-white/5 p-3 text-left hover:bg-white/10">
        <img src={song.coverImage} alt={song.album} className="h-12 w-12 rounded-md object-cover" />
        <div className="min-w-0">
          <p className="truncate font-bold text-white">{song.title}</p>
          <p className="truncate text-sm text-slate-400">{song.artist}</p>
        </div>
      </button>
    ))}
    {songs.length === 0 && <p className="rounded-lg bg-white/5 p-4 text-sm text-slate-400">{empty}</p>}
  </div>
);
