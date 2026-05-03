import { Heart, Home, Library, LogOut, Music2, UserRound } from "lucide-react";
import { NavLink } from "react-router-dom";
import { Logo } from "./Logo";

const links = [
  { to: "/", label: "Dashboard", icon: Home },
  { to: "/playlists", label: "My Playlists", icon: Library },
  { to: "/profile", label: "Profile", icon: UserRound }
];

export const Sidebar = ({ onLogout }) => (
  <aside className="glass fixed bottom-0 left-0 top-0 z-30 hidden w-72 flex-col p-5 lg:flex">
    <Logo />
    <nav className="mt-10 space-y-2">
      {links.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold transition ${
              isActive ? "bg-adivi-green text-slate-950 shadow-glow" : "text-slate-300 hover:bg-white/10 hover:text-white"
            }`
          }
        >
          <Icon size={19} />
          {label}
        </NavLink>
      ))}
    </nav>
    <div className="mt-8 rounded-lg border border-white/10 bg-white/5 p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-bold text-white">
        <Music2 size={18} className="text-adivi-green" />
        Your Music Space
      </div>
      <p className="text-sm leading-6 text-slate-400">Create playlists, discover tracks, and keep your favorite music close.</p>
    </div>
    <div className="mt-auto">
      <div className="mb-4 flex items-center gap-2 rounded-lg bg-white/5 px-4 py-3 text-sm text-slate-300">
        <Heart size={18} className="text-rose-400" />
        Favorite songs stay saved in your profile.
      </div>
      <button onClick={onLogout} className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white">
        <LogOut size={18} />
        Logout
      </button>
    </div>
  </aside>
);
