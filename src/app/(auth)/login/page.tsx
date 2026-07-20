"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const { login, usuario } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (usuario) router.replace("/registro");
  }, [usuario, router]);

  useEffect(() => {
    fetch("/api/health").catch(() => {});
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const particles: { x: number; y: number; vx: number; vy: number; r: number; opacity: number }[] = [];
    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        r: Math.random() * 2.5 + 0.5,
        opacity: Math.random() * 0.5 + 0.2,
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
        ctx.fillStyle = `rgba(0, 230, 118, ${p.opacity * 0.3})`;
        ctx.fill();
      });

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(0, 230, 118, ${0.12 * (1 - dist / 150)})`;
            ctx.lineWidth = 0.6;
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await login(username, password);
    setLoading(false);
    if (result.success) {
      router.replace("/registro");
    } else {
      setError(result.error || "Error de autenticacion");
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-bg-dark">
      <canvas ref={canvasRef} className="absolute inset-0 z-0" />

      <div
        className="relative z-10 w-[440px] max-w-[92vw] text-center
          rounded-[20px] p-[3rem_2.5rem]"
        style={{
          background: "rgba(24, 59, 42, 0.45)",
          backdropFilter: "blur(24px) saturate(1.4)",
          WebkitBackdropFilter: "blur(24px) saturate(1.4)",
          border: "1px solid rgba(0, 230, 118, 0.15)",
          boxShadow: "0 12px 48px rgba(14, 36, 25, 0.14), 0 0 30px rgba(0, 230, 118, 0.1)",
        }}
      >
        <div className="mb-5">
          <Image
            src="/img/logo-ucsm.png"
            alt="Universidad Catolica de Santa Maria"
            width={90}
            height={90}
            className="mx-auto mb-4 rounded-full"
            style={{ filter: "drop-shadow(0 4px 16px rgba(0, 230, 118, 0.3))" }}
            priority
          />
          <h1 className="text-[1.4rem] font-bold text-white leading-tight tracking-tight">
            Universidad{" "}
            <span className="text-accent">Catolica</span> de{"\n"}
            <br />
            Santa Maria
          </h1>
        </div>

        <h2 className="text-[0.78rem] text-white/50 mb-7 font-medium tracking-[0.06em] uppercase leading-relaxed px-4">
          IV Seminario Internacional de
          <br />
          Costos y Gestion de Operaciones
        </h2>

        <form onSubmit={handleSubmit}>
          <div
            className="flex items-center gap-3 rounded-xl px-4 py-[0.85rem] mb-4 transition-all
              focus-within:shadow-[0_0_0_3px_rgba(0,230,118,0.1)]"
            style={{
              background: "rgba(255, 255, 255, 0.07)",
              border: "1.5px solid rgba(0, 230, 118, 0.15)",
            }}
          >
            <svg className="w-5 h-5 text-white/40 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0" />
            </svg>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Usuario"
              className="flex-1 bg-transparent border-none outline-none text-white
                placeholder:text-white/35 font-[inherit] text-base"
              autoComplete="username"
            />
          </div>

          <div
            className="flex items-center gap-3 rounded-xl px-4 py-[0.85rem] mb-6 transition-all
              focus-within:shadow-[0_0_0_3px_rgba(0,230,118,0.1)]"
            style={{
              background: "rgba(255, 255, 255, 0.07)",
              border: "1.5px solid rgba(0, 230, 118, 0.15)",
            }}
          >
            <svg className="w-5 h-5 text-white/40 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contrasena"
              className="flex-1 bg-transparent border-none outline-none text-white
                placeholder:text-white/35 font-[inherit] text-base"
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-white/40 hover:text-accent transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading || !username || !password}
            className="w-full py-[0.95rem] rounded-xl font-bold text-base
              bg-gradient-to-br from-accent-dim to-accent text-primary-deep
              tracking-[0.02em] uppercase transition-all cursor-pointer
              hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,230,118,0.35)]
              hover:brightness-105 active:translate-y-0
              disabled:opacity-50 disabled:cursor-not-allowed
              disabled:hover:translate-y-0 disabled:hover:shadow-none
              flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
                </svg>
                Iniciar Sesion
              </>
            )}
          </button>
        </form>

        {error && (
          <div className="mt-3 text-[0.85rem] text-red-400 bg-red-500/10 px-3 py-2 rounded-lg">
            {error}
          </div>
        )}

        <div className="mt-6 text-center">
          <p className="text-sm text-white/40 tracking-wide font-medium">
            Desarrollado por: Gian Cruz
          </p>
        </div>
      </div>
    </div>
  );
}
