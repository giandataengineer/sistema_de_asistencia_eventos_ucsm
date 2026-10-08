"use client";

import { useEffect } from "react";
import Sidebar from "@/components/layout/Sidebar";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { usuario, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !usuario) {
      router.replace("/login");
    }
  }, [loading, usuario, router]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-surface-alt">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!usuario) return null;

  return (
    <div className="flex min-h-screen bg-surface-alt">
      <Sidebar />
      <main className="flex-1 lg:ml-0 pb-16 lg:pb-0 relative z-[1]">
        <div className="sticky top-0 z-30 flex items-center px-5 py-3
          bg-primary text-white border-b-2 border-accent">
          <div className="flex-1" />
          <div className="text-right leading-tight">
            <p className="text-[0.65rem] uppercase tracking-[0.18em] text-accent/80 font-semibold">Administrador</p>
            <p className="text-sm font-semibold text-white">
              Congreso de la Escuela Profesional de Ingeniería Industrial
            </p>
          </div>
        </div>
        <div className="p-4 lg:p-6 animate-fadeIn">
          {children}
        </div>
        <footer className="py-6 text-center border-t border-border mt-8">
          <p className="text-xs uppercase tracking-[0.2em] text-muted">Desarrollado por</p>
          <p className="mt-1 text-2xl font-extrabold tracking-tight text-primary">
            Gian <span className="text-accent-dim">Cruz</span>
          </p>
        </footer>
      </main>
    </div>
  );
}
