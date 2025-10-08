import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";
import { type User } from "../types/user";

type AuthContextType = {
  user: User;
  setUser: (u: User) => void;
  logoutLocal: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const qc = useQueryClient();

  useEffect(() => {
    const initAuth = async () => {
      try {
        // load profile
        const res = await apiFetch("/profile");
        setUser(res.user);
      } catch {
        try {
          // refresh token if possible
          await apiFetch("/auth/refresh", { method: "POST" });
          const res = await apiFetch("/profile");
          setUser(res.user);
        } catch {
          console.log("Not logged in");
          setUser(null);
        }
      }
    };
    initAuth();
  }, []);

  const logoutLocal = () => {
    setUser(null);
    qc.clear(); // clear react-query cache on logout
  };

  return (
    <AuthContext.Provider value={{ user, setUser, logoutLocal }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
