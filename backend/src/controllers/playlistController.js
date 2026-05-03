import Playlist from "../models/Playlist.js";
import Song from "../models/Song.js";
import { isMongoConnected } from "../config/db.js";
import { arrayToLinkedList, buildSongMap } from "../utils/dsaAlgorithms.js";
import { generatePlaylistCover } from "../utils/playlistCover.js";
import { memory } from "../utils/memoryStore.js";

const shapePlaylist = (playlist, allSongs = []) => {
  const songMap = buildSongMap(allSongs);
  const playlistSongs = playlist.songs || [];
  const songs = playlistSongs
    .map((item) => item.song && typeof item.song === "object" ? item.song : songMap.get(String(item.song || item)))
    .filter(Boolean)
    .map((song) => ({ ...song, id: String(song._id || song.id) }));

  return {
    id: String(playlist._id || playlist.id),
    name: playlist.name,
    description: playlist.description,
    coverGradient: playlist.coverGradient,
    songs,
    songCount: songs.length,
    linkedListOrder: arrayToLinkedList(songs.map((song) => song.title)).toArray()
  };
};

export const listPlaylists = async (req, res) => {
  if (!isMongoConnected()) {
    const mine = memory.playlists.filter((playlist) => playlist.user === String(req.user.id));
    return res.json({ playlists: mine.map((playlist) => shapePlaylist(playlist, memory.songs)) });
  }

  const playlists = await Playlist.find({ user: req.user._id })
    .populate("songs.song")
    .sort({ updatedAt: -1 })
    .lean();
  res.json({ playlists: playlists.map((playlist) => shapePlaylist(playlist)) });
};

export const createPlaylist = async (req, res) => {
  const { name, description = "" } = req.body;

  if (!name) {
    return res.status(400).json({ message: "Playlist name is required" });
  }

  const coverGradient = generatePlaylistCover(name);

  if (!isMongoConnected()) {
    const playlist = {
      id: memory.nextPlaylistId(),
      name,
      description,
      user: String(req.user.id),
      coverGradient,
      songs: []
    };
    memory.playlists.push(playlist);
    memory.save();
    return res.status(201).json({ playlist: shapePlaylist(playlist, memory.songs) });
  }

  const playlist = await Playlist.create({
    name,
    description,
    user: req.user._id,
    coverGradient,
    songs: []
  });

  res.status(201).json({ playlist: shapePlaylist(playlist.toObject()) });
};

export const updatePlaylist = async (req, res) => {
  const { name, description = "" } = req.body;

  if (!isMongoConnected()) {
    const playlist = memory.playlists.find((item) => item.id === req.params.id && item.user === String(req.user.id));
    if (!playlist) return res.status(404).json({ message: "Playlist not found" });
    playlist.name = name || playlist.name;
    playlist.description = description;
    playlist.coverGradient = generatePlaylistCover(playlist.name);
    memory.save();
    return res.json({ playlist: shapePlaylist(playlist, memory.songs) });
  }

  const playlist = await Playlist.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { name, description, coverGradient: generatePlaylistCover(name) },
    { new: true }
  ).populate("songs.song");

  if (!playlist) return res.status(404).json({ message: "Playlist not found" });
  res.json({ playlist: shapePlaylist(playlist.toObject()) });
};

export const deletePlaylist = async (req, res) => {
  if (!isMongoConnected()) {
    const index = memory.playlists.findIndex((item) => item.id === req.params.id && item.user === String(req.user.id));
    if (index === -1) return res.status(404).json({ message: "Playlist not found" });
    memory.playlists.splice(index, 1);
    memory.save();
    return res.json({ message: "Playlist deleted" });
  }

  const deleted = await Playlist.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!deleted) return res.status(404).json({ message: "Playlist not found" });
  res.json({ message: "Playlist deleted" });
};

export const addSong = async (req, res) => {
  const { songId } = req.body;

  if (!isMongoConnected()) {
    const playlist = memory.playlists.find((item) => item.id === req.params.id && item.user === String(req.user.id));
    if (!playlist) return res.status(404).json({ message: "Playlist not found" });
    if (!memory.getSong(songId)) return res.status(404).json({ message: "Song not found" });
    if (!playlist.songs.some((item) => String(item.song) === String(songId))) {
      playlist.songs.push({ song: String(songId), addedAt: new Date() });
    }
    memory.save();
    return res.json({ playlist: shapePlaylist(playlist, memory.songs) });
  }

  const song = await Song.findById(songId);
  if (!song) return res.status(404).json({ message: "Song not found" });

  const playlist = await Playlist.findOne({ _id: req.params.id, user: req.user._id });
  if (!playlist) return res.status(404).json({ message: "Playlist not found" });

  if (!playlist.songs.some((item) => String(item.song) === String(songId))) {
    // Dynamic Array: push appends a song to the playlist array.
    playlist.songs.push({ song: songId });
    await playlist.save();
  }

  await playlist.populate("songs.song");
  res.json({ playlist: shapePlaylist(playlist.toObject()) });
};

export const removeSong = async (req, res) => {
  const { id, songId } = req.params;

  if (!isMongoConnected()) {
    const playlist = memory.playlists.find((item) => item.id === id && item.user === String(req.user.id));
    if (!playlist) return res.status(404).json({ message: "Playlist not found" });
    playlist.songs = playlist.songs.filter((item) => String(item.song) !== String(songId));
    memory.save();
    return res.json({ playlist: shapePlaylist(playlist, memory.songs) });
  }

  const playlist = await Playlist.findOne({ _id: id, user: req.user._id });
  if (!playlist) return res.status(404).json({ message: "Playlist not found" });
  playlist.songs = playlist.songs.filter((item) => String(item.song) !== String(songId));
  await playlist.save();
  await playlist.populate("songs.song");
  res.json({ playlist: shapePlaylist(playlist.toObject()) });
};

export const reorderSongs = async (req, res) => {
  const { songIds = [] } = req.body;

  if (!isMongoConnected()) {
    const playlist = memory.playlists.find((item) => item.id === req.params.id && item.user === String(req.user.id));
    if (!playlist) return res.status(404).json({ message: "Playlist not found" });
    playlist.songs = songIds.map((songId) => ({ song: String(songId), addedAt: new Date() }));
    memory.save();
    return res.json({ playlist: shapePlaylist(playlist, memory.songs), dsa: "Linked List style ordering stored as array nodes" });
  }

  const playlist = await Playlist.findOne({ _id: req.params.id, user: req.user._id });
  if (!playlist) return res.status(404).json({ message: "Playlist not found" });
  playlist.songs = songIds.map((songId) => ({ song: songId, addedAt: new Date() }));
  await playlist.save();
  await playlist.populate("songs.song");

  res.json({ playlist: shapePlaylist(playlist.toObject()), dsa: "Linked List style ordering stored as array nodes" });
};

export const trendingPlaylists = async (req, res) => {
  const songs = isMongoConnected() ? await Song.find().sort({ plays: -1 }).limit(12).lean() : memory.songs.slice(0, 12);
  const arijitSongs = isMongoConnected()
    ? await Song.find({ artist: "Arijit Singh" }).sort({ title: 1 }).lean()
    : memory.songs.filter((song) => song.artist === "Arijit Singh");

  res.json({
    playlists: [
      {
        id: "trend-arijit",
        name: "Arijit Singh Essentials",
        description: `${arijitSongs.length} romantic and soulful hits for the playlist demo`,
        coverGradient: "from-rose-400 via-fuchsia-400 to-cyan-300",
        songs: arijitSongs.map((song) => ({ ...song, id: String(song._id || song.id) }))
      },
      {
        id: "trend-1",
        name: "Beatify Top Algorithms",
        description: "Most-played DSA inspired tracks",
        coverGradient: "from-emerald-400 via-lime-300 to-cyan-400",
        songs: songs.slice(0, 6).map((song) => ({ ...song, id: String(song._id || song.id) }))
      },
      {
        id: "trend-2",
        name: "Night Coding Mix",
        description: "Focused songs for lab prep",
        coverGradient: "from-fuchsia-500 via-rose-400 to-orange-300",
        songs: songs.slice(6, 12).map((song) => ({ ...song, id: String(song._id || song.id) }))
      }
    ]
  });
};
