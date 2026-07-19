"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  BarChart3,
  Users,
  TrendingUp,
  Clock,
  UserCheck,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Database,
  Loader2,
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

interface DistribucionItem {
  dia?: number;
  sesion?: number;
  hora?: number;
  total: number;
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
  distribucionPorDia: DistribucionItem[];
  distribucionPorSesion: DistribucionItem[];
  distribucionPorHora: DistribucionItem[];
  ultimosRegistros: UltimoRegistro[];
}

function KPICard({
  label,
  value,
  icon: Icon,
  accent,
  subtitle,
}: {
  label: string;
  value: number | string;
  icon: typeof Users;
  accent: string;
  subtitle?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-border p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-muted uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-bold text-ink mt-1">{value}</p>
          {subtitle && <p className="text-xs text-muted mt-1">{subtitle}</p>}
        </div>
        <div className={`p-2.5 rounded-lg ${accent}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

function BarChartSimple({
  data,
  labelKey,
  valueKey,
  color,
  formatLabel,
}: {
  data: Record<string, number | string>[];
  labelKey: string;
  valueKey: string;
  color: string;
  formatLabel?: (val: string | number) => string;
}) {
  const maxVal = Math.max(...data.map((d) => Number(d[valueKey]) || 0), 1);

  return (
    <div className="flex items-end gap-2 h-40">
      {data.map((item, idx) => {
        const val = Number(item[valueKey]) || 0;
        const height = (val / maxVal) * 100;
        const label = formatLabel
          ? formatLabel(item[labelKey])
          : String(item[labelKey]);

        return (
          <div key={idx} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-[0.65rem] font-medium text-ink">{val}</span>
            <div
              className={`w-full rounded-t-md transition-all ${color}`}
              style={{ height: `${Math.max(height, 4)}%` }}
            />
            <span className="text-[0.6rem] text-muted whitespace-nowrap">{label}</span>
          </div>
        );
      })}
    </div>
  );
}

function DataQualityIndicator({ kpis }: { kpis: KPIs }) {
  const completitud = kpis.totalRegistros > 0 ? 100 : 0;
  const consistencia = kpis.totalEntradas >= kpis.totalSalidas ? 100 : 85;
  const cobertura = kpis.asistentesUnicos > 0
    ? Math.min(Math.round((kpis.totalEntradas / kpis.asistentesUnicos) * 100), 100)
    : 0;

  const metrics = [
    { label: "Completitud", value: completitud },
    { label: "Consistencia", value: consistencia },
    { label: "Cobertura", value: cobertura },
  ];

  return (
    <div className="space-y-3">
      {metrics.map((m) => (
        <div key={m.label}>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-muted">{m.label}</span>
            <span className="font-medium text-ink">{m.value}%</span>
          </div>
          <div className="h-2 bg-surface-alt rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                m.value >= 90 ? "bg-success" : m.value >= 70 ? "bg-warning" : "bg-danger"
              }`}
              style={{ width: `${m.value}%` }}
            />
          </div>
        </div>
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
        if (res.ok) {
          setAnalytics(await res.json());
        }
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
    return (
      <div className="text-center py-20 text-muted">
        No se pudieron cargar los datos de analitica.
      </div>
    );
  }

  const { kpis, distribucionPorDia, distribucionPorSesion, distribucionPorHora, ultimosRegistros } = analytics;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-primary tracking-tight">
          Analitica de Asistencia
        </h1>
        <p className="text-sm text-muted mt-0.5">{usuario?.eventoNombre}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Asistentes Unicos"
          value={kpis.asistentesUnicos}
          icon={Users}
          accent="bg-blue-50 text-blue-600"
          subtitle={`${kpis.participantes} participantes`}
        />
        <KPICard
          label="Total Entradas"
          value={kpis.totalEntradas}
          icon={ArrowUpRight}
          accent="bg-green-50 text-green-600"
        />
        <KPICard
          label="Total Salidas"
          value={kpis.totalSalidas}
          icon={ArrowDownRight}
          accent="bg-orange-50 text-orange-600"
        />
        <KPICard
          label="Organizadores"
          value={kpis.organizadores}
          icon={UserCheck}
          accent="bg-purple-50 text-purple-600"
          subtitle="Comision organizadora"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-border p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-accent" />
            <h3 className="text-sm font-semibold text-ink">Tasa de Retencion</h3>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-primary">{kpis.tasaRetencion}%</span>
            <span className="text-xs text-muted">salidas / entradas</span>
          </div>
          <p className="text-xs text-muted mt-2">
            Porcentaje de asistentes que registraron salida respecto al total de entradas.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-border p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Database className="w-4 h-4 text-accent" />
            <h3 className="text-sm font-semibold text-ink">Calidad de Datos</h3>
          </div>
          <DataQualityIndicator kpis={kpis} />
        </div>

        <div className="bg-white rounded-xl border border-border p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-accent" />
            <h3 className="text-sm font-semibold text-ink">Resumen Pipeline</h3>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1.5 border-b border-border">
              <span className="text-muted">Fuente</span>
              <span className="font-medium text-ink">Escaner DNI (PDF417)</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border">
              <span className="text-muted">Registros procesados</span>
              <span className="font-medium text-ink">{kpis.totalRegistros}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-border">
              <span className="text-muted">DNIs validados</span>
              <span className="font-medium text-ink">{kpis.asistentesUnicos}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-muted">Estado</span>
              <span className="font-medium text-success">Operativo</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {distribucionPorDia.length > 0 && (
          <div className="bg-white rounded-xl border border-border p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4 text-accent" />
              <h3 className="text-sm font-semibold text-ink">Asistencia por Dia</h3>
            </div>
            <BarChartSimple
              data={distribucionPorDia as unknown as Record<string, number | string>[]}
              labelKey="dia"
              valueKey="total"
              color="bg-accent"
              formatLabel={(v) => `Dia ${v}`}
            />
          </div>
        )}

        {distribucionPorSesion.length > 0 && (
          <div className="bg-white rounded-xl border border-border p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4 text-accent" />
              <h3 className="text-sm font-semibold text-ink">Asistencia por Sesion</h3>
            </div>
            <BarChartSimple
              data={distribucionPorSesion as unknown as Record<string, number | string>[]}
              labelKey="sesion"
              valueKey="total"
              color="bg-primary-mid"
              formatLabel={(v) => `S${v}`}
            />
          </div>
        )}
      </div>

      {distribucionPorHora.length > 0 && (
        <div className="bg-white rounded-xl border border-border p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-accent" />
            <h3 className="text-sm font-semibold text-ink">Distribucion Horaria de Ingresos</h3>
          </div>
          <BarChartSimple
            data={distribucionPorHora as unknown as Record<string, number | string>[]}
            labelKey="hora"
            valueKey="total"
            color="bg-blue-500"
            formatLabel={(v) => `${String(v).padStart(2, "0")}h`}
          />
        </div>
      )}

      <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="px-5 py-3 bg-gradient-to-r from-primary to-primary-mid text-white text-sm font-semibold flex items-center gap-2">
          <Activity className="w-4 h-4" />
          Ultimos Registros (Tiempo Real)
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-4 py-2.5 font-medium text-muted text-xs">DNI</th>
                <th className="px-4 py-2.5 font-medium text-muted text-xs">Nombre</th>
                <th className="px-4 py-2.5 font-medium text-muted text-xs">Tipo</th>
                <th className="px-4 py-2.5 font-medium text-muted text-xs">Etiqueta</th>
                <th className="px-4 py-2.5 font-medium text-muted text-xs">Dia / Sesion</th>
                <th className="px-4 py-2.5 font-medium text-muted text-xs">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {ultimosRegistros.map((r, idx) => (
                <tr key={idx} className="border-b border-border/50 hover:bg-surface-alt transition-colors">
                  <td className="px-4 py-2 font-mono text-xs">{r.numeroDni}</td>
                  <td className="px-4 py-2">{r.apellidoPaterno} {r.nombres}</td>
                  <td className="px-4 py-2">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                      r.tipo === "entrada"
                        ? "bg-green-50 text-green-700"
                        : "bg-orange-50 text-orange-700"
                    }`}>
                      {r.tipo === "entrada" ? "Entrada" : "Salida"}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                      r.etiqueta === "organizador"
                        ? "bg-purple-50 text-purple-700"
                        : "bg-blue-50 text-blue-700"
                    }`}>
                      {r.etiqueta === "organizador" ? "Organizador" : "Participante"}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-xs text-muted">D{r.dia} / S{r.sesion}</td>
                  <td className="px-4 py-2 text-xs text-muted">
                    {new Date(r.fechaRegistro).toLocaleString("es-PE", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
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
