"use client";

import { useState } from "react";
import { Keyboard, Send } from "lucide-react";

interface ManualInputProps {
  onSubmit: (data: {
    numeroDni: string;
    apellidoPaterno: string;
    apellidoMaterno: string;
    nombres: string;
  }) => void;
}

export default function ManualInput({ onSubmit }: ManualInputProps) {
  const [form, setForm] = useState({
    numeroDni: "",
    apellidoPaterno: "",
    apellidoMaterno: "",
    nombres: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.numeroDni.length !== 8) return;
    if (!form.apellidoPaterno.trim() || !form.nombres.trim()) return;
    onSubmit(form);
    setForm({ numeroDni: "", apellidoPaterno: "", apellidoMaterno: "", nombres: "" });
  };

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
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
        <input
          type="text"
          inputMode="numeric"
          maxLength={8}
          value={form.numeroDni}
          onChange={(e) => updateField("numeroDni", e.target.value.replace(/\D/g, ""))}
          placeholder="12345678"
          className="w-full px-4 py-2.5 rounded-xl border border-border bg-white
            focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none
            transition-all text-sm"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-ink-light mb-1">
          Apellido Paterno
        </label>
        <input
          type="text"
          value={form.apellidoPaterno}
          onChange={(e) => updateField("apellidoPaterno", e.target.value.toUpperCase())}
          placeholder="GARCIA"
          className="w-full px-4 py-2.5 rounded-xl border border-border bg-white
            focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none
            transition-all text-sm"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-ink-light mb-1">
          Apellido Materno
        </label>
        <input
          type="text"
          value={form.apellidoMaterno}
          onChange={(e) => updateField("apellidoMaterno", e.target.value.toUpperCase())}
          placeholder="LOPEZ"
          className="w-full px-4 py-2.5 rounded-xl border border-border bg-white
            focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none
            transition-all text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-ink-light mb-1">
          Nombres
        </label>
        <input
          type="text"
          value={form.nombres}
          onChange={(e) => updateField("nombres", e.target.value.toUpperCase())}
          placeholder="JUAN CARLOS"
          className="w-full px-4 py-2.5 rounded-xl border border-border bg-white
            focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none
            transition-all text-sm"
          required
        />
      </div>

      <button
        type="submit"
        disabled={form.numeroDni.length !== 8 || !form.apellidoPaterno || !form.nombres}
        className="w-full py-3 rounded-xl font-bold text-sm
          bg-gradient-to-r from-accent-dim to-accent text-primary-deep
          hover:shadow-[0_8px_24px_rgba(0,230,118,0.35)]
          hover:-translate-y-0.5 transition-all
          disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0
          disabled:hover:shadow-none flex items-center justify-center gap-2"
      >
        <Send className="w-4 h-4" />
        Registrar Asistencia
      </button>
    </form>
  );
}
