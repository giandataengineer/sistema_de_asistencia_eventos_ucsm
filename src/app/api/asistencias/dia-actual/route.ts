import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiGuard, isGuardError } from "@/lib/api-guard";
import { handleApiError } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const guard = await apiGuard(request);
  if (isGuardError(guard)) return guard;

  try {
    const evento = await prisma.evento.findUnique({
      where: { id: guard.session.eventoId },
      select: { fechaInicio: true, fechaFin: true },
    });

    if (!evento) {
      return NextResponse.json({ dia: 1, totalDias: 1, fechas: {} });
    }

    const inicio = new Date(evento.fechaInicio);
    inicio.setHours(0, 0, 0, 0);

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const diffMs = hoy.getTime() - inicio.getTime();
    const dia = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1);

    let totalDias = 1;
    if (evento.fechaFin) {
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
      dia: Math.min(dia, totalDias),
      totalDias,
      fechas,
    });
  } catch (err) {
    return handleApiError(err, "GET /api/asistencias/dia-actual");
  }
}
