import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { sampleSongs } from "./sampleSongs.js";

let userCounter = 1;
let playlistCounter = 1;
let songCounter = sampleSongs.length + 1;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const storeDir = path.resolve(__dirname, "../../data");
const storeFile = path.join(storeDir, "adivi-demo-store.json");

const songs = sampleSongs.map((song, index) => ({
  ...song,
  id: String(index + 1),
  _id: String(index + 1),
  source: song.source || "Adivi"
}));

const users = new Map();
const usersByEmail = new Map();
const playlists = [];

const saveStore = () => {
  fs.mkdirSync(storeDir, { recursive: true });
  fs.writeFileSync(
    storeFile,
    JSON.stringify(
      {
        userCounter,
        playlistCounter,
        songCounter,
        users: [...users.values()],
        playlists,
        externalSongs: songs.filter((song) => song.isExternal)
      },
      null,
      2
    )
  );
};

const loadStore = () => {
  if (!fs.existsSync(storeFile)) return;

  try {
    const data = JSON.parse(fs.readFileSync(storeFile, "utf8"));
    userCounter = data.userCounter || userCounter;
    playlistCounter = data.playlistCounter || playlistCounter;
    songCounter = data.songCounter || songCounter;

    (data.externalSongs || []).forEach((song) => {
      if (!songs.some((item) => String(item.id) === String(song.id) || item.appleTrackId === song.appleTrackId)) {
        songs.push(song);
      }
    });

    (data.users || []).forEach((user) => {
      users.set(String(user.id), user);
      usersByEmail.set(String(user.email).toLowerCase(), user);
    });

    playlists.push(...(data.playlists || []));
    songCounter = Math.max(songCounter, ...songs.map((song) => Number(song.id) || 0)) + 1;
  } catch (error) {
    console.warn("Could not load Adivi demo store. Starting with an empty fallback store.");
    console.warn(error.message);
  }
};

loadStore();

export const memory = {
  songs,
  users,
  usersByEmail,
  playlists,
  save: saveStore,
  async createUser({ name, email, password }) {
    const passwordHash = await bcrypt.hash(password, 10);
    const id = String(userCounter++);
    const user = {
      id,
      _id: id,
      name,
      email: String(email).toLowerCase(),
      passwordHash,
      favorites: [],
      recentlyPlayed: []
    };
    users.set(user.id, user);
    usersByEmail.set(user.email, user);
    saveStore();
    return user;
  },
  findUserById(id) {
    return users.get(String(id));
  },
  findUserByEmail(email) {
    return usersByEmail.get(String(email).toLowerCase());
  },
  publicUser(user) {
    if (!user) return null;
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  },
  getSong(id) {
    return songs.find((song) => String(song.id) === String(id));
  },
  upsertExternalSongs(externalSongs) {
    let inserted = 0;

    externalSongs.forEach((song) => {
      const existing = songs.find(
        (item) =>
          (song.appleTrackId && item.appleTrackId === song.appleTrackId) ||
          (item.title.toLowerCase() === song.title.toLowerCase() && item.artist.toLowerCase() === song.artist.toLowerCase())
      );

      if (existing) {
        Object.assign(existing, {
          previewUrl: existing.previewUrl || song.previewUrl,
          source: existing.source || song.source,
          sourceLink: existing.sourceLink || song.sourceLink,
          appleTrackId: existing.appleTrackId || song.appleTrackId
        });
        return;
      }

      const id = String(songCounter++);
      songs.push({
        ...song,
        id,
        _id: id,
        isExternal: true
      });
      inserted += 1;
    });

    if (inserted > 0) saveStore();
    return inserted;
  },
  nextPlaylistId() {
    return String(playlistCounter++);
  }
};
