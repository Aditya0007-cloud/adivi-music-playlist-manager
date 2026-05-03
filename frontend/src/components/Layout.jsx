import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";
import { MusicPlayer } from "./MusicPlayer";
import { useAuth } from "../context/AuthContext";

export const Layout = ({ children }) => {
  const { logout } = useAuth();

  return (
    <div className="min-h-screen pb-36 lg:pl-72">
      <Sidebar onLogout={logout} />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      <MobileNav onLogout={logout} />
      <MusicPlayer />
    </div>
  );
};
