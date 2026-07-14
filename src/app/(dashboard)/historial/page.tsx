"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useAsistencias } from "@/hooks/useAsistencias";
import AsistenciaTable from "@/components/asistencia/AsistenciaTable";
import ExportButtons from "@/components/asistencia/ExportButtons";
import Pagination from "@/components/asistencia/Pagination";
import DeleteModal from "@/components/asistencia/DeleteModal";
import { toast } from "sonner";
import { Search, Users, Calendar, RefreshCw, LogIn, LogOut } from "lucide-react";
import type { Asistencia, PaginatedResponse } from "@/interfaces/asistencia.interface";

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
  const [pageEntrada, setPageEntrada] = useState(1);
  const [pageSalida, setPageSalida] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [selectedDia, setSelectedDia] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; nombre: string } | null>(null);
  const [updatingNames, setUpdatingNames] = useState(false);

  const [dataEntrada, setDataEntrada] = useState<PaginatedResponse<Asistencia> | null>(null);
  const [dataSalida, setDataSalida] = useState<PaginatedResponse<Asistencia> | null>(null);
  const [loadingEntrada, setLoadingEntrada] = useState(false);
  const [loadingSalida, setLoadingSalida] = useState(false);

  const { eliminar } = useAsistencias();

  const fetchSection = useCallback(
    async (
      tipo: string,
      page: number,
      searchVal?: string,
      dia?: number
    ) => {
      const params = new URLSearchParams({
        page: String(page),
        limit: "20",
        tipo,
      });
      if (searchVal) params.set("search", searchVal);
      if (dia) params.set("dia", String(dia));

      const res = await fetch(`/api/asistencias?${params}`);
      if (!res.ok) throw new Error("Error al obtener asistencias");
      return res.json() as Promise<PaginatedResponse<Asistencia>>;
    },
    []
  );

  const fetchEntradas = useCallback(async () => {
    setLoadingEntrada(true);
    try {
      const result = await fetchSection("entrada", pageEntrada, search || undefined, selectedDia || undefined);
      setDataEntrada(result);
    } catch {
      // silent
    } finally {
      setLoadingEntrada(false);
    }
  }, [fetchSection, pageEntrada, search, selectedDia]);

  const fetchSalidas = useCallback(async () => {
    setLoadingSalida(true);
    try {
      const result = await fetchSection("salida", pageSalida, search || undefined, selectedDia || undefined);
      setDataSalida(result);
    } catch {
      // silent
    } finally {
      setLoadingSalida(false);
    }
  }, [fetchSection, pageSalida, search, selectedDia]);

  useEffect(() => {
    fetchEntradas();
  }, [fetchEntradas]);

  useEffect(() => {
    fetchSalidas();
  }, [fetchSalidas]);

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setPageEntrada(1);
      setPageSalida(1);
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

      fetchEntradas();
      fetchSalidas();

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
    setPageEntrada(1);
    setPageSalida(1);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const ok = await eliminar(deleteTarget.id);
    if (ok) {
      toast.success("Registro eliminado");
      fetchEntradas();
      fetchSalidas();
    } else {
      toast.error("Error al eliminar");
    }
    setDeleteTarget(null);
  };

  const totalGeneral = (dataEntrada?.total ?? 0) + (dataSalida?.total ?? 0);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-primary tracking-tight">Historial de Asistencia</h1>
          <p className="text-sm text-muted mt-0.5">{usuario?.eventoNombre}</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl border border-border shadow-sm text-sm">
            <Users className="w-4 h-4 text-accent" />
            <span className="font-bold text-primary">{totalGeneral}</span>
            <span className="text-muted">total</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-green-50 rounded-lg border border-green-200">
              <LogIn className="w-3.5 h-3.5 text-green-600" />
              <span className="font-bold text-green-700">{dataEntrada?.total ?? 0}</span>
              <span className="text-green-600 text-xs">entradas</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-orange-50 rounded-lg border border-orange-200">
              <LogOut className="w-3.5 h-3.5 text-orange-500" />
              <span className="font-bold text-orange-600">{dataSalida?.total ?? 0}</span>
              <span className="text-orange-500 text-xs">salidas</span>
            </div>
          </div>
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

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
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
              <button type="button" onClick={() => { setSearchInput(""); setSearch(""); setPageEntrada(1); setPageSalida(1); }} className="text-xs text-muted hover:text-ink">
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

      {/* ENTRADAS Section */}
      <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden mb-6">
        <div className="px-4 py-3 bg-gradient-to-r from-green-700 to-green-600 text-white text-sm font-semibold uppercase tracking-wider flex items-center justify-between">
          <span className="flex items-center gap-2">
            <LogIn className="w-4 h-4" />
            Registros de Entrada
            {selectedDia > 0 && <span className="text-xs font-normal normal-case opacity-70">(Dia {selectedDia})</span>}
          </span>
          <span className="flex items-center gap-2">
            <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">{dataEntrada?.total ?? 0} registros</span>
            {dataEntrada && <span className="text-xs opacity-60 font-normal normal-case">Pag {dataEntrada.page}/{dataEntrada.totalPages}</span>}
          </span>
        </div>
        <div className="p-4">
          {loadingEntrada ? (
            <div className="text-center py-8 text-muted">Cargando entradas...</div>
          ) : (
            <AsistenciaTable registros={dataEntrada?.data ?? []} onDelete={(id, nombre) => setDeleteTarget({ id, nombre })} />
          )}
        </div>
        {dataEntrada && dataEntrada.totalPages > 1 && (
          <div className="px-4 pb-4">
            <Pagination page={dataEntrada.page} totalPages={dataEntrada.totalPages} onPageChange={setPageEntrada} />
          </div>
        )}
      </div>

      {/* SALIDAS Section */}
      <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="px-4 py-3 bg-gradient-to-r from-orange-600 to-orange-500 text-white text-sm font-semibold uppercase tracking-wider flex items-center justify-between">
          <span className="flex items-center gap-2">
            <LogOut className="w-4 h-4" />
            Registros de Salida
            {selectedDia > 0 && <span className="text-xs font-normal normal-case opacity-70">(Dia {selectedDia})</span>}
          </span>
          <span className="flex items-center gap-2">
            <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">{dataSalida?.total ?? 0} registros</span>
            {dataSalida && dataSalida.totalPages > 0 && <span className="text-xs opacity-60 font-normal normal-case">Pag {dataSalida.page}/{dataSalida.totalPages}</span>}
          </span>
        </div>
        <div className="p-4">
          {loadingSalida ? (
            <div className="text-center py-8 text-muted">Cargando salidas...</div>
          ) : dataSalida && dataSalida.total === 0 ? (
            <div className="text-center py-8 text-muted">
              <LogOut className="w-8 h-8 mx-auto mb-2 text-orange-300" />
              <p className="text-sm font-medium">Sin registros de salida</p>
              <p className="text-xs mt-1">Los registros apareceran aqui cuando se registren salidas</p>
            </div>
          ) : (
            <AsistenciaTable registros={dataSalida?.data ?? []} onDelete={(id, nombre) => setDeleteTarget({ id, nombre })} />
          )}
        </div>
        {dataSalida && dataSalida.totalPages > 1 && (
          <div className="px-4 pb-4">
            <Pagination page={dataSalida.page} totalPages={dataSalida.totalPages} onPageChange={setPageSalida} />
          </div>
        )}
      </div>

      {deleteTarget && <DeleteModal nombre={deleteTarget.nombre} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />}
    </div>
  );
}
