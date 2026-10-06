"use client";

import { useState, useCallback } from "react";
import type { Asistencia, PaginatedResponse } from "@/interfaces/asistencia.interface";

export function useAsistencias() {
  const [data, setData] = useState<PaginatedResponse<Asistencia> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAsistencias = useCallback(
    async (page = 1, search?: string, dia?: number, sesion?: number, tipo?: string) => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: "20",
        });
        if (search) params.set("search", search);
        if (dia) params.set("dia", String(dia));
        if (sesion) params.set("sesion", String(sesion));
        if (tipo) params.set("tipo", tipo);

        const res = await fetch(`/api/asistencias?${params}`);
        if (!res.ok) throw new Error("Error al obtener asistencias");

        const result = await res.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const registrar = useCallback(
    async (body: Record<string, unknown>) => {
      const res = await fetch("/api/asistencias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const result = await res.json();

      if (!res.ok) {
        return { success: false, error: result.error, duplicado: result.duplicado };
      }

      return { success: true, data: result };
    },
    []
  );

  const eliminar = useCallback(async (id: string) => {
    const res = await fetch(`/api/asistencias/${id}`, { method: "DELETE" });
    return res.ok;
  }, []);

  const consultarDni = useCallback(async (dni: string) => {
    const res = await fetch(`/api/reniec?dni=${dni}`);
    if (!res.ok) {
      const err = await res.json();
      return { success: false, error: err.error || "DNI no encontrado" };
    }
    const data = await res.json();
    return { success: true, data };
  }, []);

  const verificarPago = useCallback(
    async (apellidoPaterno: string, apellidoMaterno?: string | null, nombres?: string | null) => {
      try {
        const res = await fetch("/api/participantes/buscar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ apellidoPaterno, apellidoMaterno, nombres }),
        });
        if (!res.ok) return { found: false, estadoPago: "NO REGISTRADO" };
        return await res.json();
      } catch {
        return { found: false, estadoPago: "ERROR" };
      }
    },
    []
  );

  return {
    data,
    loading,
    error,
    fetchAsistencias,
    registrar,
    eliminar,
    consultarDni,
    verificarPago,
  };
}
