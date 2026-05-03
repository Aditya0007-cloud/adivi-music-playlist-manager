import mongoose from "mongoose";

const playlistSongSchema = new mongoose.Schema(
  {
    song: { type: mongoose.Schema.Types.ObjectId, ref: "Song", required: true },
    addedAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const playlistSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    coverGradient: { type: String, required: true },
    songs: [playlistSongSchema]
  },
  { timestamps: true }
);

export default mongoose.model("Playlist", playlistSchema);
