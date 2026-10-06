import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiGuard, isGuardError } from "@/lib/api-guard";
import { asistenciaService } from "@/services/asistencia.service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const guard = await apiGuard(request);
  if (isGuardError(guard)) return guard;

  const eventoId = guard.session.eventoId;

  const [evento, diasConfig, diasMeta] = await Promise.all([
    prisma.evento.findUnique({
      where: { id: eventoId },
      select: { fechaInicio: true, fechaFin: true },
    }),
    prisma.diaEvento.findMany({
      where: { eventoId },
      orderBy: { dia: "asc" },
    }),
    asistenciaService.obtenerDiasEvento(eventoId),
  ]);

  const inicio = evento ? new Date(evento.fechaInicio) : new Date();
  inicio.setHours(0, 0, 0, 0);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const diffMs = hoy.getTime() - inicio.getTime();
  const diaActual = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1);

  let totalDias = 1;
  if (evento?.fechaFin) {
    const fin = new Date(evento.fechaFin);
    fin.setHours(0, 0, 0, 0);
    totalDias = Math.max(1, Math.floor((fin.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24)) + 1);
  }

  const fechas: Record<number, string> = {};
  for (let i = 0; i < totalDias; i++) {
    const fecha = new Date(inicio);
    fecha.setDate(fecha.getDate() + i);
    fechas[i + 1] = fecha.toISOString().split("T")[0];
  }

  return NextResponse.json({
    diaActual: Math.min(diaActual, totalDias),
    totalDias,
    fechas,
    diasConfig,
    diasMeta,
  });
}
