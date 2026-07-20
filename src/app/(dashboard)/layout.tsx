"use client";

import { useEffect, useRef } from "react";
import Sidebar from "@/components/layout/Sidebar";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

function DashboardParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const particles: { x: number; y: number; vx: number; vy: number; r: number; opacity: number }[] = [];
    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        r: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.4 + 0.1,
      });
    }

    let animId: number;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 230, 118, ${p.opacity * 0.15})`;
        ctx.fill();
      });

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 130) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(0, 230, 118, ${0.06 * (1 - dist / 130)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 right-0 w-full h-full z-0 pointer-events-none opacity-40"
      style={{ left: "270px", width: "calc(100vw - 270px)" }}
    />
  );
}

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
      <DashboardParticles />
      <main className="flex-1 lg:ml-0 pb-16 lg:pb-0 relative z-[1]">
        <div className="sticky top-0 z-30 flex items-center px-5 py-3
          bg-primary text-white border-b-2 border-accent">
          <div className="flex-1" />
          <div className="text-sm text-white/70">
            {usuario.nombre}
          </div>
        </div>
        <div className="p-4 lg:p-6 animate-fadeIn">
          {children}
        </div>
        <footer className="py-5 text-center text-sm text-muted font-medium border-t border-border mt-8">
          Desarrollado por: Gian Cruz
        </footer>
      </main>
    </div>
  );
}
