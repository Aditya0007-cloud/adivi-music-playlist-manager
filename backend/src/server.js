import dotenv from "dotenv";
import app from "./app.js";
import { connectDB, isMongoConnected } from "./config/db.js";
import Song from "./models/Song.js";
import { sampleSongs } from "./utils/sampleSongs.js";

dotenv.config();

const seedSongs = async () => {
  if (!isMongoConnected()) return;

  let inserted = 0;

  for (const song of sampleSongs) {
    const exists = await Song.findOne({ title: song.title, artist: song.artist });
    if (!exists) {
      await Song.create(song);
      inserted += 1;
    } else if (!exists.youtubeQuery) {
      exists.youtubeQuery = song.youtubeQuery;
      await exists.save();
    }
  }

  if (inserted > 0) {
    console.log(`Seeded ${inserted} new Beatify sample songs`);
  }
};

const start = async () => {
  await connectDB();
  await seedSongs();

  const port = process.env.PORT || 5001;
  app.listen(port, () => {
    console.log(`Beatify API listening on http://localhost:${port}`);
  });
};

start();
