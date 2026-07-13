"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useRef } from "react";
import { History, LogOut, ScanBarcode } from "lucide-react";

const NAV_ITEMS = [
  { href: "/registro", label: "Registrar Asistencia", icon: ScanBarcode },
  { href: "/historial", label: "Historial", icon: History },
];

function SidebarParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.parentElement?.clientWidth || 270;
      canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const particles: { x: number; y: number; vx: number; vy: number; r: number; opacity: number }[] = [];
    for (let i = 0; i < 30; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.2,
        r: Math.random() * 1.5 + 0.3,
        opacity: Math.random() * 0.3 + 0.1,
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
        ctx.fillStyle = `rgba(0, 230, 118, ${p.opacity * 0.8})`;
        ctx.fill();
      });

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(0, 230, 118, ${0.4 * (1 - dist / 100)})`;
            ctx.lineWidth = 1;
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
      className="absolute inset-0 w-full h-full pointer-events-none"
    />
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const { logout, usuario } = useAuth();

  return (
    <>
      <nav className="hidden lg:flex flex-col w-[270px] bg-primary-deep text-white
        border-r border-accent/[0.08] h-screen sticky top-0 overflow-hidden">
        <SidebarParticles />
        <div className="px-5 py-5 border-b border-accent/10 bg-black/15 relative z-[1]">
          <div className="flex items-center gap-3">
            <Image
              src="/img/logo-ucsm.png"
              alt="UCSM"
              width={44}
              height={44}
              className="rounded-full flex-shrink-0"
              style={{ filter: "brightness(1.2) drop-shadow(0 2px 8px rgba(0, 230, 118, 0.25))" }}
            />
            <div>
              <span className="block font-bold text-[0.9rem] tracking-[-0.01em]">Universidad</span>
              <span className="block text-[0.72rem] text-accent/60 leading-tight">
                Catolica de Santa Maria
              </span>
            </div>
          </div>
        </div>

        {usuario?.eventoNombre && (
          <div className="px-4 py-3 border-b border-white/[0.04] relative z-[1]">
            <p className="text-[0.65rem] text-accent/50 uppercase tracking-[0.08em] font-medium leading-relaxed">
              {usuario.eventoNombre}
            </p>
          </div>
        )}

        <div className="flex-1 py-2 relative z-[1]">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-5 py-3 text-sm font-medium
                  transition-all ${
                    active
                      ? "bg-accent/10 text-accent border-r-2 border-accent"
                      : "text-white/70 hover:bg-accent/[0.06] hover:text-white"
                  }`}
              >
                <item.icon className={`w-5 h-5 ${active ? "text-accent" : "text-accent/50"}`} />
                {item.label}
              </Link>
            );
          })}
        </div>

        {usuario && (
          <div className="px-5 py-3 border-t border-white/5 text-xs text-white/40 relative z-[1]">
            {usuario.nombre}
          </div>
        )}

        <div className="px-5 pb-4 pt-1 text-center animate-float pointer-events-none relative z-[1]">
          <p className="text-[0.7rem] text-white/40 uppercase tracking-[0.15em] leading-relaxed">
            Desarrollado por :<br/>
            <span className="animate-shine-green font-bold tracking-widest text-[0.85rem] drop-shadow-[0_0_10px_rgba(0,230,118,0.7)]">Gian Cruz</span>
          </p>
        </div>

        <button
          onClick={logout}
          className="flex items-center gap-3 px-5 py-3 text-sm text-white/60
            hover:bg-red-500/10 hover:text-red-400 transition-colors border-t border-white/5 relative z-[1]"
        >
          <LogOut className="w-5 h-5 text-red-400/50" />
          Cerrar Sesion
        </button>
      </nav>

      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-primary-deep border-t border-accent/10 flex">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-[0.65rem]
                font-medium transition-colors ${active ? "text-accent" : "text-white/50"}`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
        <button
          onClick={logout}
          className="flex-1 flex flex-col items-center gap-1 py-2.5 text-[0.65rem] text-white/50 font-medium"
        >
          <LogOut className="w-5 h-5" />
          Salir
        </button>
      </nav>
    </>
  );
}
