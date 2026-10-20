import { createContext, useContext, useState } from "react";
import api from "./api.js";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

const stored = () => {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch {
    return null;
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(stored);

  const persist = (token, u) => {
    if (token) localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(u));
    setUser(u);
  };

  // Expects the backend to respond with { token, user }.
  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    persist(data.token, data.user);
    return data.user;
  };

  const register = async (name, email, password) => {
    const { data } = await api.post("/auth/register", { name, email, password });
    // If the backend returns a token on register, sign the user in right away.
    if (data.token && data.user) persist(data.token, data.user);
    return data;
  };

  const updateUser = (u) => persist(null, u);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}
