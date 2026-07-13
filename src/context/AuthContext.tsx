"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { ReactNode } from "react";
import type { Usuario } from "@/interfaces/usuario.interface";

interface AuthState {
  usuario: Usuario | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("asistepro_user");
    if (stored) {
      try {
        setUsuario(JSON.parse(stored));
      } catch {
        localStorage.removeItem("asistepro_user");
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      return { success: false, error: data.error || "Error de autenticacion" };
    }

    setUsuario(data.usuario);
    localStorage.setItem("asistepro_user", JSON.stringify(data.usuario));
    return { success: true };
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUsuario(null);
    localStorage.removeItem("asistepro_user");
    window.location.href = "/login";
  }, []);

  return (
    <AuthContext.Provider value={{ usuario, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
