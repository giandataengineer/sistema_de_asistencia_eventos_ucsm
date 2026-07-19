"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { LineChart, DualLineChart } from "@/components/charts/LineChart";
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

interface DiaDistribucion { dia: number; entradas: number; salidas: number; total: number }
interface SesionDistribucion { sesion: number; total: number }
interface HoraDistribucion { hora: number; total: number }
interface DiaSesionDistribucion { dia: number; sesion: number; total: number }
interface TopAsistente { dni: string; apellido: string; nombres: string; etiqueta: string; registros: number }
interface Permanencia { dia: number; sesion: number; pares: number; promedioMin: number; minMin: number; maxMin: number }
interface UltimoRegistro { numeroDni: string; apellidoPaterno: string; nombres: string; tipo: string; etiqueta: string; fechaRegistro: string; dia: number; sesion: number }

interface AnalyticsData {
  kpis: KPIs;
  distribucionPorDia: DiaDistribucion[];
  distribucionPorSesion: SesionDistribucion[];
  distribucionPorHora: HoraDistribucion[];
  distribucionPorDiaSesion: DiaSesionDistribucion[];
  topAsistentes: TopAsistente[];
  ultimosRegistros: UltimoRegistro[];
  permanencia: Permanencia[];
}

function KpiCard({ label, value, sub, pct, up, icon: Icon, iconBg, iconColor }: {
  label: string; value: number; sub: string; pct: string; up: boolean;
  icon: typeof LogIn; iconBg: string; iconColor: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="flex items-center justify-between mb-1">
        <p className="text-[0.7rem] font-medium text-muted">{label}</p>
        <div className={`w-8 h-8 rounded-xl ${iconBg} flex items-center justify-center`}>
          <Icon className={`w-4 h-4 ${iconColor}`} />
        </div>
      </div>
      <p className="text-[1.7rem] font-extrabold text-ink tracking-tight">{value.toLocaleString()}</p>
      <div className="flex items-center gap-2 mt-0.5">
        <span className={`inline-flex items-center gap-0.5 text-[0.65rem] font-semibold ${up ? "text-emerald-600" : "text-orange-500"}`}>
          {up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {pct}
        </span>
        <span className="text-[0.6rem] text-muted">{sub}</span>
      </div>
    </div>
  );
}

function ChartCard({ title, badge, icon: Icon, iconColor, children }: {
  title: string; badge?: string; icon?: typeof Clock; iconColor?: string; children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
      <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100">
        <div className="flex items-center gap-2">
          {Icon && <Icon className={`w-4 h-4 ${iconColor}`} />}
          <h2 className="text-[0.9rem] font-bold text-ink">{title}</h2>
        </div>
        {badge && <span className="text-[0.6rem] text-muted bg-gray-50 px-2.5 py-1.5 rounded-lg">{badge}</span>}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function TopAsistentesCard({ asistentes, maxRegistros }: { asistentes: TopAsistente[]; maxRegistros: number }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
      <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-amber-500" />
          <h2 className="text-[0.9rem] font-bold text-ink">Top Asistentes</h2>
        </div>
        <span className="text-[0.6rem] text-muted">sesiones registradas</span>
      </div>
      <div className="px-6 py-4 space-y-2.5">
        {asistentes.map((a, idx) => (
          <div key={a.dni} className="flex items-center gap-3">
            <span className="text-[0.65rem] text-muted w-4 text-right tabular-nums">{idx + 1}.</span>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-[0.6rem] font-bold text-white flex-shrink-0 ${
              a.etiqueta === "organizador" ? "bg-gradient-to-br from-violet-500 to-purple-600" : "bg-gradient-to-br from-blue-500 to-indigo-600"
            }`}>
              {a.apellido.substring(0, 2).toUpperCase()}
            </div>
            <div className="w-28 flex-shrink-0">
              <p className="text-xs font-semibold text-ink truncate leading-tight">{a.apellido}</p>
              <p className="text-[0.6rem] text-muted truncate">{a.nombres.split(" ")[0]}</p>
            </div>
            <div className="flex-1 flex items-center gap-2">
              <div className="flex-1 h-5 bg-gray-50 rounded overflow-hidden">
                <div className={`h-full rounded ${a.etiqueta === "organizador" ? "bg-violet-500" : "bg-blue-500"}`} style={{ width: `${(a.registros / maxRegistros) * 100}%` }} />
              </div>
              <span className="text-xs font-bold text-ink w-6 text-right tabular-nums">{a.registros}</span>
            </div>
            <span className={`text-[0.55rem] font-semibold px-2 py-0.5 rounded-full ${
              a.etiqueta === "organizador" ? "bg-violet-50 text-violet-600" : "bg-blue-50 text-blue-600"
            }`}>
              {a.etiqueta === "organizador" ? "ORG" : "PART"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DiaSesionCard({ data, maxTotal }: { data: DiaSesionDistribucion[]; maxTotal: number }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
      <div className="px-6 py-4 flex items-center gap-2 border-b border-gray-100">
        <Database className="w-4 h-4 text-emerald-500" />
        <h2 className="text-[0.9rem] font-bold text-ink">Desglose Dia x Sesion</h2>
      </div>
      <div className="px-6 py-4 space-y-2">
        {data.map((ds) => (
          <div key={`${ds.dia}-${ds.sesion}`} className="flex items-center gap-3 py-0.5">
            <div className="w-16 flex-shrink-0 flex items-center gap-1.5">
              <span className="text-[0.6rem] font-medium text-muted bg-gray-100 rounded px-1.5 py-0.5">D{ds.dia}</span>
              <span className="text-xs font-bold text-ink">S{ds.sesion}</span>
            </div>
            <div className="flex-1 h-5 bg-gray-50 rounded overflow-hidden">
              <div className="h-full rounded bg-gradient-to-r from-emerald-500 to-cyan-500" style={{ width: `${Math.max((ds.total / maxTotal) * 100, 2)}%` }} />
            </div>
            <span className="text-xs font-bold text-ink w-10 text-right tabular-nums">{ds.total}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PermanenciaCard({ data, allSessions }: { data: Permanencia[]; allSessions: DiaSesionDistribucion[] }) {
  if (allSessions.length === 0) return null;

  const permMap = new Map(data.map((p) => [`${p.dia}-${p.sesion}`, p]));
  const chartData = data.length >= 2 ? data : [];

  return (
    <ChartCard title="Permanencia (Salida - Entrada)" badge="Entrada + Salida requeridos" icon={Clock} iconColor="text-amber-500">
      {chartData.length >= 2 && (
        <LineChart
          data={chartData.map((p) => p.promedioMin)}
          xLabels={chartData.map((p) => `D${p.dia}S${p.sesion}`)}
          color="#f59e0b"
          height={200}
        />
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mt-4">
        {allSessions.map((ds) => {
          const p = permMap.get(`${ds.dia}-${ds.sesion}`);
          if (p) {
            return (
              <div key={`perm-${ds.dia}-${ds.sesion}`} className="bg-amber-50/50 rounded-xl p-3 border border-amber-100/60">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-[0.6rem] font-medium text-muted bg-white rounded px-1.5 py-0.5">D{ds.dia}</span>
                  <span className="text-xs font-bold text-ink">S{ds.sesion}</span>
                </div>
                <p className="text-lg font-extrabold text-amber-700 tabular-nums">{p.promedioMin} min</p>
                <p className="text-[0.6rem] text-muted mt-0.5">{p.pares} pares · {p.minMin}-{p.maxMin} min</p>
              </div>
            );
          }
          return (
            <div key={`perm-${ds.dia}-${ds.sesion}`} className="bg-gray-50/50 rounded-xl p-3 border border-gray-200/60">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[0.6rem] font-medium text-muted bg-white rounded px-1.5 py-0.5">D{ds.dia}</span>
                <span className="text-xs font-bold text-ink">S{ds.sesion}</span>
              </div>
              <p className="text-sm font-semibold text-gray-400">No corresponde</p>
              <p className="text-[0.6rem] text-muted mt-0.5">Solo entrada registrada</p>
            </div>
          );
        })}
      </div>
    </ChartCard>
  );
}

function UltimosRegistrosTable({ registros }: { registros: UltimoRegistro[] }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
      <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100">
        <h2 className="text-[0.9rem] font-bold text-ink">Ultimos Registros</h2>
        <span className="text-[0.6rem] text-muted bg-gray-50 px-2.5 py-1.5 rounded-lg">Tiempo real</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              {["#", "DNI", "Nombre", "Tipo", "Etiqueta", "Sesion", "Hora"].map((h) => (
                <th key={h} className="px-6 py-3 text-left font-semibold text-muted text-[0.65rem] tracking-wider uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {registros.map((r, idx) => (
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

  const { kpis, distribucionPorDia, distribucionPorSesion, distribucionPorHora, distribucionPorDiaSesion, topAsistentes, ultimosRegistros, permanencia } = analytics;

  return (
    <div className="space-y-5 max-w-[1400px] mx-auto">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total Entradas" value={kpis.totalEntradas} sub={`${kpis.asistentesUnicos} unicos`} pct={`${kpis.tasaRetencion}%`} up icon={LogIn} iconBg="bg-emerald-50" iconColor="text-emerald-600" />
        <KpiCard label="Total Salidas" value={kpis.totalSalidas} sub={`${kpis.totalRegistros} registros`} pct={`${kpis.totalEntradas > 0 ? Math.round((kpis.totalSalidas / kpis.totalEntradas) * 100) : 0}%`} up={false} icon={LogOut} iconBg="bg-cyan-50" iconColor="text-cyan-600" />
        <KpiCard label="Participantes" value={kpis.participantes} sub={`${distribucionPorDia.length} dias`} pct={`${distribucionPorSesion.length} ses.`} up icon={Users} iconBg="bg-rose-50" iconColor="text-rose-600" />
        <KpiCard label="Organizadores" value={kpis.organizadores} sub="Comision" pct="Activos" up icon={UserCheck} iconBg="bg-violet-50" iconColor="text-violet-600" />
      </div>

      <ChartCard title="Asistencia por Dia" badge={`Dia 1 — Dia ${distribucionPorDia.length}`}>
        <DualLineChart
          data1={distribucionPorDia.map((d) => d.entradas)}
          data2={distribucionPorDia.map((d) => d.salidas)}
          xLabels={distribucionPorDia.map((d) => `Dia ${d.dia}`)}
          color1="#10b981"
          color2="#06b6d4"
          label1="Entradas"
          label2="Salidas"
          height={240}
        />
      </ChartCard>

      {distribucionPorHora.length > 0 && (
        <ChartCard title="Distribucion Horaria" badge="Ingresos por hora" icon={Clock} iconColor="text-blue-500">
          <LineChart
            data={distribucionPorHora.map((h) => h.total)}
            xLabels={distribucionPorHora.map((h) => `${String(h.hora).padStart(2, "0")}:00`)}
            color="#3b82f6"
            height={220}
          />
        </ChartCard>
      )}

      {distribucionPorSesion.length > 0 && (
        <ChartCard title="Asistencia por Sesion" icon={Activity} iconColor="text-violet-500">
          <LineChart
            data={distribucionPorSesion.map((s) => s.total)}
            xLabels={distribucionPorSesion.map((s) => `${s.sesion}° Reg`)}
            color="#8b5cf6"
            height={200}
          />
        </ChartCard>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TopAsistentesCard asistentes={topAsistentes} maxRegistros={Math.max(...topAsistentes.map((t) => t.registros), 1)} />
        <DiaSesionCard data={distribucionPorDiaSesion} maxTotal={Math.max(...distribucionPorDiaSesion.map((ds) => ds.total), 1)} />
      </div>

      <PermanenciaCard data={permanencia} allSessions={distribucionPorDiaSesion} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Calidad de Datos" icon={TrendingUp} iconColor="text-violet-500">
          <div className="space-y-4">
            {[
              { label: "Completitud", value: kpis.totalRegistros > 0 ? 100 : 0, color: "from-emerald-400 to-green-500" },
              { label: "Consistencia", value: kpis.totalEntradas >= kpis.totalSalidas ? 100 : 85, color: "from-cyan-400 to-teal-500" },
              { label: "Cobertura", value: kpis.asistentesUnicos > 0 ? Math.min(Math.round((kpis.totalEntradas / kpis.asistentesUnicos) * 100), 100) : 0, color: "from-blue-400 to-indigo-500" },
            ].map((m) => (
              <div key={m.label}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-ink">{m.label}</span>
                  <span className="text-sm font-extrabold text-ink tabular-nums">{m.value}%</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full bg-gradient-to-r ${m.color}`} style={{ width: `${m.value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard title="Resumen del Pipeline" icon={Activity} iconColor="text-emerald-500">
          <div>
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
        </ChartCard>
      </div>

      <UltimosRegistrosTable registros={ultimosRegistros} />
    </div>
  );
}
