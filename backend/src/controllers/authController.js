import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { isMongoConnected } from "../config/db.js";
import { memory } from "../utils/memoryStore.js";

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET || "adivi-lab-secret", {
    expiresIn: "7d"
  });

const toPublicUser = (user) => ({
  id: String(user._id || user.id),
  name: user.name,
  email: user.email,
  favorites: user.favorites || [],
  recentlyPlayed: user.recentlyPlayed || []
});

export const signup = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "Name, email, and password are required" });
  }

  const normalizedEmail = email.toLowerCase();
  const existing = isMongoConnected()
    ? await User.findOne({ email: normalizedEmail })
    : memory.findUserByEmail(normalizedEmail);

  if (existing) {
    return res.status(409).json({ message: "Email already registered" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = isMongoConnected()
    ? await User.create({ name, email: normalizedEmail, passwordHash })
    : await memory.createUser({ name, email: normalizedEmail, password });

  res.status(201).json({
    token: signToken(String(user._id || user.id)),
    user: toPublicUser(user)
  });
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  const user = isMongoConnected()
    ? await User.findOne({ email: String(email).toLowerCase() })
    : memory.findUserByEmail(String(email).toLowerCase());

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  res.json({
    token: signToken(String(user._id || user.id)),
    user: toPublicUser(user)
  });
};

export const me = async (req, res) => {
  const user = isMongoConnected()
    ? await User.findById(req.user._id).populate("favorites").populate("recentlyPlayed.song")
    : req.user;

  res.json({ user: toPublicUser(user) });
};
