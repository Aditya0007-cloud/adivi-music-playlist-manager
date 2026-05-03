import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="grid min-h-screen place-items-center text-adivi-mint">Loading Adivi...</div>;
  }

  return user ? children : <Navigate to="/login" replace />;
};
