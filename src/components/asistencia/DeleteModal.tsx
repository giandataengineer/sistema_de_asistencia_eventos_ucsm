"use client";

import { AlertTriangle, X } from "lucide-react";

interface DeleteModalProps {
  nombre: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteModal({ nombre, onConfirm, onCancel }: DeleteModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center
        bg-primary-deep/70 backdrop-blur-sm animate-fadeIn"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-2xl p-6 w-[420px] max-w-[90vw]
          shadow-[0_12px_48px_rgba(15,23,42,0.14)] border border-border
          animate-modalIn"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-red-50">
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
            <h3 className="font-semibold text-ink">Eliminar Registro</h3>
          </div>
          <button
            onClick={onCancel}
            className="p-1 rounded-lg hover:bg-surface-alt transition-colors"
          >
            <X className="w-4 h-4 text-muted" />
          </button>
        </div>

        <p className="text-sm text-ink-light mb-6">
          Esta seguro de eliminar el registro de <strong>{nombre}</strong>?
          Esta accion no se puede deshacer.
        </p>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl font-semibold text-sm
              bg-surface-alt text-ink hover:bg-border transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl font-semibold text-sm
              bg-red-500 text-white hover:bg-red-600 transition-colors"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}
