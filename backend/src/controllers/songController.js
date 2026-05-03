import Song from "../models/Song.js";
import User from "../models/User.js";
import { isMongoConnected } from "../config/db.js";
import { binarySearchByTitle, linearSongSearch, pushRecentStack, sortSongs } from "../utils/dsaAlgorithms.js";
import { memory } from "../utils/memoryStore.js";

const previewCache = new Map();

const normalizeSong = (song) => ({
  ...song,
  id: String(song._id || song.id)
});

const appleResultToSong = (item) => {
  const artwork = item.artworkUrl100
    ? item.artworkUrl100.replace("100x100bb", "600x600bb")
    : "https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=600&q=80";

  return {
    title: item.trackName || item.collectionName || "Unknown Track",
    artist: item.artistName || "Unknown Artist",
    album: item.collectionName || "Apple Music",
    duration: Math.max(1, Math.round((item.trackTimeMillis || 30000) / 1000)),
    coverImage: artwork,
    audioUrl: item.previewUrl || "",
    previewUrl: item.previewUrl || "",
    mood: item.primaryGenreName || "Apple Music",
    plays: 0,
    source: "Apple Music",
    sourceLink: item.trackViewUrl || item.collectionViewUrl || "",
    appleTrackId: item.trackId,
    youtubeQuery: `${item.trackName || ""} ${item.artistName || ""} official song`.trim()
  };
};

const searchAppleSongs = async (query, limit = 12) => {
  if (!query || query.trim().length < 2) return [];

  const response = await fetch(
    `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=${limit}&country=IN`
  );
  const data = await response.json();
  return (data.results || []).filter((item) => item.kind === "song" && item.previewUrl).map(appleResultToSong);
};

const importAppleSongs = async (query) => {
  const externalSongs = await searchAppleSongs(query);
  if (externalSongs.length === 0) return 0;

  if (!isMongoConnected()) {
    return memory.upsertExternalSongs(externalSongs);
  }

  let inserted = 0;
  for (const song of externalSongs) {
    const existing = await Song.findOne({
      $or: [
        { appleTrackId: song.appleTrackId },
        { title: song.title, artist: song.artist }
      ]
    });

    if (existing) {
      if (!existing.previewUrl && song.previewUrl) {
        existing.previewUrl = song.previewUrl;
        existing.audioUrl = existing.audioUrl || song.previewUrl;
        existing.source = existing.source || song.source;
        existing.sourceLink = existing.sourceLink || song.sourceLink;
        existing.appleTrackId = existing.appleTrackId || song.appleTrackId;
        await existing.save();
      }
      continue;
    }

    await Song.create(song);
    inserted += 1;
  }

  return inserted;
};

const getAllSongs = async () => {
  if (!isMongoConnected()) return memory.songs;
  const songs = await Song.find().sort({ createdAt: 1 }).lean();
  return songs.map(normalizeSong);
};

const getSongById = async (id) => {
  if (!isMongoConnected()) return memory.getSong(id);
  const song = await Song.findById(id).lean();
  return song ? normalizeSong(song) : null;
};

const resolveItunesPreview = async (song) => {
  const response = await fetch(
    `https://itunes.apple.com/search?term=${encodeURIComponent(`${song.title} ${song.artist}`)}&entity=song&limit=8&country=IN`
  );
  const data = await response.json();
  const title = song.title.toLowerCase();
  const artist = song.artist.toLowerCase();
  const match =
    data.results?.find((item) => item.previewUrl && item.trackName?.toLowerCase().includes(title) && item.artistName?.toLowerCase().includes(artist)) ||
    data.results?.find((item) => item.previewUrl && item.trackName?.toLowerCase().includes(title)) ||
    data.results?.find((item) => item.previewUrl);

  if (!match?.previewUrl) return null;

  return {
    previewUrl: match.previewUrl,
    source: "Apple Music",
    sourceTitle: match.trackName,
    sourceArtist: match.artistName,
    sourceAlbum: match.collectionName,
    sourceLink: match.trackViewUrl
  };
};

const resolveDeezerPreview = async (song) => {
  const query = `${song.title} ${song.artist}`;
  const response = await fetch(`https://api.deezer.com/search?q=${encodeURIComponent(query)}&limit=5`);
  const data = await response.json();
  const title = song.title.toLowerCase();
  const artist = song.artist.toLowerCase();
  const match =
    data.data?.find((item) => item.preview && item.title?.toLowerCase().includes(title) && item.artist?.name?.toLowerCase().includes(artist)) ||
    data.data?.find((item) => item.preview && item.title?.toLowerCase().includes(title)) ||
    data.data?.find((item) => item.preview);

  if (!match?.preview) return null;

  return {
    previewUrl: match.preview,
    source: "Deezer",
    sourceTitle: match.title,
    sourceArtist: match.artist?.name,
    sourceAlbum: match.album?.title,
    sourceLink: match.link
  };
};

export const listSongs = async (req, res) => {
  const { search = "", sortBy = "title" } = req.query;
  let imported = 0;

  if (search.trim().length >= 2) {
    try {
      imported = await importAppleSongs(search.trim());
    } catch (error) {
      console.warn("Apple catalog search failed:", error.message);
    }
  }

  let songs = await getAllSongs();

  if (search) {
    songs = linearSongSearch(songs, search);
  }

  songs = sortSongs(songs, sortBy);
  res.json({ songs, count: songs.length, imported, dsa: "Array storage + Linear Search + Sorting + Apple catalog import" });
};

export const suggestions = async (req, res) => {
  const { q = "" } = req.query;
  if (q.trim().length >= 3) {
    try {
      await importAppleSongs(q.trim());
    } catch (error) {
      console.warn("Apple suggestion import failed:", error.message);
    }
  }

  const songs = linearSongSearch(await getAllSongs(), q).slice(0, 6);
  res.json({
    suggestions: songs.map((song) => ({
      id: song.id,
      label: `${song.title} - ${song.artist}`,
      title: song.title
    }))
  });
};

export const binarySearchSong = async (req, res) => {
  const { title = "" } = req.query;
  const result = binarySearchByTitle(await getAllSongs(), title);
  res.json({ ...result, dsa: "Binary Search on title-sorted song array" });
};

export const resolvePreview = async (req, res) => {
  const song = await getSongById(req.params.id);
  if (!song) return res.status(404).json({ message: "Song not found" });

  const cacheKey = `${song.title}-${song.artist}`;
  if (song.previewUrl) {
    return res.json({
      previewUrl: song.previewUrl,
      source: song.source || "Apple Music",
      sourceTitle: song.title,
      sourceArtist: song.artist,
      sourceAlbum: song.album,
      sourceLink: song.sourceLink || ""
    });
  }

  if (previewCache.has(cacheKey)) {
    return res.json({ ...previewCache.get(cacheKey), cached: true });
  }

  try {
    const result = (await resolveItunesPreview(song)) || (await resolveDeezerPreview(song));

    if (!result) {
      return res.status(404).json({ message: "No original preview found for this song" });
    }

    previewCache.set(cacheKey, result);
    res.json(result);
  } catch (error) {
    res.status(502).json({ message: "Could not reach preview services", error: error.message });
  }
};

export const playSong = async (req, res) => {
  const songId = req.params.id;

  if (!isMongoConnected()) {
    const user = memory.findUserById(req.user.id);
    user.recentlyPlayed = pushRecentStack(user.recentlyPlayed, songId);
    memory.save();
    const song = memory.getSong(songId);
    res.json({ recentlyPlayed: user.recentlyPlayed, song });
    return;
  }

  await Song.findByIdAndUpdate(songId, { $inc: { plays: 1 } });
  const user = await User.findById(req.user._id);

  // Stack: recently played uses push at the top. The newest song is first.
  user.recentlyPlayed = pushRecentStack(user.recentlyPlayed, songId).map((item) => ({
    song: item.song,
    playedAt: item.playedAt
  }));
  await user.save();
  await user.populate("recentlyPlayed.song");

  res.json({ recentlyPlayed: user.recentlyPlayed });
};

export const toggleFavorite = async (req, res) => {
  const songId = String(req.params.id);

  if (!isMongoConnected()) {
    const user = memory.findUserById(req.user.id);
    const favoriteSet = new Set(user.favorites.map(String));
    favoriteSet.has(songId) ? favoriteSet.delete(songId) : favoriteSet.add(songId);
    user.favorites = [...favoriteSet];
    memory.save();
    res.json({ favorites: user.favorites });
    return;
  }

  const user = await User.findById(req.user._id);
  const favoriteSet = new Set(user.favorites.map(String));
  favoriteSet.has(songId) ? favoriteSet.delete(songId) : favoriteSet.add(songId);
  user.favorites = [...favoriteSet];
  await user.save();

  res.json({ favorites: user.favorites });
};

export const myLibrary = async (req, res) => {
  if (!isMongoConnected()) {
    const user = memory.findUserById(req.user.id);
    const favoriteSet = new Set(user.favorites.map(String));
    const recentlyIds = user.recentlyPlayed.map((item) => String(item.song || item.songId));
    res.json({
      favorites: memory.songs.filter((song) => favoriteSet.has(String(song.id))),
      recentlyPlayed: recentlyIds.map((id) => memory.getSong(id)).filter(Boolean)
    });
    return;
  }

  const user = await User.findById(req.user._id).populate("favorites").populate("recentlyPlayed.song");
  res.json({
    favorites: user.favorites,
    recentlyPlayed: user.recentlyPlayed.map((item) => item.song).filter(Boolean)
  });
};
