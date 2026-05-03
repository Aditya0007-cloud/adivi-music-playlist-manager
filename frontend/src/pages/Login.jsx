import { motion } from "framer-motion";
import { Mail, Music2, UserRound } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { Navigate } from "react-router-dom";
import { Logo } from "../components/Logo";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { user, login, signup } = useAuth();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      await (mode === "login" ? login({ email: form.email, password: form.password }) : signup(form));
    } catch (error) {
      toast.error(error.response?.data?.message || "Authentication failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <motion.section initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} className="glass w-full max-w-md rounded-xl p-7 shadow-glow">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <h1 className="text-center text-3xl font-black text-white">Adivi</h1>
        <p className="mt-2 text-center text-sm text-slate-400">Spotify-inspired Music Playlist Manager for discovering and saving your music.</p>
        <div className="mt-7 grid grid-cols-2 rounded-lg bg-white/5 p-1">
          {["login", "signup"].map((item) => (
            <button key={item} onClick={() => setMode(item)} className={`rounded-md px-4 py-2 text-sm font-bold capitalize transition ${mode === item ? "bg-adivi-green text-slate-950" : "text-slate-300"}`}>
              {item}
            </button>
          ))}
        </div>
        <form onSubmit={submit} className="mt-6 space-y-4">
          {mode === "signup" && (
            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm text-slate-300">
                <UserRound size={16} /> Name
              </span>
              <input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="h-12 w-full rounded-lg border border-white/10 bg-white/10 px-4 text-white outline-none focus:border-adivi-green" />
            </label>
          )}
          <label className="block">
            <span className="mb-2 flex items-center gap-2 text-sm text-slate-300">
              <Mail size={16} /> Email
            </span>
            <input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="h-12 w-full rounded-lg border border-white/10 bg-white/10 px-4 text-white outline-none focus:border-adivi-green" />
          </label>
          <label className="block">
            <span className="mb-2 flex items-center gap-2 text-sm text-slate-300">
              <Music2 size={16} /> Password
            </span>
            <input required minLength={6} type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} className="h-12 w-full rounded-lg border border-white/10 bg-white/10 px-4 text-white outline-none focus:border-adivi-green" />
          </label>
          <button disabled={busy} className="h-12 w-full rounded-lg bg-adivi-green font-black text-slate-950 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60">
            {busy ? "Loading..." : mode === "login" ? "Login to Adivi" : "Create Adivi Account"}
          </button>
        </form>
      </motion.section>
    </main>
  );
}
