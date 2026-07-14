"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useAsistencias } from "@/hooks/useAsistencias";
import AsistenciaTable from "@/components/asistencia/AsistenciaTable";
import ExportButtons from "@/components/asistencia/ExportButtons";
import Pagination from "@/components/asistencia/Pagination";
import DeleteModal from "@/components/asistencia/DeleteModal";
import { toast } from "sonner";
import { Search, Calendar, RefreshCw, LogIn, LogOut } from "lucide-react";

const DAY_OPTIONS = [
  { value: 0, label: "Todos" },
  { value: 1, label: "Dia 1" },
  { value: 2, label: "Dia 2" },
  { value: 3, label: "Dia 3" },
  { value: 4, label: "Dia 4" },
  { value: 5, label: "Dia 5" },
];

export default function HistorialPage() {
  const { usuario } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [selectedDia, setSelectedDia] = useState(0);
  const [selectedTipo, setSelectedTipo] = useState<"entrada" | "salida">("entrada");
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; nombre: string } | null>(null);
  const [updatingNames, setUpdatingNames] = useState(false);
  const [countEntrada, setCountEntrada] = useState(0);
  const [countSalida, setCountSalida] = useState(0);

  const { data, loading, fetchAsistencias, eliminar } = useAsistencias();

  const fetchCounts = useCallback(async () => {
    try {
      const diaParam = selectedDia ? `&dia=${selectedDia}` : "";
      const [resE, resS] = await Promise.all([
        fetch(`/api/asistencias?limit=1&tipo=entrada${diaParam}`),
        fetch(`/api/asistencias?limit=1&tipo=salida${diaParam}`),
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
  }, [selectedDia]);

  useEffect(() => {
    fetchAsistencias(page, search || undefined, selectedDia || undefined, selectedTipo);
  }, [fetchAsistencias, page, search, selectedDia, selectedTipo]);

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

      fetchAsistencias(page, search || undefined, selectedDia || undefined, selectedTipo);
      fetchCounts();

      if (totalActualizados > 0) {
        toast.success(`${totalActualizados} nombres actualizados`);
      } else if (totalNoEncontrados === 0) {
        toast.info("No hay registros pendientes");
      }

      if (totalNoEncontrados > 0) {
        toast.warning(`${totalNoEncontrados} DNIs no encontrados en RENIEC (marcados como POR VERIFICAR)`);
      }
    } catch {
      toast.error("Error al actualizar nombres. Intenta de nuevo.");
    } finally {
      setUpdatingNames(false);
    }
  };

  const handleDiaChange = (dia: number) => {
    setSelectedDia(dia);
    setPage(1);
  };

  const handleTipoChange = (tipo: "entrada" | "salida") => {
    setSelectedTipo(tipo);
    setPage(1);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const ok = await eliminar(deleteTarget.id);
    if (ok) {
      toast.success("Registro eliminado");
      fetchAsistencias(page, search || undefined, selectedDia || undefined, selectedTipo);
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
              dia={selectedDia || undefined}
            />
          )}
        </div>
      </div>

      {/* Entrada / Salida toggle buttons with counts */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => handleTipoChange("entrada")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-bold transition-all ${
            selectedTipo === "entrada"
              ? "bg-green-50 border-green-500 text-green-700 shadow-sm"
              : "bg-white border-border text-muted hover:border-green-300 hover:text-green-600"
          }`}
        >
          <LogIn className="w-4 h-4" />
          <span className="text-lg">{countEntrada}</span>
          <span className="text-xs font-medium">entradas</span>
        </button>
        <button
          onClick={() => handleTipoChange("salida")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-bold transition-all ${
            selectedTipo === "salida"
              ? "bg-orange-50 border-orange-500 text-orange-600 shadow-sm"
              : "bg-white border-border text-muted hover:border-orange-300 hover:text-orange-500"
          }`}
        >
          <LogOut className="w-4 h-4" />
          <span className="text-lg">{countSalida}</span>
          <span className="text-xs font-medium">salidas</span>
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <form onSubmit={handleSearch} className="flex-1">
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

        <div className="flex items-center gap-1 p-1 bg-white border border-border rounded-xl shadow-sm overflow-x-auto">
          <Calendar className="w-4 h-4 text-muted ml-2 flex-shrink-0" />
          {DAY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleDiaChange(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                selectedDia === opt.value
                  ? "bg-primary text-accent shadow-sm"
                  : "text-muted hover:text-ink hover:bg-surface-alt"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
        <div className={`px-4 py-3 text-white text-sm font-semibold uppercase tracking-wider flex items-center justify-between ${
          selectedTipo === "entrada"
            ? "bg-gradient-to-r from-green-700 to-green-600"
            : "bg-gradient-to-r from-orange-600 to-orange-500"
        }`}>
          <span className="flex items-center gap-2">
            {selectedTipo === "entrada" ? <LogIn className="w-4 h-4" /> : <LogOut className="w-4 h-4" />}
            Registros de {selectedTipo === "entrada" ? "Entrada" : "Salida"}
            {selectedDia > 0 && <span className="text-xs font-normal normal-case opacity-70">(Dia {selectedDia})</span>}
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
