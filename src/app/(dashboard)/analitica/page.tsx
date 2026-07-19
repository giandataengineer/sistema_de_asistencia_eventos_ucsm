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
  CalendarDays,
  BarChart3,
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

function HBarInline({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-2 flex-1">
      <span className="text-sm font-semibold text-ink w-12 text-right tabular-nums">{value.toLocaleString()}</span>
      <div className="flex-1 h-5 bg-surface-alt rounded overflow-hidden">
        <div className={`h-full rounded ${color} transition-all`} style={{ width: `${Math.max(pct, 1)}%` }} />
      </div>
    </div>
  );
}

function SparkBars({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-[3px] h-16 mt-3">
      {data.map((val, i) => (
        <div
          key={i}
          className={`flex-1 rounded-t ${color} transition-all opacity-80 hover:opacity-100`}
          style={{ height: `${Math.max((val / max) * 100, 3)}%` }}
        />
      ))}
    </div>
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
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-accent" />
      </div>
    );
  }

  if (!analytics) {
    return <div className="text-center py-20 text-muted">No se pudieron cargar los datos.</div>;
  }

  const { kpis, distribucionPorDia, distribucionPorSesion, distribucionPorHora, distribucionPorDiaSesion, topAsistentes, ultimosRegistros } = analytics;

  const hourlyValues = distribucionPorHora.map((h) => h.total);
  const sessionValues = distribucionPorSesion.map((s) => s.total);
  const maxDiaEntrada = Math.max(...distribucionPorDia.map((d) => d.entradas), 1);
  const maxDiaSalida = Math.max(...distribucionPorDia.map((d) => d.salidas), 1);
  const maxDiaOverall = Math.max(maxDiaEntrada, maxDiaSalida, 1);
  const maxTopRegistros = Math.max(...topAsistentes.map((t) => t.registros), 1);
  const maxDiaSesion = Math.max(...distribucionPorDiaSesion.map((ds) => ds.total), 1);

  return (
    <div className="space-y-6 max-w-[1400px]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-primary tracking-tight">Dashboard de Asistencia</h1>
          <p className="text-sm text-muted mt-0.5">{usuario?.eventoNombre}</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted bg-white border border-border rounded-lg px-3 py-2 shadow-sm">
          <CalendarDays className="w-3.5 h-3.5" />
          <span>Dia 1 — Dia {distribucionPorDia.length || 2}</span>
        </div>
      </div>

      {/* KPI Cards Row — 3 cards with sparklines like the reference */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Entradas card */}
        <div className="bg-white rounded-xl border border-border p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted uppercase tracking-wider">Total Entradas</p>
              <p className="text-3xl font-bold text-ink mt-1">{kpis.totalEntradas.toLocaleString()}</p>
            </div>
            <div className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
              <ArrowUpRight className="w-3 h-3" />
              {kpis.tasaRetencion}%
            </div>
          </div>
          <SparkBars data={hourlyValues.length > 0 ? hourlyValues : [0]} color="bg-emerald-400" />
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/60">
            <div>
              <p className="text-[0.65rem] text-muted">Asistentes Unicos</p>
              <p className="text-sm font-bold text-ink">{kpis.asistentesUnicos}</p>
            </div>
            <div>
              <p className="text-[0.65rem] text-muted">Participantes</p>
              <p className="text-sm font-bold text-ink">{kpis.participantes}</p>
            </div>
          </div>
        </div>

        {/* Salidas card */}
        <div className="bg-white rounded-xl border border-border p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted uppercase tracking-wider">Total Salidas</p>
              <p className="text-3xl font-bold text-ink mt-1">{kpis.totalSalidas.toLocaleString()}</p>
            </div>
            <div className="flex items-center gap-1 text-xs font-medium text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
              <ArrowDownRight className="w-3 h-3" />
              {kpis.totalEntradas > 0 ? Math.round((kpis.totalSalidas / kpis.totalEntradas) * 100) : 0}%
            </div>
          </div>
          <SparkBars data={sessionValues.length > 0 ? sessionValues : [0]} color="bg-cyan-400" />
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/60">
            <div>
              <p className="text-[0.65rem] text-muted">Total Registros</p>
              <p className="text-sm font-bold text-ink">{kpis.totalRegistros.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-[0.65rem] text-muted">Tasa Retencion</p>
              <p className="text-sm font-bold text-ink">{kpis.tasaRetencion}%</p>
            </div>
          </div>
        </div>

        {/* Organizadores card */}
        <div className="bg-white rounded-xl border border-border p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted uppercase tracking-wider">Organizadores</p>
              <p className="text-3xl font-bold text-ink mt-1">{kpis.organizadores}</p>
            </div>
            <div className="flex items-center gap-1 text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
              <UserCheck className="w-3 h-3" />
              Comision
            </div>
          </div>
          <SparkBars data={distribucionPorDia.map((d) => d.entradas)} color="bg-rose-400" />
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/60">
            <div>
              <p className="text-[0.65rem] text-muted">Dias del Evento</p>
              <p className="text-sm font-bold text-ink">{distribucionPorDia.length}</p>
            </div>
            <div>
              <p className="text-[0.65rem] text-muted">Sesiones</p>
              <p className="text-sm font-bold text-ink">{distribucionPorSesion.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Asistencia por Dia — horizontal bars like the reference */}
      <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-bold text-ink">Asistencia por Dia</h2>
        </div>
        <div className="p-5">
          <div className="space-y-4">
            {/* Header */}
            <div className="grid grid-cols-[60px_1fr_1fr] gap-4 text-[0.65rem] font-medium text-muted uppercase tracking-wider">
              <span>Dia</span>
              <span>Entradas</span>
              <span>Salidas</span>
            </div>
            {distribucionPorDia.map((d) => (
              <div key={d.dia} className="grid grid-cols-[60px_1fr_1fr] gap-4 items-center">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                    D{d.dia}
                  </div>
                </div>
                <HBarInline value={d.entradas} max={maxDiaOverall} color="bg-emerald-400" />
                <HBarInline value={d.salidas} max={maxDiaOverall} color="bg-cyan-400" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Asistentes — horizontal bars with avatars like the reference */}
        <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <Award className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-bold text-ink">Top Asistentes</h2>
            <span className="ml-auto text-[0.65rem] text-muted">por sesiones registradas</span>
          </div>
          <div className="p-5 space-y-3">
            {topAsistentes.map((a, idx) => (
              <div key={a.dni} className="flex items-center gap-3">
                <span className="text-xs text-muted w-5 text-right">{idx + 1}.</span>
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-mid flex items-center justify-center text-[0.6rem] font-bold text-white flex-shrink-0">
                  {a.apellido.substring(0, 2).toUpperCase()}
                </div>
                <div className="flex-shrink-0 w-28 truncate">
                  <p className="text-xs font-medium text-ink truncate">{a.apellido} {a.nombres.split(" ")[0]}</p>
                  <p className="text-[0.6rem] text-muted">{a.dni}</p>
                </div>
                <HBarInline value={a.registros} max={maxTopRegistros} color={a.etiqueta === "organizador" ? "bg-purple-400" : "bg-blue-400"} />
                <span className={`text-[0.55rem] font-medium px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                  a.etiqueta === "organizador" ? "bg-purple-50 text-purple-600" : "bg-blue-50 text-blue-600"
                }`}>
                  {a.etiqueta === "organizador" ? "ORG" : "PART"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Distribucion Dia × Sesion — matrix/heatmap style */}
        <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-bold text-ink">Desglose Dia × Sesion</h2>
          </div>
          <div className="p-5">
            <div className="space-y-2">
              <div className="grid grid-cols-[60px_1fr_80px] gap-3 text-[0.65rem] font-medium text-muted uppercase tracking-wider">
                <span>Sesion</span>
                <span>Asistentes</span>
                <span className="text-right">Total</span>
              </div>
              {distribucionPorDiaSesion.map((ds) => (
                <div key={`${ds.dia}-${ds.sesion}`} className="grid grid-cols-[60px_1fr_80px] gap-3 items-center py-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[0.6rem] font-medium text-muted">D{ds.dia}</span>
                    <span className="text-xs font-semibold text-ink">S{ds.sesion}</span>
                  </div>
                  <div className="h-6 bg-surface-alt rounded overflow-hidden">
                    <div
                      className="h-full rounded bg-gradient-to-r from-emerald-400 to-cyan-400 transition-all"
                      style={{ width: `${Math.max((ds.total / maxDiaSesion) * 100, 2)}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-ink text-right tabular-nums">{ds.total}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Distribucion Horaria — full width bar chart */}
      {distribucionPorHora.length > 0 && (
        <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-bold text-ink">Distribucion Horaria</h2>
            <span className="ml-auto text-[0.65rem] text-muted">Hora de registro (UTC)</span>
          </div>
          <div className="p-5">
            <div className="flex items-end gap-[6px] h-32">
              {distribucionPorHora.map((h) => {
                const max = Math.max(...hourlyValues, 1);
                const pct = (h.total / max) * 100;
                return (
                  <div key={h.hora} className="flex-1 flex flex-col items-center gap-1 group">
                    <span className="text-[0.6rem] font-medium text-ink opacity-0 group-hover:opacity-100 transition-opacity">
                      {h.total}
                    </span>
                    <div
                      className="w-full rounded-t bg-gradient-to-t from-blue-500 to-blue-400 group-hover:from-blue-600 group-hover:to-blue-500 transition-all"
                      style={{ height: `${Math.max(pct, 3)}%` }}
                    />
                    <span className="text-[0.55rem] text-muted">{String(h.hora).padStart(2, "0")}h</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Data Quality + Pipeline Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <Database className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-bold text-ink">Calidad de Datos</h2>
          </div>
          <div className="p-5 space-y-4">
            {[
              { label: "Completitud", value: kpis.totalRegistros > 0 ? 100 : 0, desc: "Registros con datos completos" },
              { label: "Consistencia", value: kpis.totalEntradas >= kpis.totalSalidas ? 100 : 85, desc: "Entradas >= Salidas por sesion" },
              {
                label: "Cobertura",
                value: kpis.asistentesUnicos > 0 ? Math.min(Math.round((kpis.totalEntradas / kpis.asistentesUnicos) * 100), 100) : 0,
                desc: "Promedio registros por asistente",
              },
            ].map((m) => (
              <div key={m.label}>
                <div className="flex items-center justify-between mb-1.5">
                  <div>
                    <span className="text-sm font-medium text-ink">{m.label}</span>
                    <span className="text-[0.6rem] text-muted ml-2">{m.desc}</span>
                  </div>
                  <span className={`text-sm font-bold tabular-nums ${m.value >= 90 ? "text-green-600" : m.value >= 70 ? "text-yellow-600" : "text-red-500"}`}>
                    {m.value}%
                  </span>
                </div>
                <div className="h-2.5 bg-surface-alt rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      m.value >= 90 ? "bg-gradient-to-r from-green-400 to-emerald-500" : m.value >= 70 ? "bg-gradient-to-r from-yellow-400 to-amber-500" : "bg-gradient-to-r from-red-400 to-rose-500"
                    }`}
                    style={{ width: `${m.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-bold text-ink">Resumen del Pipeline</h2>
          </div>
          <div className="p-5">
            <div className="space-y-0">
              {[
                { label: "Fuente de datos", value: "Escaner DNI (PDF417)" },
                { label: "Registros procesados", value: kpis.totalRegistros.toLocaleString() },
                { label: "DNIs unicos validados", value: kpis.asistentesUnicos.toLocaleString() },
                { label: "Organizadores", value: `${kpis.organizadores} miembros` },
                { label: "Dias cubiertos", value: `${distribucionPorDia.length} dias` },
                { label: "Sesiones registradas", value: `${distribucionPorSesion.length} sesiones` },
                { label: "Estado", value: "Operativo", isStatus: true },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between py-2.5 border-b border-border/50 last:border-0">
                  <span className="text-xs text-muted">{item.label}</span>
                  {"isStatus" in item ? (
                    <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                      {item.value}
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-ink">{item.value}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Ultimos Registros — clean table */}
      <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-bold text-ink">Ultimos Registros</h2>
          </div>
          <span className="text-[0.65rem] text-muted">Tiempo real</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-alt/50">
                <th className="px-5 py-2.5 text-left font-medium text-muted text-xs">#</th>
                <th className="px-5 py-2.5 text-left font-medium text-muted text-xs">DNI</th>
                <th className="px-5 py-2.5 text-left font-medium text-muted text-xs">Nombre</th>
                <th className="px-5 py-2.5 text-left font-medium text-muted text-xs">Tipo</th>
                <th className="px-5 py-2.5 text-left font-medium text-muted text-xs">Etiqueta</th>
                <th className="px-5 py-2.5 text-left font-medium text-muted text-xs">Dia / Sesion</th>
                <th className="px-5 py-2.5 text-left font-medium text-muted text-xs">Hora</th>
              </tr>
            </thead>
            <tbody>
              {ultimosRegistros.map((r, idx) => (
                <tr key={idx} className="border-b border-border/30 hover:bg-surface-alt/30 transition-colors">
                  <td className="px-5 py-3 text-xs text-muted">{idx + 1}</td>
                  <td className="px-5 py-3 font-mono text-xs text-ink">{r.numeroDni}</td>
                  <td className="px-5 py-3 text-xs font-medium text-ink">{r.apellidoPaterno} {r.nombres.split(" ")[0]}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.65rem] font-medium ${
                      r.tipo === "entrada" ? "bg-green-50 text-green-700" : "bg-orange-50 text-orange-700"
                    }`}>
                      {r.tipo === "entrada" ? <LogIn className="w-3 h-3" /> : <LogOut className="w-3 h-3" />}
                      {r.tipo === "entrada" ? "Entrada" : "Salida"}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[0.65rem] font-medium ${
                      r.etiqueta === "organizador" ? "bg-purple-50 text-purple-700" : "bg-blue-50 text-blue-700"
                    }`}>
                      {r.etiqueta === "organizador" ? "Organizador" : "Participante"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs text-muted">D{r.dia} · S{r.sesion}</td>
                  <td className="px-5 py-3 text-xs text-muted">
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
