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

function formatNum(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}K`;
  return n.toString();
}

function LineChart({
  data,
  xLabels,
  color = "#10b981",
  height = 220,
  yLabel = "",
}: {
  data: number[];
  xLabels: string[];
  color?: string;
  height?: number;
  yLabel?: string;
}) {
  if (data.length < 2) return null;

  const max = Math.max(...data, 1);
  const padTop = 20;
  const padBottom = 32;
  const padLeft = 52;
  const padRight = 16;
  const w = 600;
  const h = height;
  const chartH = h - padTop - padBottom;
  const chartW = w - padLeft - padRight;

  const gridLines = 4;
  const gridStep = max / gridLines;
  const gridValues = Array.from({ length: gridLines + 1 }, (_, i) => Math.round(i * gridStep));

  const points = data.map((v, i) => ({
    x: padLeft + (i / (data.length - 1)) * chartW,
    y: padTop + chartH - (v / max) * chartH,
  }));

  function smoothPath(pts: { x: number; y: number }[]): string {
    if (pts.length < 2) return "";
    let d = `M${pts[0].x},${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const curr = pts[i];
      const next = pts[i + 1];
      const cpx = (curr.x + next.x) / 2;
      d += ` C${cpx},${curr.y} ${cpx},${next.y} ${next.x},${next.y}`;
    }
    return d;
  }

  const linePath = smoothPath(points);
  const areaPath = `${linePath} L${points[points.length - 1].x},${padTop + chartH} L${points[0].x},${padTop + chartH} Z`;

  const labelStep = Math.max(1, Math.ceil(xLabels.length / 6));

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: `${height}px`, maxHeight: `${height}px` }}>
      <defs>
        <linearGradient id={`area-grad-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0.01" />
        </linearGradient>
      </defs>

      {gridValues.map((val, i) => {
        const y = padTop + chartH - (val / max) * chartH;
        return (
          <g key={i}>
            <line x1={padLeft} y1={y} x2={w - padRight} y2={y} stroke="#e5e7eb" strokeWidth="1" strokeDasharray={i === 0 ? "0" : "4 3"} />
            <text x={padLeft - 8} y={y + 4} textAnchor="end" fill="#9ca3af" fontSize="11" fontFamily="system-ui">
              {yLabel}{formatNum(val)}
            </text>
          </g>
        );
      })}

      <path d={areaPath} fill={`url(#area-grad-${color.replace("#", "")})`} />
      <path d={linePath} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3.5" fill="white" stroke={color} strokeWidth="2" opacity={data[i] > 0 ? 1 : 0.3} />
      ))}

      {xLabels.map((label, i) => {
        if (i % labelStep !== 0 && i !== xLabels.length - 1) return null;
        const x = padLeft + (i / (xLabels.length - 1)) * chartW;
        return (
          <text key={i} x={x} y={h - 8} textAnchor="middle" fill="#9ca3af" fontSize="11" fontFamily="system-ui">
            {label}
          </text>
        );
      })}
    </svg>
  );
}

function DualLineChart({
  data1,
  data2,
  xLabels,
  color1 = "#10b981",
  color2 = "#06b6d4",
  label1 = "Serie 1",
  label2 = "Serie 2",
  height = 220,
}: {
  data1: number[];
  data2: number[];
  xLabels: string[];
  color1?: string;
  color2?: string;
  label1?: string;
  label2?: string;
  height?: number;
}) {
  if (data1.length < 2) return null;

  const max = Math.max(...data1, ...data2, 1);
  const padTop = 20;
  const padBottom = 32;
  const padLeft = 52;
  const padRight = 16;
  const w = 600;
  const h = height;
  const chartH = h - padTop - padBottom;
  const chartW = w - padLeft - padRight;

  const gridLines = 4;
  const gridStep = max / gridLines;
  const gridValues = Array.from({ length: gridLines + 1 }, (_, i) => Math.round(i * gridStep));

  function toPoints(data: number[]) {
    return data.map((v, i) => ({
      x: padLeft + (i / (data.length - 1)) * chartW,
      y: padTop + chartH - (v / max) * chartH,
    }));
  }

  function smoothPath(pts: { x: number; y: number }[]): string {
    if (pts.length < 2) return "";
    let d = `M${pts[0].x},${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const curr = pts[i];
      const next = pts[i + 1];
      const cpx = (curr.x + next.x) / 2;
      d += ` C${cpx},${curr.y} ${cpx},${next.y} ${next.x},${next.y}`;
    }
    return d;
  }

  const pts1 = toPoints(data1);
  const pts2 = toPoints(data2);
  const line1 = smoothPath(pts1);
  const line2 = smoothPath(pts2);
  const area1 = `${line1} L${pts1[pts1.length - 1].x},${padTop + chartH} L${pts1[0].x},${padTop + chartH} Z`;

  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: `${height}px`, maxHeight: `${height}px` }}>
        <defs>
          <linearGradient id="area-dual-1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color1} stopOpacity="0.15" />
            <stop offset="100%" stopColor={color1} stopOpacity="0.01" />
          </linearGradient>
        </defs>

        {gridValues.map((val, i) => {
          const y = padTop + chartH - (val / max) * chartH;
          return (
            <g key={i}>
              <line x1={padLeft} y1={y} x2={w - padRight} y2={y} stroke="#e5e7eb" strokeWidth="1" strokeDasharray={i === 0 ? "0" : "4 3"} />
              <text x={padLeft - 8} y={y + 4} textAnchor="end" fill="#9ca3af" fontSize="11" fontFamily="system-ui">
                {formatNum(val)}
              </text>
            </g>
          );
        })}

        <path d={area1} fill="url(#area-dual-1)" />
        <path d={line1} fill="none" stroke={color1} strokeWidth="2.5" strokeLinecap="round" />
        <path d={line2} fill="none" stroke={color2} strokeWidth="2.5" strokeLinecap="round" strokeDasharray="6 4" />

        {pts1.map((p, i) => (
          <circle key={`a${i}`} cx={p.x} cy={p.y} r="3.5" fill="white" stroke={color1} strokeWidth="2" />
        ))}
        {pts2.map((p, i) => (
          <circle key={`b${i}`} cx={p.x} cy={p.y} r="3" fill="white" stroke={color2} strokeWidth="1.5" />
        ))}

        {xLabels.map((label, i) => {
          const x = padLeft + (i / (xLabels.length - 1)) * chartW;
          return (
            <text key={i} x={x} y={h - 8} textAnchor="middle" fill="#9ca3af" fontSize="11" fontFamily="system-ui">
              {label}
            </text>
          );
        })}
      </svg>
      <div className="flex items-center gap-5 mt-2 ml-14">
        <span className="flex items-center gap-1.5 text-xs text-muted">
          <span className="w-4 h-[2.5px] rounded-full" style={{ backgroundColor: color1 }} /> {label1}
        </span>
        <span className="flex items-center gap-1.5 text-xs text-muted">
          <span className="w-4 h-[2.5px] rounded-full border-t-2 border-dashed" style={{ borderColor: color2 }} /> {label2}
        </span>
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

  const maxTop = Math.max(...topAsistentes.map((t) => t.registros), 1);
  const maxDiaSesion = Math.max(...distribucionPorDiaSesion.map((ds) => ds.total), 1);

  return (
    <div className="space-y-5 max-w-[1400px] mx-auto">
      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Entradas", value: kpis.totalEntradas, sub: `${kpis.asistentesUnicos} unicos`, pct: `${kpis.tasaRetencion}%`, up: true, icon: LogIn, iconBg: "bg-emerald-50", iconColor: "text-emerald-600" },
          { label: "Total Salidas", value: kpis.totalSalidas, sub: `${kpis.totalRegistros} registros`, pct: `${kpis.totalEntradas > 0 ? Math.round((kpis.totalSalidas / kpis.totalEntradas) * 100) : 0}%`, up: false, icon: LogOut, iconBg: "bg-cyan-50", iconColor: "text-cyan-600" },
          { label: "Participantes", value: kpis.participantes, sub: `${distribucionPorDia.length} dias`, pct: `${distribucionPorSesion.length} ses.`, up: true, icon: Users, iconBg: "bg-rose-50", iconColor: "text-rose-600" },
          { label: "Organizadores", value: kpis.organizadores, sub: "Comision", pct: "Activos", up: true, icon: UserCheck, iconBg: "bg-violet-50", iconColor: "text-violet-600" },
        ].map((c) => (
          <div key={c.label} className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[0.7rem] font-medium text-muted">{c.label}</p>
              <div className={`w-8 h-8 rounded-xl ${c.iconBg} flex items-center justify-center`}>
                <c.icon className={`w-4 h-4 ${c.iconColor}`} />
              </div>
            </div>
            <p className="text-[1.7rem] font-extrabold text-ink tracking-tight">{c.value.toLocaleString()}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`inline-flex items-center gap-0.5 text-[0.65rem] font-semibold ${c.up ? "text-emerald-600" : "text-orange-500"}`}>
                {c.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {c.pct}
              </span>
              <span className="text-[0.6rem] text-muted">{c.sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Main chart: Entradas vs Salidas por Dia */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100">
          <h2 className="text-[0.9rem] font-bold text-ink">Asistencia por Dia</h2>
          <div className="flex items-center gap-1 text-[0.6rem] text-muted bg-gray-50 px-2.5 py-1.5 rounded-lg">
            Dia 1 — Dia {distribucionPorDia.length}
          </div>
        </div>
        <div className="p-5">
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
        </div>
      </div>

      {/* Hourly chart */}
      {distribucionPorHora.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-500" />
              <h2 className="text-[0.9rem] font-bold text-ink">Distribucion Horaria</h2>
            </div>
            <span className="text-[0.6rem] text-muted bg-gray-50 px-2.5 py-1.5 rounded-lg">Ingresos por hora</span>
          </div>
          <div className="p-5">
            <LineChart
              data={distribucionPorHora.map((h) => h.total)}
              xLabels={distribucionPorHora.map((h) => `${String(h.hora).padStart(2, "0")}:00`)}
              color="#3b82f6"
              height={220}
            />
          </div>
        </div>
      )}

      {/* Sessions chart */}
      {distribucionPorSesion.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-violet-500" />
              <h2 className="text-[0.9rem] font-bold text-ink">Asistencia por Sesion</h2>
            </div>
          </div>
          <div className="p-5">
            <LineChart
              data={distribucionPorSesion.map((s) => s.total)}
              xLabels={distribucionPorSesion.map((s) => `${s.sesion}° Reg`)}
              color="#8b5cf6"
              height={200}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Asistentes */}
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              <h2 className="text-[0.9rem] font-bold text-ink">Top Asistentes</h2>
            </div>
            <span className="text-[0.6rem] text-muted">sesiones registradas</span>
          </div>
          <div className="px-6 py-4 space-y-2.5">
            {topAsistentes.map((a, idx) => (
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
                    <div className={`h-full rounded ${a.etiqueta === "organizador" ? "bg-violet-500" : "bg-blue-500"}`} style={{ width: `${(a.registros / maxTop) * 100}%` }} />
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

        {/* Dia × Sesion */}
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="px-6 py-4 flex items-center gap-2 border-b border-gray-100">
            <Database className="w-4 h-4 text-emerald-500" />
            <h2 className="text-[0.9rem] font-bold text-ink">Desglose Dia × Sesion</h2>
          </div>
          <div className="px-6 py-4 space-y-2">
            {distribucionPorDiaSesion.map((ds) => (
              <div key={`${ds.dia}-${ds.sesion}`} className="flex items-center gap-3 py-0.5">
                <div className="w-16 flex-shrink-0 flex items-center gap-1.5">
                  <span className="text-[0.6rem] font-medium text-muted bg-gray-100 rounded px-1.5 py-0.5">D{ds.dia}</span>
                  <span className="text-xs font-bold text-ink">S{ds.sesion}</span>
                </div>
                <div className="flex-1 h-5 bg-gray-50 rounded overflow-hidden">
                  <div className="h-full rounded bg-gradient-to-r from-emerald-500 to-cyan-500" style={{ width: `${Math.max((ds.total / maxDiaSesion) * 100, 2)}%` }} />
                </div>
                <span className="text-xs font-bold text-ink w-10 text-right tabular-nums">{ds.total}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Permanencia */}
      {permanencia.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              <h2 className="text-[0.9rem] font-bold text-ink">Permanencia (Salida − Entrada)</h2>
            </div>
            <span className="text-[0.6rem] text-muted bg-gray-50 px-2.5 py-1.5 rounded-lg">Solo sesiones con entrada y salida</span>
          </div>
          <div className="p-5">
            <LineChart
              data={permanencia.map((p) => p.promedioMin)}
              xLabels={permanencia.map((p) => `D${p.dia}S${p.sesion}`)}
              color="#f59e0b"
              height={200}
              yLabel=""
            />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mt-4">
              {permanencia.map((p) => (
                <div key={`perm-${p.dia}-${p.sesion}`} className="bg-amber-50/50 rounded-xl p-3 border border-amber-100/60">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-[0.6rem] font-medium text-muted bg-white rounded px-1.5 py-0.5">D{p.dia}</span>
                    <span className="text-xs font-bold text-ink">S{p.sesion}</span>
                  </div>
                  <p className="text-lg font-extrabold text-amber-700 tabular-nums">{p.promedioMin} min</p>
                  <p className="text-[0.6rem] text-muted mt-0.5">{p.pares} pares · {p.minMin}–{p.maxMin} min</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Data Quality + Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="px-6 py-4 flex items-center gap-2 border-b border-gray-100">
            <TrendingUp className="w-4 h-4 text-violet-500" />
            <h2 className="text-[0.9rem] font-bold text-ink">Calidad de Datos</h2>
          </div>
          <div className="px-6 py-4 space-y-4">
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
        </div>

        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="px-6 py-4 flex items-center gap-2 border-b border-gray-100">
            <Activity className="w-4 h-4 text-emerald-500" />
            <h2 className="text-[0.9rem] font-bold text-ink">Resumen del Pipeline</h2>
          </div>
          <div className="px-6 py-4">
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
