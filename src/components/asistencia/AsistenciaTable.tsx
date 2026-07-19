"use client";

import { useMemo } from "react";
import type { Asistencia } from "@/interfaces/asistencia.interface";
import { formatTimePeru } from "@/lib/utils";
import { Trash2 } from "lucide-react";

interface AsistenciaTableProps {
  registros: Asistencia[];
  onDelete: (id: string, nombre: string) => void;
}

function calcularPermanencia(registros: Asistencia[], r: Asistencia): string | null {
  if (r.tipo !== "salida") return null;

  const entrada = registros.find(
    (e) => e.numeroDni === r.numeroDni && e.dia === r.dia && e.sesion === r.sesion && e.tipo === "entrada" && !e.eliminado
  );
  if (!entrada) return null;

  const msEntrada = new Date(entrada.fechaRegistro).getTime();
  const msSalida = new Date(r.fechaRegistro).getTime();
  const diffMs = msSalida - msEntrada;

  if (diffMs < 0) return null;

  const horas = Math.floor(diffMs / 3600000);
  const minutos = Math.floor((diffMs % 3600000) / 60000);

  if (horas > 0) return `${horas}h ${minutos}min`;
  return `${minutos}min`;
}

export default function AsistenciaTable({ registros, onDelete }: AsistenciaTableProps) {
  const permanenciaMap = useMemo(() => {
    const map = new Map<string, string | null>();
    for (const r of registros) {
      map.set(r.id, calcularPermanencia(registros, r));
    }
    return map;
  }, [registros]);

  if (registros.length === 0) {
    return (
      <div className="text-center py-12 text-muted">
        <p className="text-lg font-medium">Sin registros</p>
        <p className="text-sm mt-1">Escanee un DNI para comenzar</p>
      </div>
    );
  }

  return (
    <>
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gradient-to-r from-primary to-primary-mid text-accent">
              <th className="px-3 py-2.5 text-left font-semibold text-xs uppercase tracking-wider">N</th>
              <th className="px-3 py-2.5 text-left font-semibold text-xs uppercase tracking-wider">DNI</th>
              <th className="px-3 py-2.5 text-left font-semibold text-xs uppercase tracking-wider">Apellidos y Nombres</th>
              <th className="px-3 py-2.5 text-center font-semibold text-xs uppercase tracking-wider">Tipo</th>
              <th className="px-3 py-2.5 text-center font-semibold text-xs uppercase tracking-wider">Etiqueta</th>
              <th className="px-3 py-2.5 text-center font-semibold text-xs uppercase tracking-wider">Sesión</th>
              <th className="px-3 py-2.5 text-left font-semibold text-xs uppercase tracking-wider">Hora</th>
              <th className="px-3 py-2.5 text-center font-semibold text-xs uppercase tracking-wider">Permanencia</th>
              <th className="px-3 py-2.5 text-center font-semibold text-xs uppercase tracking-wider">Accion</th>
            </tr>
          </thead>
          <tbody>
            {registros.map((r, i) => {
              const nombreCompleto = [r.apellidoPaterno, r.apellidoMaterno, r.nombres]
                .filter(Boolean)
                .join(" ");
              const permanencia = permanenciaMap.get(r.id);
              return (
                <tr
                  key={r.id}
                  className="border-b border-border hover:bg-accent/5 transition-colors"
                >
                  <td className="px-3 py-2.5 text-muted">{i + 1}</td>
                  <td className="px-3 py-2.5 font-mono font-medium">{r.numeroDni}</td>
                  <td className="px-3 py-2.5">{nombreCompleto}</td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      r.tipo === "salida" ? "bg-orange-100 text-orange-600" : "bg-green-100 text-green-700"
                    }`}>
                      {r.tipo === "salida" ? "Salida" : "Entrada"}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      r.etiqueta === "organizador"
                        ? "bg-purple-100 text-purple-700"
                        : "bg-blue-100 text-blue-700"
                    }`}>
                      {r.etiqueta === "organizador" ? "Organizador" : "Participante"}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary">
                      {r.sesion}°
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-muted">{formatTimePeru(new Date(r.fechaRegistro))}</td>
                  <td className="px-3 py-2.5 text-center">
                    {permanencia ? (
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                        {permanencia}
                      </span>
                    ) : r.tipo === "entrada" ? (
                      <span className="text-xs text-muted">—</span>
                    ) : null}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <button
                      onClick={() => onDelete(r.id, nombreCompleto)}
                      className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600
                        transition-colors"
                      title="Eliminar registro"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="md:hidden space-y-3">
        {registros.map((r, i) => {
          const nombreCompleto = [r.apellidoPaterno, r.apellidoMaterno, r.nombres]
            .filter(Boolean)
            .join(" ");
          const permanencia = permanenciaMap.get(r.id);
          return (
            <div
              key={r.id}
              className={`bg-white rounded-xl border border-border p-4
                border-l-4 ${r.tipo === "salida" ? "border-l-orange-400" : "border-l-accent"} shadow-sm`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-medium text-sm text-ink">{nombreCompleto}</p>
                  <p className="text-xs text-muted mt-0.5 font-mono">{r.numeroDni}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    r.tipo === "salida" ? "bg-orange-100 text-orange-600" : "bg-green-100 text-green-700"
                  }`}>
                    {r.tipo === "salida" ? "Salida" : "Entrada"}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary">
                    {r.sesion}°
                  </span>
                  <button
                    onClick={() => onDelete(r.id, nombreCompleto)}
                    className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-2 text-xs text-muted">
                <span>#{i + 1}</span>
                <span>{formatTimePeru(new Date(r.fechaRegistro))}</span>
                {permanencia && (
                  <span className="px-2 py-0.5 rounded-full font-bold bg-blue-100 text-blue-700">
                    {permanencia}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
