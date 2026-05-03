import { Home, Library, LogOut, UserRound } from "lucide-react";
import { NavLink } from "react-router-dom";

const links = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/playlists", icon: Library, label: "Lists" },
  { to: "/profile", icon: UserRound, label: "Profile" }
];

export const MobileNav = ({ onLogout }) => (
  <div className="glass fixed bottom-20 left-3 right-3 z-40 flex items-center justify-around rounded-xl p-2 lg:hidden">
    {links.map(({ to, icon: Icon, label }) => (
      <NavLink key={to} to={to} className={({ isActive }) => `grid place-items-center gap-1 rounded-lg px-4 py-2 text-xs ${isActive ? "bg-adivi-green text-slate-950" : "text-slate-300"}`}>
        <Icon size={18} />
        {label}
      </NavLink>
    ))}
    <button onClick={onLogout} className="grid place-items-center gap-1 rounded-lg px-4 py-2 text-xs text-slate-300">
      <LogOut size={18} />
      Exit
    </button>
  </div>
);
