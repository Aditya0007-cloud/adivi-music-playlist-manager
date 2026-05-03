import express from "express";
import {
  addSong,
  createPlaylist,
  deletePlaylist,
  listPlaylists,
  removeSong,
  reorderSongs,
  trendingPlaylists,
  updatePlaylist
} from "../controllers/playlistController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/trending", trendingPlaylists);
router.use(protect);
router.get("/", listPlaylists);
router.post("/", createPlaylist);
router.put("/:id", updatePlaylist);
router.delete("/:id", deletePlaylist);
router.post("/:id/songs", addSong);
router.delete("/:id/songs/:songId", removeSong);
router.patch("/:id/reorder", reorderSongs);

export default router;
