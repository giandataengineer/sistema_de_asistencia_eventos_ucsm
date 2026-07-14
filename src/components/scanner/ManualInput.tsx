"use client";

import { useState, useCallback } from "react";
import { Keyboard, Search, Loader2, UserCheck } from "lucide-react";

interface ManualInputProps {
  onDniDetected: (dni: string) => void;
  loading?: boolean;
  lastResult?: { nombre: string; success: boolean } | null;
}

export default function ManualInput({ onDniDetected, loading = false, lastResult }: ManualInputProps) {
  const [dni, setDni] = useState("");

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value.replace(/\D/g, "");
      setDni(value);

      if (value.length === 8) {
        onDniDetected(value);
        setTimeout(() => setDni(""), 500);
      }
    },
    [onDniDetected]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (dni.length === 8) {
      onDniDetected(dni);
      setTimeout(() => setDni(""), 500);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Keyboard className="w-5 h-5 text-accent" />
        <h3 className="font-semibold text-ink">Ingreso Manual</h3>
      </div>

      <div>
        <label className="block text-sm font-medium text-ink-light mb-1">
          Numero de DNI
        </label>
        <div className="relative">
          <input
            type="text"
            inputMode="numeric"
            maxLength={8}
            value={dni}
            onChange={handleChange}
            placeholder="Ingrese 8 digitos del DNI"
            className="w-full px-4 py-3 rounded-xl border border-border bg-white
              focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none
              transition-all text-sm font-mono text-lg tracking-widest text-center"
            autoFocus
          />
          {loading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Loader2 className="w-5 h-5 animate-spin text-accent" />
            </div>
          )}
        </div>
        <p className="text-xs text-muted mt-2 text-center">
          Al ingresar 8 digitos, se consultara automaticamente la API RENIEC y se registrara la asistencia
        </p>
      </div>

      {lastResult && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${
          lastResult.success
            ? "bg-accent/10 text-accent-dim"
            : "bg-red-50 text-red-600"
        }`}>
          {lastResult.success ? (
            <UserCheck className="w-4 h-4 flex-shrink-0" />
          ) : (
            <Search className="w-4 h-4 flex-shrink-0" />
          )}
          <span>{lastResult.nombre}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={dni.length !== 8 || loading}
        className="w-full py-3 rounded-xl font-bold text-sm
          bg-gradient-to-r from-accent-dim to-accent text-primary-deep
          hover:shadow-[0_8px_24px_rgba(0,230,118,0.35)]
          hover:-translate-y-0.5 transition-all
          disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0
          disabled:hover:shadow-none flex items-center justify-center gap-2"
      >
        <Search className="w-4 h-4" />
        Buscar y Registrar
      </button>
    </form>
  );
}
