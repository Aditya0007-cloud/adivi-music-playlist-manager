import { motion } from "framer-motion";
import { Edit3, GripVertical, Plus, Save, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { api } from "../api/client";
import { Layout } from "../components/Layout";
import { PlaylistCard } from "../components/PlaylistCard";
import { SkeletonGrid } from "../components/SkeletonGrid";
import { SongCard } from "../components/SongCard";
import { Topbar } from "../components/Topbar";
import { useAuth } from "../context/AuthContext";
import { useMusic } from "../context/MusicContext";

const formatTime = (seconds) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

export default function Dashboard() {
  const { user, setUser } = useAuth();
  const { playSong } = useMusic();
  const [songs, setSongs] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [trending, setTrending] = useState([]);
  const [library, setLibrary] = useState({ favorites: [], recentlyPlayed: [] });
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("title");
  const [loading, setLoading] = useState(true);
  const [newPlaylist, setNewPlaylist] = useState({ name: "", description: "" });
  const [editMode, setEditMode] = useState(false);
  const [dragIndex, setDragIndex] = useState(null);

  const favoriteIds = useMemo(() => new Set((user?.favorites || []).map((item) => String(item._id || item.id || item))), [user]);

  const refreshPlaylists = async () => {
    const { data } = await api.get("/playlists");
    setPlaylists(data.playlists);
    if (selected) {
      setSelected(data.playlists.find((item) => item.id === selected.id) || null);
    }
    return data.playlists;
  };

  const refreshLibrary = async () => {
    const { data } = await api.get("/songs/library/me");
    setLibrary(data);
  };

  useEffect(() => {
    setLoading(true);
    api
      .get(`/songs?search=${encodeURIComponent(search)}&sortBy=${sortBy}`)
      .then((songRes) => {
        setSongs(songRes.data.songs);
      })
      .catch(() => toast.error("Could not load songs"))
      .finally(() => setLoading(false));
  }, [search, sortBy]);

  useEffect(() => {
    Promise.all([api.get("/playlists"), api.get("/playlists/trending"), api.get("/songs/library/me")])
      .then(([playlistRes, trendRes, libraryRes]) => {
        setPlaylists(playlistRes.data.playlists);
        setTrending(trendRes.data.playlists);
        setLibrary(libraryRes.data);
      })
      .catch(() => toast.error("Could not load your library"));
  }, []);

  const createPlaylist = async (event) => {
    event.preventDefault();
    if (!newPlaylist.name.trim()) return;
    const { data } = await api.post("/playlists", newPlaylist);
    setPlaylists((items) => [data.playlist, ...items.filter((item) => item.id !== data.playlist.id)]);
    setSelected(data.playlist);
    setNewPlaylist({ name: "", description: "" });
    toast.success("Playlist created");
  };

  const ensurePlaylistAndAdd = async (song) => {
    let target = selected || playlists[0];
    if (!target) {
      const { data } = await api.post("/playlists", { name: "My Beatify Mix", description: "Auto-created playlist" });
      target = data.playlist;
      setPlaylists([target]);
    }
    const { data } = await api.post(`/playlists/${target.id}/songs`, { songId: song.id });
    const updated = await refreshPlaylists();
    setSelected(updated.find((item) => item.id === data.playlist.id));
    toast.success(`Added to ${target.name}`);
  };

  const toggleFavorite = async (songId) => {
    const { data } = await api.patch(`/songs/${songId}/favorite`);
    setUser((current) => ({ ...current, favorites: data.favorites }));
    refreshLibrary();
  };

  const removeSong = async (songId) => {
    if (!selected) return;
    const { data } = await api.delete(`/playlists/${selected.id}/songs/${songId}`);
    setSelected(data.playlist);
    await refreshPlaylists();
    toast.success("Song removed");
  };

  const updateSelected = async () => {
    const { data } = await api.put(`/playlists/${selected.id}`, {
      name: selected.name,
      description: selected.description
    });
    setSelected(data.playlist);
    await refreshPlaylists();
    setEditMode(false);
    toast.success("Playlist updated");
  };

  const deleteSelected = async () => {
    await api.delete(`/playlists/${selected.id}`);
    setSelected(null);
    await refreshPlaylists();
    toast.success("Playlist deleted");
  };

  const dropSong = async (dropIndex) => {
    if (dragIndex === null || !selected) return;
    const nextSongs = [...selected.songs];
    const [moved] = nextSongs.splice(dragIndex, 1);
    nextSongs.splice(dropIndex, 0, moved);
    const { data } = await api.patch(`/playlists/${selected.id}/reorder`, { songIds: nextSongs.map((song) => song.id) });
    setSelected(data.playlist);
    await refreshPlaylists();
    setDragIndex(null);
  };

  return (
    <Layout>
      <Topbar search={search} setSearch={setSearch} sortBy={sortBy} setSortBy={setSortBy} />

      <section className="mb-8 grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="glass overflow-hidden rounded-lg p-6">
          <p className="text-sm uppercase tracking-[0.22em] text-adivi-mint">Now in Beatify</p>
          <h2 className="mt-2 text-4xl font-black text-white">Build your perfect playlist library.</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">Search any artist, play real previews, save favorites, and organize the songs you love into custom playlists.</p>
        </div>
        <form onSubmit={createPlaylist} className="glass rounded-lg p-5">
          <h3 className="mb-4 flex items-center gap-2 font-black text-white">
            <Plus size={18} className="text-adivi-green" />
            Create Playlist
          </h3>
          <input value={newPlaylist.name} onChange={(event) => setNewPlaylist({ ...newPlaylist, name: event.target.value })} placeholder="Playlist name" className="mb-3 h-11 w-full rounded-lg border border-white/10 bg-white/10 px-3 text-sm text-white outline-none focus:border-adivi-green" />
          <input value={newPlaylist.description} onChange={(event) => setNewPlaylist({ ...newPlaylist, description: event.target.value })} placeholder="Description" className="mb-3 h-11 w-full rounded-lg border border-white/10 bg-white/10 px-3 text-sm text-white outline-none focus:border-adivi-green" />
          <button className="h-11 w-full rounded-lg bg-adivi-green font-bold text-slate-950">Create</button>
        </form>
      </section>

      <section className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-black text-white">Songs</h2>
          <span className="text-sm text-slate-400">{songs.length} tracks</span>
        </div>
        {loading ? <SkeletonGrid /> : <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">{songs.map((song) => <SongCard key={song.id} song={song} songs={songs} isFavorite={favoriteIds.has(String(song.id))} onFavorite={toggleFavorite} onAdd={ensurePlaylistAndAdd} />)}</div>}
      </section>

      <section className="mb-8 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div>
          <h2 className="mb-4 text-xl font-black text-white">Your Playlists</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {playlists.map((playlist) => <PlaylistCard key={playlist.id} playlist={playlist} onSelect={setSelected} />)}
          </div>
          {playlists.length === 0 && <p className="glass rounded-lg p-4 text-sm text-slate-400">Create a playlist above and it will appear here immediately.</p>}
        </div>

        <div className="glass rounded-lg p-5">
          {selected ? (
            <>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  {editMode ? (
                    <div className="space-y-2">
                      <input value={selected.name} onChange={(event) => setSelected({ ...selected, name: event.target.value })} className="h-10 w-full rounded-lg border border-white/10 bg-white/10 px-3 font-bold text-white outline-none focus:border-adivi-green" />
                      <input value={selected.description || ""} onChange={(event) => setSelected({ ...selected, description: event.target.value })} className="h-10 w-full rounded-lg border border-white/10 bg-white/10 px-3 text-sm text-white outline-none focus:border-adivi-green" />
                    </div>
                  ) : (
                    <>
                      <p className="text-sm uppercase tracking-[0.2em] text-adivi-mint">Saved Playlist</p>
                      <h2 className="text-2xl font-black text-white">{selected.name}</h2>
                      <p className="text-sm text-slate-400">{selected.description || "Drag songs to reorder the playlist."}</p>
                    </>
                  )}
                </div>
                <div className="flex gap-2">
                  {editMode ? (
                    <button onClick={updateSelected} className="grid h-10 w-10 place-items-center rounded-lg bg-adivi-green text-slate-950" title="Save">
                      <Save size={18} />
                    </button>
                  ) : (
                    <button onClick={() => setEditMode(true)} className="grid h-10 w-10 place-items-center rounded-lg bg-white/10 text-slate-300 hover:text-white" title="Edit">
                      <Edit3 size={18} />
                    </button>
                  )}
                  <button onClick={deleteSelected} className="grid h-10 w-10 place-items-center rounded-lg bg-rose-500/15 text-rose-300 hover:bg-rose-500 hover:text-white" title="Delete">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                {selected.songs.length === 0 && <p className="rounded-lg bg-white/5 p-4 text-sm text-slate-400">Add songs from the catalog to build this playlist.</p>}
                {selected.songs.map((song, index) => (
                  <motion.div
                    key={`${song.id}-${index}`}
                    draggable
                    onDragStart={() => setDragIndex(index)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => dropSong(index)}
                    className="grid song-row items-center gap-3 rounded-lg bg-white/5 p-3 text-sm transition hover:bg-white/10"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <GripVertical size={17} className="text-slate-500" />
                      <img src={song.coverImage} alt={song.album} className="h-11 w-11 rounded-md object-cover" />
                      <div className="min-w-0">
                        <p className="truncate font-bold text-white">{song.title}</p>
                        <p className="truncate text-slate-400">{song.artist}</p>
                      </div>
                    </div>
                    <span className="hidden truncate text-slate-400 md:block">{song.album}</span>
                    <span className="hidden text-slate-400 md:block">{formatTime(song.duration)}</span>
                    <div className="flex justify-end gap-2">
                      <button onClick={() => playSong(song, selected.songs)} className="grid h-8 w-8 place-items-center rounded-full bg-adivi-green text-slate-950">▶</button>
                      <button onClick={() => removeSong(song.id)} className="grid h-8 w-8 place-items-center rounded-full bg-white/10 text-slate-300" title="Remove">
                        <X size={16} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </>
          ) : (
            <div className="grid min-h-72 place-items-center text-center">
              <div>
                <h3 className="text-xl font-black text-white">Select a playlist</h3>
                <p className="mt-2 max-w-sm text-sm text-slate-400">Open a playlist to view, play, and manage the songs you saved.</p>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div>
          <h2 className="mb-4 text-xl font-black text-white">Trending Playlists</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {trending.map((playlist) => (
              <PlaylistCard
                key={playlist.id}
                playlist={playlist}
                onSelect={() => playlist.songs?.[0] && playSong(playlist.songs[0], playlist.songs)}
              />
            ))}
          </div>
        </div>
        <div>
          <h2 className="mb-4 text-xl font-black text-white">Recently Played Stack</h2>
          <div className="glass rounded-lg p-4">
            {(library.recentlyPlayed || []).slice(0, 6).map((song) => (
              <button key={song.id} onClick={() => playSong(song, songs)} className="flex w-full items-center gap-3 rounded-lg p-2 text-left hover:bg-white/10">
                <img src={song.coverImage} alt={song.album} className="h-10 w-10 rounded-md object-cover" />
                <span className="min-w-0 flex-1 truncate text-sm font-bold text-white">{song.title}</span>
                <span className="text-xs text-slate-400">top</span>
              </button>
            ))}
            {(!library.recentlyPlayed || library.recentlyPlayed.length === 0) && <p className="text-sm text-slate-400">Play any song and it will appear here.</p>}
          </div>
        </div>
      </section>
    </Layout>
  );
}
