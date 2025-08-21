import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem("admintoken") || null);

  const login = (newToken) => {
    localStorage.setItem("admintoken", newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem("admintoken");
    setToken(null);
  };

  const value = { token, login, logout, isAuthed: !!token };

  // (Optional) react to storage changes across tabs
  useEffect(() => {
    const handler = () => setToken(localStorage.getItem("admintoken"));
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
