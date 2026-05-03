import { createContext, useContext, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { api } from "../api/client";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("adivi_token");
    if (!token) {
      setLoading(false);
      return;
    }

    api
      .get("/auth/me")
      .then(({ data }) => setUser(data.user))
      .catch(() => {
        localStorage.removeItem("adivi_token");
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const authenticate = async (mode, payload) => {
    const { data } = await api.post(`/auth/${mode}`, payload);
    localStorage.setItem("adivi_token", data.token);
    setUser(data.user);
    toast.success("Back in the mix");
  };

  const signupOnly = async (payload) => {
    await api.post("/auth/signup", payload);
    localStorage.removeItem("adivi_token");
    setUser(null);
    toast.success("Account created. Please login to continue.");
  };

  const logout = () => {
    localStorage.removeItem("adivi_token");
    setUser(null);
    toast.success("Logged out");
  };

  const value = useMemo(
    () => ({ user, setUser, loading, login: (payload) => authenticate("login", payload), signup: signupOnly, logout }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
