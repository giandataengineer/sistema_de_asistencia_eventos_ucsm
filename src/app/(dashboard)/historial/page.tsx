"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useAsistencias } from "@/hooks/useAsistencias";
import AsistenciaTable from "@/components/asistencia/AsistenciaTable";
import ExportButtons from "@/components/asistencia/ExportButtons";
import Pagination from "@/components/asistencia/Pagination";
import DeleteModal from "@/components/asistencia/DeleteModal";
import { toast } from "sonner";
import { Search, Users, Calendar } from "lucide-react";

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
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; nombre: string } | null>(null);

  const { data, loading, fetchAsistencias, eliminar } = useAsistencias();

  useEffect(() => {
    fetchAsistencias(page, search || undefined, selectedDia || undefined);
  }, [fetchAsistencias, page, search, selectedDia]);

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setPage(1);
      setSearch(searchInput);
    },
    [searchInput]
  );

  const handleDiaChange = (dia: number) => {
    setSelectedDia(dia);
    setPage(1);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const ok = await eliminar(deleteTarget.id);
    if (ok) {
      toast.success("Registro eliminado");
      fetchAsistencias(page, search || undefined, selectedDia || undefined);
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
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl border border-border shadow-sm text-sm">
            <Users className="w-4 h-4 text-accent" />
            <span className="font-bold text-primary">{data?.total ?? 0}</span>
            <span className="text-muted">total</span>
          </div>
          {usuario && (
            <ExportButtons
              eventoNombre={usuario.eventoNombre}
              dia={selectedDia || undefined}
            />
          )}
        </div>
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
        <div className="px-4 py-3 bg-gradient-to-r from-primary to-primary-mid text-accent text-sm font-semibold uppercase tracking-wider flex items-center justify-between">
          <span>
            Registros de Asistencia
            {selectedDia > 0 && <span className="ml-2 text-xs font-normal normal-case opacity-70">(Dia {selectedDia})</span>}
          </span>
          {data && <span className="text-xs text-accent/60 font-normal normal-case">Pagina {data.page} de {data.totalPages}</span>}
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
