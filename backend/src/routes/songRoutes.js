import express from "express";
import { binarySearchSong, listSongs, myLibrary, playSong, resolvePreview, suggestions, toggleFavorite } from "../controllers/songController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", listSongs);
router.get("/suggestions", suggestions);
router.get("/binary-search", binarySearchSong);
router.get("/library/me", protect, myLibrary);
router.get("/:id/preview", resolvePreview);
router.post("/:id/play", protect, playSong);
router.patch("/:id/favorite", protect, toggleFavorite);

export default router;
