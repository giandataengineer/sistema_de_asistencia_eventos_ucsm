"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useAsistencias } from "@/hooks/useAsistencias";
import AsistenciaTable from "@/components/asistencia/AsistenciaTable";
import ExportButtons from "@/components/asistencia/ExportButtons";
import Pagination from "@/components/asistencia/Pagination";
import DeleteModal from "@/components/asistencia/DeleteModal";
import { toast } from "sonner";
import {
  Search,
  ClipboardList,
  RefreshCw,
  LogIn,
  LogOut,
  Calendar,
  ChevronDown,
} from "lucide-react";

function formatFechaDia(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const dias = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
  const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  return `${dias[date.getDay()]} ${d} ${meses[date.getMonth()]}`;
}

export default function HistorialPage() {
  const { usuario } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; nombre: string } | null>(null);
  const [updatingNames, setUpdatingNames] = useState(false);

  const [fechas, setFechas] = useState<Record<number, string>>({});
  const [availableDias, setAvailableDias] = useState<number[]>([]);
  const [availableSesiones, setAvailableSesiones] = useState<number[]>([]);
  const [selectedDia, setSelectedDia] = useState<number | null>(null);
  const [selectedSesion, setSelectedSesion] = useState<number | null>(null);
  const [selectedTipo, setSelectedTipo] = useState<string | null>(null);

  const [countEntrada, setCountEntrada] = useState(0);
  const [countSalida, setCountSalida] = useState(0);

  const { data, loading, fetchAsistencias, eliminar } = useAsistencias();

  useEffect(() => {
    (async () => {
      try {
        const [metaRes, diaRes] = await Promise.all([
          fetch("/api/asistencias/metadata"),
          fetch("/api/asistencias/dia-actual"),
        ]);
        const meta = metaRes.ok ? await metaRes.json() : { dias: [], sesiones: [] };
        const diaData = diaRes.ok ? await diaRes.json() : { fechas: {} };

        setFechas(diaData.fechas ?? {});
        setAvailableDias(meta.dias ?? []);
        setAvailableSesiones(meta.sesiones ?? []);
      } catch {
        // silent
      }
    })();
  }, []);

  const fetchSessionsForDay = useCallback(async (dia: number) => {
    try {
      const res = await fetch(`/api/asistencias/metadata?dia=${dia}`);
      if (!res.ok) return;
      const meta = await res.json();
      setAvailableSesiones(meta.sesiones ?? []);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    if (selectedDia) {
      fetchSessionsForDay(selectedDia);
    } else {
      (async () => {
        try {
          const res = await fetch("/api/asistencias/metadata");
          if (!res.ok) return;
          const meta = await res.json();
          setAvailableSesiones(meta.sesiones ?? []);
        } catch {
          // silent
        }
      })();
    }
  }, [selectedDia, fetchSessionsForDay]);

  const fetchCounts = useCallback(async () => {
    try {
      const diaParam = selectedDia ? `&dia=${selectedDia}` : "";
      const sesionParam = selectedSesion ? `&sesion=${selectedSesion}` : "";
      const [resE, resS] = await Promise.all([
        fetch(`/api/asistencias?limit=1&tipo=entrada${diaParam}${sesionParam}`),
        fetch(`/api/asistencias?limit=1&tipo=salida${diaParam}${sesionParam}`),
      ]);
      if (resE.ok) {
        const d = await resE.json();
        setCountEntrada(d.total ?? 0);
      }
      if (resS.ok) {
        const d = await resS.json();
        setCountSalida(d.total ?? 0);
      }
    } catch {
      // silent
    }
  }, [selectedDia, selectedSesion]);

  useEffect(() => {
    fetchAsistencias(
      page,
      search || undefined,
      selectedDia ?? undefined,
      selectedSesion ?? undefined,
      selectedTipo ?? undefined
    );
  }, [fetchAsistencias, page, search, selectedDia, selectedSesion, selectedTipo]);

  useEffect(() => {
    fetchCounts();
  }, [fetchCounts]);

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setPage(1);
      setSearch(searchInput);
    },
    [searchInput]
  );

  const handleActualizarNombres = async () => {
    setUpdatingNames(true);
    let totalActualizados = 0;
    let totalNoEncontrados = 0;

    try {
      let terminado = false;
      while (!terminado) {
        const res = await fetch("/api/asistencias/actualizar-nombres", { method: "POST" });
        if (!res.ok) throw new Error("Error en la peticion");
        const result = await res.json();

        totalActualizados += result.actualizados || 0;
        totalNoEncontrados += result.noEncontrados || 0;
        terminado = result.terminado;

        if (!terminado && result.total > 0) {
          toast.info(`Actualizando... ${totalActualizados} completados, quedan ${result.restantes}`, { duration: 2000 });
        }
      }

      fetchAsistencias(page, search || undefined, selectedDia ?? undefined, selectedSesion ?? undefined, selectedTipo ?? undefined);
      fetchCounts();

      if (totalActualizados > 0) {
        toast.success(`${totalActualizados} nombres actualizados`);
      } else if (totalNoEncontrados === 0) {
        toast.info("No hay registros pendientes");
      }

      if (totalNoEncontrados > 0) {
        toast.warning(`${totalNoEncontrados} DNIs no encontrados en RENIEC`);
      }
    } catch {
      toast.error("Error al actualizar nombres. Intenta de nuevo.");
    } finally {
      setUpdatingNames(false);
    }
  };

  const handleDiaChange = (dia: number | null) => {
    setSelectedDia(dia);
    setSelectedSesion(null);
    setPage(1);
  };

  const handleSesionChange = (sesion: number | null) => {
    setSelectedSesion(sesion);
    setPage(1);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const ok = await eliminar(deleteTarget.id);
    if (ok) {
      toast.success("Registro eliminado");
      fetchAsistencias(page, search || undefined, selectedDia ?? undefined, selectedSesion ?? undefined, selectedTipo ?? undefined);
      fetchCounts();
    } else {
      toast.error("Error al eliminar");
    }
    setDeleteTarget(null);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-primary tracking-tight">Historial de Asistencia</h1>
          <p className="text-sm text-muted mt-0.5">{usuario?.eventoNombre}</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={handleActualizarNombres}
            disabled={updatingNames}
            className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl border border-border shadow-sm text-sm font-medium text-primary hover:bg-surface-alt transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${updatingNames ? "animate-spin" : ""}`} />
            {updatingNames ? "Actualizando..." : "Actualizar Nombres"}
          </button>
          {usuario && (
            <ExportButtons
              eventoNombre={usuario.eventoNombre}
              dia={selectedDia ?? undefined}
              sesion={selectedSesion ?? undefined}
            />
          )}
        </div>
      </div>

      {/* Day selector with dates */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted" />
          <span className="text-sm font-medium text-ink">Fecha:</span>
        </div>
        <div className="flex items-center gap-1 p-1 bg-white border border-border rounded-xl shadow-sm overflow-x-auto">
          <button
            onClick={() => handleDiaChange(null)}
            className={`px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              selectedDia === null
                ? "bg-primary text-accent shadow-sm"
                : "text-muted hover:text-ink hover:bg-surface-alt"
            }`}
          >
            Todos
          </button>
          {availableDias.map((dia) => (
            <button
              key={dia}
              onClick={() => handleDiaChange(dia)}
              className={`flex flex-col items-center px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                selectedDia === dia
                  ? "bg-primary text-accent shadow-sm"
                  : "text-muted hover:text-ink hover:bg-surface-alt"
              }`}
            >
              <span>Día {dia}</span>
              {fechas[dia] && (
                <span className={`text-[0.6rem] mt-0.5 ${selectedDia === dia ? "text-accent/80" : "text-muted"}`}>
                  {formatFechaDia(fechas[dia])}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Session dropdown */}
      {availableSesiones.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-muted" />
            <span className="text-sm font-medium text-ink">Registro:</span>
          </div>
          <div className="relative">
            <select
              value={selectedSesion ?? ""}
              onChange={(e) => handleSesionChange(e.target.value ? parseInt(e.target.value, 10) : null)}
              className="appearance-none bg-white border border-border rounded-xl px-4 py-2 pr-8 text-sm font-medium text-ink shadow-sm cursor-pointer hover:border-accent/40 transition-colors"
            >
              <option value="">Todos los registros</option>
              {availableSesiones.map((s) => (
                <option key={s} value={s}>
                  {s}° Registro de Asistencia
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
          </div>
        </div>
      )}

      {/* Type filter */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => { setSelectedTipo(null); setPage(1); }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all cursor-pointer ${
            selectedTipo === null
              ? "bg-primary text-accent border-primary shadow-sm"
              : "bg-white border-border text-muted hover:border-accent/30"
          }`}
        >
          <span className="text-lg font-bold">{countEntrada + countSalida}</span>
          <span className="text-xs">todos</span>
        </button>
        <button
          onClick={() => { setSelectedTipo(selectedTipo === "entrada" ? null : "entrada"); setPage(1); }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 transition-all cursor-pointer ${
            selectedTipo === "entrada"
              ? "bg-green-600 text-white border-green-600 shadow-sm"
              : "bg-green-50 border-green-200 text-green-700 hover:border-green-400"
          }`}
        >
          <LogIn className="w-4 h-4" />
          <span className="text-lg font-bold">{countEntrada}</span>
          <span className="text-xs font-medium">entradas</span>
        </button>
        <button
          onClick={() => { setSelectedTipo(selectedTipo === "salida" ? null : "salida"); setPage(1); }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 transition-all cursor-pointer ${
            selectedTipo === "salida"
              ? "bg-orange-500 text-white border-orange-500 shadow-sm"
              : "bg-orange-50 border-orange-200 text-orange-600 hover:border-orange-400"
          }`}
        >
          <LogOut className="w-4 h-4" />
          <span className="text-lg font-bold">{countSalida}</span>
          <span className="text-xs font-medium">salidas</span>
        </button>
      </div>

      {/* Search */}
      <div className="mb-4">
        <form onSubmit={handleSearch}>
          <div className="flex items-center gap-2 bg-white border border-border rounded-xl px-4 py-2.5 shadow-sm focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20 transition-all">
            <Search className="w-4 h-4 text-muted" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Buscar por DNI o nombre..."
              className="flex-1 bg-transparent outline-none text-sm"
            />
            {searchInput && (
              <button type="button" onClick={() => { setSearchInput(""); setSearch(""); setPage(1); }} className="text-xs text-muted hover:text-ink">
                Limpiar
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="px-4 py-3 bg-gradient-to-r from-primary to-primary-mid text-white text-sm font-semibold uppercase tracking-wider flex items-center justify-between">
          <span className="flex items-center gap-2">
            <ClipboardList className="w-4 h-4" />
            Registros de Asistencia
            {selectedDia !== null && (
              <span className="text-xs font-normal normal-case opacity-70">
                (Día {selectedDia}{fechas[selectedDia] ? ` — ${formatFechaDia(fechas[selectedDia])}` : ""})
              </span>
            )}
            {selectedSesion !== null && <span className="text-xs font-normal normal-case opacity-70">— {selectedSesion}° Registro</span>}
            {selectedTipo && <span className="text-xs font-normal normal-case opacity-70">— Solo {selectedTipo}s</span>}
          </span>
          <span className="flex items-center gap-2">
            <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">{data?.total ?? 0} registros</span>
            {data && <span className="text-xs opacity-60 font-normal normal-case">Pag {data.page}/{data.totalPages}</span>}
          </span>
        </div>
        <div className="p-4">
          {loading ? (
            <div className="text-center py-12 text-muted">Cargando...</div>
          ) : (
            <AsistenciaTable registros={data?.data ?? []} onDelete={(id, nombre) => setDeleteTarget({ id, nombre })} />
          )}
        </div>
      </div>

      {data && <Pagination page={data.page} totalPages={data.totalPages} onPageChange={setPage} />}
      {deleteTarget && <DeleteModal nombre={deleteTarget.nombre} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />}
    </div>
  );
}
