"use client";

import type { Asistencia } from "@/interfaces/asistencia.interface";
import { formatDatePeru, formatTimePeru } from "@/lib/utils";
import { Trash2 } from "lucide-react";

interface AsistenciaTableProps {
  registros: Asistencia[];
  onDelete: (id: string, nombre: string) => void;
}

export default function AsistenciaTable({ registros, onDelete }: AsistenciaTableProps) {
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
              <th className="px-3 py-2.5 text-center font-semibold text-xs uppercase tracking-wider">Dia</th>
              <th className="px-3 py-2.5 text-left font-semibold text-xs uppercase tracking-wider">Fecha</th>
              <th className="px-3 py-2.5 text-left font-semibold text-xs uppercase tracking-wider">Hora</th>
              <th className="px-3 py-2.5 text-center font-semibold text-xs uppercase tracking-wider">Accion</th>
            </tr>
          </thead>
          <tbody>
            {registros.map((r, i) => {
              const nombreCompleto = [r.apellidoPaterno, r.apellidoMaterno, r.nombres]
                .filter(Boolean)
                .join(" ");
              return (
                <tr
                  key={r.id}
                  className="border-b border-border hover:bg-accent/5 transition-colors"
                >
                  <td className="px-3 py-2.5 text-muted">{i + 1}</td>
                  <td className="px-3 py-2.5 font-mono font-medium">{r.numeroDni}</td>
                  <td className="px-3 py-2.5">{nombreCompleto}</td>
                  <td className="px-3 py-2.5 text-center">
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary">
                      {r.dia}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-muted">{formatDatePeru(new Date(r.fechaRegistro))}</td>
                  <td className="px-3 py-2.5 text-muted">{formatTimePeru(new Date(r.fechaRegistro))}</td>
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
          return (
            <div
              key={r.id}
              className="bg-white rounded-xl border border-border p-4
                border-l-4 border-l-accent shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-medium text-sm text-ink">{nombreCompleto}</p>
                  <p className="text-xs text-muted mt-0.5 font-mono">{r.numeroDni}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary">
                    Dia {r.dia}
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
                <span>{formatDatePeru(new Date(r.fechaRegistro))}</span>
                <span>{formatTimePeru(new Date(r.fechaRegistro))}</span>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
