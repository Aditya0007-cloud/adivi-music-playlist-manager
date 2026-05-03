import mongoose from "mongoose";

const songSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    artist: { type: String, required: true, trim: true },
    album: { type: String, required: true, trim: true },
    duration: { type: Number, required: true },
    coverImage: { type: String, required: true },
    audioUrl: { type: String, required: true },
    previewUrl: { type: String, default: "" },
    source: { type: String, default: "Adivi" },
    sourceLink: { type: String, default: "" },
    appleTrackId: { type: Number, index: true, sparse: true },
    youtubeQuery: { type: String, default: "" },
    mood: { type: String, default: "Focus" },
    plays: { type: Number, default: 0 }
  },
  { timestamps: true }
);

export default mongoose.model("Song", songSchema);
