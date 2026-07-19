"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  Users,
  TrendingUp,
  Clock,
  UserCheck,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Database,
  Loader2,
  LogIn,
  LogOut,
  Award,
} from "lucide-react";

interface KPIs {
  totalRegistros: number;
  totalEntradas: number;
  totalSalidas: number;
  asistentesUnicos: number;
  participantes: number;
  organizadores: number;
  tasaRetencion: number;
}

interface DiaDistribucion {
  dia: number;
  entradas: number;
  salidas: number;
  total: number;
}

interface SesionDistribucion {
  sesion: number;
  total: number;
}

interface HoraDistribucion {
  hora: number;
  total: number;
}

interface DiaSesionDistribucion {
  dia: number;
  sesion: number;
  total: number;
}

interface TopAsistente {
  dni: string;
  apellido: string;
  nombres: string;
  etiqueta: string;
  registros: number;
}

interface UltimoRegistro {
  numeroDni: string;
  apellidoPaterno: string;
  nombres: string;
  tipo: string;
  etiqueta: string;
  fechaRegistro: string;
  dia: number;
  sesion: number;
}

interface AnalyticsData {
  kpis: KPIs;
  distribucionPorDia: DiaDistribucion[];
  distribucionPorSesion: SesionDistribucion[];
  distribucionPorHora: HoraDistribucion[];
  distribucionPorDiaSesion: DiaSesionDistribucion[];
  topAsistentes: TopAsistente[];
  ultimosRegistros: UltimoRegistro[];
}

const COLORS = {
  emerald: { bar: "bg-emerald-500", bg: "bg-emerald-50", text: "text-emerald-600", ring: "ring-emerald-500/20" },
  cyan: { bar: "bg-cyan-500", bg: "bg-cyan-50", text: "text-cyan-600", ring: "ring-cyan-500/20" },
  rose: { bar: "bg-rose-500", bg: "bg-rose-50", text: "text-rose-600", ring: "ring-rose-500/20" },
  violet: { bar: "bg-violet-500", bg: "bg-violet-50", text: "text-violet-600", ring: "ring-violet-500/20" },
  amber: { bar: "bg-amber-500", bg: "bg-amber-50", text: "text-amber-600", ring: "ring-amber-500/20" },
  blue: { bar: "bg-blue-500", bg: "bg-blue-50", text: "text-blue-600", ring: "ring-blue-500/20" },
};

function SparkArea({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return null;
  const max = Math.max(...data, 1);
  const w = 200;
  const h = 48;
  const pad = 2;
  const step = (w - pad * 2) / (data.length - 1);

  const points = data.map((v, i) => ({
    x: pad + i * step,
    y: h - pad - ((v / max) * (h - pad * 2)),
  }));

  const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const area = `${line} L${points[points.length - 1].x},${h} L${points[0].x},${h} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-12 mt-2" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.3" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#grad-${color})`} className={color} />
      <path d={line} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={color} />
    </svg>
  );
}

export default function AnaliticaPage() {
  const { usuario } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/analytics");
        if (res.ok) setAnalytics(await res.json());
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!analytics) {
    return <div className="text-center py-20 text-muted">No se pudieron cargar los datos.</div>;
  }

  const { kpis, distribucionPorDia, distribucionPorSesion, distribucionPorHora, distribucionPorDiaSesion, topAsistentes, ultimosRegistros } = analytics;

  const hourlyValues = distribucionPorHora.map((h) => h.total);
  const maxHourly = Math.max(...hourlyValues, 1);
  const maxDia = Math.max(...distribucionPorDia.map((d) => Math.max(d.entradas, d.salidas)), 1);
  const maxTop = Math.max(...topAsistentes.map((t) => t.registros), 1);
  const maxDiaSesion = Math.max(...distribucionPorDiaSesion.map((ds) => ds.total), 1);

  return (
    <div className="space-y-5 max-w-[1400px] mx-auto">
      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Total Entradas",
            value: kpis.totalEntradas.toLocaleString(),
            sub: `${kpis.asistentesUnicos} asistentes unicos`,
            change: `${kpis.tasaRetencion}%`,
            changeUp: true,
            icon: LogIn,
            c: COLORS.emerald,
            sparkData: distribucionPorDia.map((d) => d.entradas),
          },
          {
            label: "Total Salidas",
            value: kpis.totalSalidas.toLocaleString(),
            sub: `${kpis.totalRegistros.toLocaleString()} registros totales`,
            change: `${kpis.totalEntradas > 0 ? Math.round((kpis.totalSalidas / kpis.totalEntradas) * 100) : 0}%`,
            changeUp: false,
            icon: LogOut,
            c: COLORS.cyan,
            sparkData: distribucionPorDia.map((d) => d.salidas),
          },
          {
            label: "Participantes",
            value: kpis.participantes.toLocaleString(),
            sub: `${distribucionPorDia.length} dias del evento`,
            change: `${distribucionPorSesion.length} sesiones`,
            changeUp: true,
            icon: Users,
            c: COLORS.rose,
            sparkData: distribucionPorSesion.map((s) => s.total),
          },
          {
            label: "Organizadores",
            value: kpis.organizadores.toString(),
            sub: "Comision organizadora",
            change: "Activos",
            changeUp: true,
            icon: UserCheck,
            c: COLORS.violet,
            sparkData: hourlyValues.length > 1 ? hourlyValues : [1, 1],
          },
        ].map((card) => (
          <div key={card.label} className="bg-white rounded-2xl border border-border/80 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[0.7rem] font-medium text-muted tracking-wide">{card.label}</p>
              <div className={`w-8 h-8 rounded-xl ${card.c.bg} flex items-center justify-center`}>
                <card.icon className={`w-4 h-4 ${card.c.text}`} />
              </div>
            </div>
            <p className="text-[1.75rem] font-extrabold text-ink leading-tight tracking-tight">{card.value}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`inline-flex items-center gap-0.5 text-[0.65rem] font-semibold ${card.changeUp ? "text-emerald-600" : "text-orange-500"}`}>
                {card.changeUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {card.change}
              </span>
              <span className="text-[0.6rem] text-muted">{card.sub}</span>
            </div>
            <SparkArea data={card.sparkData} color={card.c.text} />
          </div>
        ))}
      </div>

      {/* Asistencia por Dia */}
      <div className="bg-white rounded-2xl border border-border/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="px-6 py-4 flex items-center justify-between">
          <h2 className="text-[0.9rem] font-bold text-ink">Asistencia por Dia</h2>
          <div className="flex items-center gap-4 text-[0.65rem]">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> Entradas</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-cyan-500" /> Salidas</span>
          </div>
        </div>
        <div className="px-6 pb-5 space-y-3">
          {distribucionPorDia.map((d) => (
            <div key={d.dia} className="flex items-center gap-4">
              <div className="w-16 flex-shrink-0">
                <span className="text-sm font-bold text-ink">Dia {d.dia}</span>
              </div>
              <div className="flex-1 space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-6 bg-gray-50 rounded-md overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-md transition-all" style={{ width: `${(d.entradas / maxDia) * 100}%` }} />
                  </div>
                  <span className="text-xs font-bold text-ink w-14 text-right tabular-nums">{d.entradas.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-6 bg-gray-50 rounded-md overflow-hidden">
                    <div className="h-full bg-cyan-500 rounded-md transition-all" style={{ width: `${(d.salidas / maxDia) * 100}%` }} />
                  </div>
                  <span className="text-xs font-bold text-ink w-14 text-right tabular-nums">{d.salidas.toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Asistentes */}
        <div className="bg-white rounded-2xl border border-border/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="px-6 py-4 flex items-center justify-between">
            <h2 className="text-[0.9rem] font-bold text-ink">Top Asistentes</h2>
            <span className="text-[0.6rem] text-muted">por sesiones registradas</span>
          </div>
          <div className="px-6 pb-5 space-y-2.5">
            {topAsistentes.map((a, idx) => (
              <div key={a.dni} className="flex items-center gap-3 group">
                <span className="text-[0.65rem] text-muted w-4 text-right tabular-nums">{idx + 1}.</span>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-[0.6rem] font-bold text-white flex-shrink-0 ${
                  a.etiqueta === "organizador"
                    ? "bg-gradient-to-br from-violet-500 to-purple-600"
                    : "bg-gradient-to-br from-blue-500 to-indigo-600"
                }`}>
                  {a.apellido.substring(0, 2).toUpperCase()}
                </div>
                <div className="w-32 flex-shrink-0">
                  <p className="text-xs font-semibold text-ink truncate leading-tight">{a.apellido}</p>
                  <p className="text-[0.6rem] text-muted truncate">{a.nombres.split(" ")[0]} · {a.dni}</p>
                </div>
                <div className="flex-1 flex items-center gap-2">
                  <div className="flex-1 h-5 bg-gray-50 rounded overflow-hidden">
                    <div
                      className={`h-full rounded transition-all ${a.etiqueta === "organizador" ? "bg-violet-500" : "bg-blue-500"}`}
                      style={{ width: `${(a.registros / maxTop) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-ink w-8 text-right tabular-nums">{a.registros}</span>
                </div>
                <span className={`text-[0.55rem] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${
                  a.etiqueta === "organizador" ? "bg-violet-50 text-violet-600" : "bg-blue-50 text-blue-600"
                }`}>
                  {a.etiqueta === "organizador" ? "ORG" : "PART"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Dia × Sesion */}
        <div className="bg-white rounded-2xl border border-border/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="px-6 py-4">
            <h2 className="text-[0.9rem] font-bold text-ink">Desglose Dia × Sesion</h2>
          </div>
          <div className="px-6 pb-5 space-y-2">
            {distribucionPorDiaSesion.map((ds) => (
              <div key={`${ds.dia}-${ds.sesion}`} className="flex items-center gap-3 py-0.5">
                <div className="w-16 flex-shrink-0 flex items-center gap-1.5">
                  <span className="text-[0.6rem] font-medium text-muted bg-gray-100 rounded px-1.5 py-0.5">D{ds.dia}</span>
                  <span className="text-xs font-bold text-ink">S{ds.sesion}</span>
                </div>
                <div className="flex-1 h-5 bg-gray-50 rounded overflow-hidden">
                  <div
                    className="h-full rounded bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all"
                    style={{ width: `${Math.max((ds.total / maxDiaSesion) * 100, 2)}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-ink w-10 text-right tabular-nums">{ds.total}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Distribucion Horaria */}
      {distribucionPorHora.length > 0 && (
        <div className="bg-white rounded-2xl border border-border/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="px-6 py-4 flex items-center justify-between">
            <h2 className="text-[0.9rem] font-bold text-ink">Distribucion Horaria</h2>
            <span className="text-[0.6rem] text-muted">Hora de registro (UTC)</span>
          </div>
          <div className="px-6 pb-5">
            <div className="flex items-end gap-1 h-36">
              {distribucionPorHora.map((h) => {
                const pct = (h.total / maxHourly) * 100;
                return (
                  <div key={h.hora} className="flex-1 flex flex-col items-center gap-1 group cursor-default">
                    <span className="text-[0.6rem] font-bold text-ink opacity-0 group-hover:opacity-100 transition-opacity tabular-nums">
                      {h.total}
                    </span>
                    <div className="w-full relative">
                      <div
                        className="w-full rounded-t-md bg-gradient-to-t from-indigo-500 to-blue-400 group-hover:from-indigo-600 group-hover:to-blue-500 transition-all"
                        style={{ height: `${Math.max(pct, 3)}%`, minHeight: "4px", paddingTop: `${Math.max(pct, 3)}%` }}
                      />
                    </div>
                    <span className="text-[0.5rem] text-muted tabular-nums">{String(h.hora).padStart(2, "0")}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Bottom row: Data Quality + Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-border/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="px-6 py-4 flex items-center gap-2">
            <Database className="w-4 h-4 text-violet-500" />
            <h2 className="text-[0.9rem] font-bold text-ink">Calidad de Datos</h2>
          </div>
          <div className="px-6 pb-5 space-y-4">
            {[
              { label: "Completitud", value: kpis.totalRegistros > 0 ? 100 : 0, color: "from-emerald-400 to-green-500" },
              { label: "Consistencia", value: kpis.totalEntradas >= kpis.totalSalidas ? 100 : 85, color: "from-cyan-400 to-teal-500" },
              {
                label: "Cobertura",
                value: kpis.asistentesUnicos > 0 ? Math.min(Math.round((kpis.totalEntradas / kpis.asistentesUnicos) * 100), 100) : 0,
                color: "from-blue-400 to-indigo-500",
              },
            ].map((m) => (
              <div key={m.label}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-ink">{m.label}</span>
                  <span className="text-sm font-extrabold text-ink tabular-nums">{m.value}%</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${m.color} transition-all`}
                    style={{ width: `${m.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-border/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="px-6 py-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <h2 className="text-[0.9rem] font-bold text-ink">Resumen del Pipeline</h2>
          </div>
          <div className="px-6 pb-5">
            {[
              { label: "Fuente de datos", value: "Escaner DNI (PDF417)" },
              { label: "Registros procesados", value: kpis.totalRegistros.toLocaleString() },
              { label: "DNIs unicos", value: kpis.asistentesUnicos.toLocaleString() },
              { label: "Organizadores", value: `${kpis.organizadores} miembros` },
              { label: "Dias cubiertos", value: `${distribucionPorDia.length}` },
              { label: "Sesiones", value: `${distribucionPorSesion.length}` },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0">
                <span className="text-xs text-muted">{item.label}</span>
                <span className="text-xs font-bold text-ink">{item.value}</span>
              </div>
            ))}
            <div className="flex items-center justify-between py-2.5">
              <span className="text-xs text-muted">Estado</span>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Operativo
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Ultimos Registros */}
      <div className="bg-white rounded-2xl border border-border/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-rose-500" />
            <h2 className="text-[0.9rem] font-bold text-ink">Ultimos Registros</h2>
          </div>
          <span className="text-[0.6rem] text-muted bg-gray-100 px-2 py-1 rounded-full">Tiempo real</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-6 py-3 text-left font-semibold text-muted text-[0.65rem] tracking-wider uppercase">#</th>
                <th className="px-6 py-3 text-left font-semibold text-muted text-[0.65rem] tracking-wider uppercase">DNI</th>
                <th className="px-6 py-3 text-left font-semibold text-muted text-[0.65rem] tracking-wider uppercase">Nombre</th>
                <th className="px-6 py-3 text-left font-semibold text-muted text-[0.65rem] tracking-wider uppercase">Tipo</th>
                <th className="px-6 py-3 text-left font-semibold text-muted text-[0.65rem] tracking-wider uppercase">Etiqueta</th>
                <th className="px-6 py-3 text-left font-semibold text-muted text-[0.65rem] tracking-wider uppercase">Sesion</th>
                <th className="px-6 py-3 text-left font-semibold text-muted text-[0.65rem] tracking-wider uppercase">Hora</th>
              </tr>
            </thead>
            <tbody>
              {ultimosRegistros.map((r, idx) => (
                <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-3.5 text-xs text-muted tabular-nums">{idx + 1}</td>
                  <td className="px-6 py-3.5 font-mono text-xs font-medium text-ink">{r.numeroDni}</td>
                  <td className="px-6 py-3.5 text-xs font-semibold text-ink">{r.apellidoPaterno} {r.nombres.split(" ")[0]}</td>
                  <td className="px-6 py-3.5">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[0.6rem] font-semibold ${
                      r.tipo === "entrada" ? "bg-emerald-50 text-emerald-700" : "bg-orange-50 text-orange-700"
                    }`}>
                      {r.tipo === "entrada" ? <LogIn className="w-3 h-3" /> : <LogOut className="w-3 h-3" />}
                      {r.tipo === "entrada" ? "Entrada" : "Salida"}
                    </span>
                  </td>
                  <td className="px-6 py-3.5">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-[0.6rem] font-semibold ${
                      r.etiqueta === "organizador" ? "bg-violet-50 text-violet-700" : "bg-blue-50 text-blue-700"
                    }`}>
                      {r.etiqueta === "organizador" ? "Organizador" : "Participante"}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-xs text-muted">D{r.dia} · S{r.sesion}</td>
                  <td className="px-6 py-3.5 text-xs text-muted tabular-nums">
                    {new Date(r.fechaRegistro).toLocaleString("es-PE", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
