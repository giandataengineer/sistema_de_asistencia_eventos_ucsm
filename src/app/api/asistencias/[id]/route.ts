import { NextRequest, NextResponse } from "next/server";
import { asistenciaService } from "@/services/asistencia.service";
import { prisma } from "@/lib/db";
import { apiGuard, isGuardError } from "@/lib/api-guard";
import { handleApiError } from "@/lib/api-response";
import { RATE_LIMITS } from "@/lib/rate-limiter";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await apiGuard(request, { rateLimit: RATE_LIMITS.write });
  if (isGuardError(guard)) return guard;

  try {
    const { id } = await params;
    const body = await request.json();

    const asistencia = await prisma.asistencia.findUnique({
      where: { id },
      select: { eventoId: true },
    });

    if (!asistencia || asistencia.eventoId !== guard.session.eventoId) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }

    const updated = await prisma.asistencia.update({
      where: { id },
      data: {
        ...(body.nombres && { nombres: String(body.nombres).slice(0, 150) }),
        ...(body.apellidoPaterno && { apellidoPaterno: String(body.apellidoPaterno).slice(0, 100) }),
        ...(body.apellidoMaterno !== undefined && { apellidoMaterno: body.apellidoMaterno ? String(body.apellidoMaterno).slice(0, 100) : null }),
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    return handleApiError(err, "PATCH /api/asistencias/[id]");
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await apiGuard(request, { rateLimit: RATE_LIMITS.write });
  if (isGuardError(guard)) return guard;

  try {
    const { id } = await params;

    const asistencia = await prisma.asistencia.findUnique({
      where: { id },
      select: { eventoId: true },
    });

    if (!asistencia || asistencia.eventoId !== guard.session.eventoId) {
      return NextResponse.json({ error: "Registro no encontrado" }, { status: 404 });
    }

    await asistenciaService.eliminar(id);
    return NextResponse.json({ message: "Registro eliminado" });
  } catch (err) {
    return handleApiError(err, "DELETE /api/asistencias/[id]");
  }
}
