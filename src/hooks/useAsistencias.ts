"use client";

import { useState, useCallback } from "react";
import type { Asistencia, PaginatedResponse } from "@/interfaces/asistencia.interface";

interface UseAsistenciasOptions {
  eventoId: string;
}

export function useAsistencias({ eventoId }: UseAsistenciasOptions) {
  const [data, setData] = useState<PaginatedResponse<Asistencia> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAsistencias = useCallback(
    async (page = 1, search?: string) => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          eventoId,
          page: String(page),
          limit: "20",
        });
        if (search) params.set("search", search);

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
    [eventoId]
  );

  const registrar = useCallback(
    async (body: Record<string, unknown>) => {
      const res = await fetch("/api/asistencias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, eventoId }),
      });

      const result = await res.json();

      if (!res.ok) {
        return { success: false, error: result.error, duplicado: result.duplicado };
      }

      return { success: true, data: result };
    },
    [eventoId]
  );

  const eliminar = useCallback(async (id: string) => {
    const res = await fetch(`/api/asistencias/${id}`, { method: "DELETE" });
    return res.ok;
  }, []);

  return {
    data,
    loading,
    error,
    fetchAsistencias,
    registrar,
    eliminar,
  };
}
