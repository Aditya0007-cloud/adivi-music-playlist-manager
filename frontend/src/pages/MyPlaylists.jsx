import { ArrowLeft, Music2, Play, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api } from "../api/client";
import { Layout } from "../components/Layout";
import { PlaylistCard } from "../components/PlaylistCard";
import { useMusic } from "../context/MusicContext";

const formatTime = (seconds = 0) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

export default function MyPlaylists() {
  const { playSong } = useMusic();
  const [playlists, setPlaylists] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadPlaylists = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/playlists");
      setPlaylists(data.playlists);
      setSelected((current) => (current ? data.playlists.find((playlist) => playlist.id === current.id) || null : null));
    } catch {
      toast.error("Could not load playlists");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlaylists();
  }, []);

  const removeSong = async (songId) => {
    if (!selected) return;
    const { data } = await api.delete(`/playlists/${selected.id}/songs/${songId}`);
    setSelected(data.playlist);
    setPlaylists((items) => items.map((playlist) => (playlist.id === data.playlist.id ? data.playlist : playlist)));
    toast.success("Removed from playlist");
  };

  const deletePlaylist = async () => {
    if (!selected) return;
    await api.delete(`/playlists/${selected.id}`);
    setPlaylists((items) => items.filter((playlist) => playlist.id !== selected.id));
    setSelected(null);
    toast.success("Playlist deleted");
  };

  return (
    <Layout>
      <header className="mb-6">
        <p className="text-sm uppercase tracking-[0.25em] text-adivi-mint">Your Library</p>
        <h1 className="mt-2 text-3xl font-black text-white">My Playlists</h1>
      </header>

      {!selected ? (
        <>
          {loading ? (
            <div className="glass rounded-lg p-6 text-sm text-slate-400">Loading your playlists...</div>
          ) : playlists.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {playlists.map((playlist) => (
                <PlaylistCard key={playlist.id} playlist={playlist} onSelect={setSelected} />
              ))}
            </div>
          ) : (
            <div className="glass grid min-h-72 place-items-center rounded-lg p-6 text-center">
              <div>
                <Music2 className="mx-auto mb-4 text-adivi-green" size={42} />
                <h2 className="text-xl font-black text-white">No playlists yet</h2>
                <p className="mt-2 max-w-md text-sm text-slate-400">Create a playlist on the Dashboard, then add songs with the plus button on song cards.</p>
              </div>
            </div>
          )}
        </>
      ) : (
        <section className="glass rounded-lg p-5">
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <button onClick={() => setSelected(null)} className="grid h-10 w-10 place-items-center rounded-lg bg-white/10 text-slate-300 hover:text-white" title="Back to playlists">
                <ArrowLeft size={18} />
              </button>
              <div className={`grid h-16 w-16 shrink-0 place-items-center rounded-lg bg-gradient-to-br ${selected.coverGradient || "from-adivi-green to-cyan-300"}`}>
                <Music2 className="text-slate-950" size={28} />
              </div>
              <div className="min-w-0">
                <p className="text-sm uppercase tracking-[0.2em] text-adivi-mint">Saved Playlist</p>
                <h2 className="truncate text-2xl font-black text-white">{selected.name}</h2>
                <p className="truncate text-sm text-slate-400">{selected.description || `${selected.songs.length} songs saved`}</p>
              </div>
            </div>
            <div className="flex gap-2">
              {selected.songs[0] && (
                <button onClick={() => playSong(selected.songs[0], selected.songs)} className="flex h-10 items-center gap-2 rounded-lg bg-adivi-green px-4 text-sm font-black text-slate-950">
                  <Play size={16} fill="currentColor" />
                  Play
                </button>
              )}
              <button onClick={deletePlaylist} className="grid h-10 w-10 place-items-center rounded-lg bg-rose-500/15 text-rose-300 hover:bg-rose-500 hover:text-white" title="Delete playlist">
                <Trash2 size={18} />
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {selected.songs.length === 0 && <p className="rounded-lg bg-white/5 p-4 text-sm text-slate-400">This playlist is empty. Add songs from the Dashboard song cards.</p>}
            {selected.songs.map((song, index) => (
              <div key={`${song.id}-${index}`} className="grid song-row items-center gap-3 rounded-lg bg-white/5 p-3 text-sm transition hover:bg-white/10">
                <button onClick={() => playSong(song, selected.songs.slice(index + 1))} className="flex min-w-0 items-center gap-3 text-left">
                  <span className="w-6 text-center text-xs text-slate-500">{index + 1}</span>
                  <img src={song.coverImage} alt={song.album} className="h-11 w-11 rounded-md object-cover" />
                  <div className="min-w-0">
                    <p className="truncate font-bold text-white">{song.title}</p>
                    <p className="truncate text-slate-400">{song.artist}</p>
                  </div>
                </button>
                <span className="hidden truncate text-slate-400 md:block">{song.album}</span>
                <span className="hidden text-slate-400 md:block">{formatTime(song.duration)}</span>
                <div className="flex justify-end">
                  <button onClick={() => removeSong(song.id)} className="grid h-8 w-8 place-items-center rounded-full bg-white/10 text-slate-300 hover:text-white" title="Remove song">
                    <X size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </Layout>
  );
}
