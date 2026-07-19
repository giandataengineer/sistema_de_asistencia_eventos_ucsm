import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiGuard, isGuardError } from "@/lib/api-guard";
import { handleApiError } from "@/lib/api-response";
import { RATE_LIMITS } from "@/lib/rate-limiter";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const guard = await apiGuard(req, { rateLimit: RATE_LIMITS.write });
  if (isGuardError(guard)) return guard;

  try {
    const { fechaInicio, fechaFin } = (await req.json()) as {
      fechaInicio: string;
      fechaFin: string;
    };

    const startDate = new Date(fechaInicio);
    const endDate = new Date(fechaFin);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json({ error: "Fechas invalidas" }, { status: 400 });
    }

    if (endDate < startDate) {
      return NextResponse.json({ error: "La fecha fin debe ser posterior a la fecha inicio" }, { status: 400 });
    }

    const updated = await prisma.evento.update({
      where: { id: guard.session.eventoId },
      data: {
        fechaInicio: startDate,
        fechaFin: endDate,
      },
    });

    return NextResponse.json({
      success: true,
      fechaInicio: updated.fechaInicio,
      fechaFin: updated.fechaFin,
    });
  } catch (err) {
    return handleApiError(err, "POST /api/eventos/fix-fechas");
  }
}
