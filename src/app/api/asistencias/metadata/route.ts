import { NextRequest, NextResponse } from "next/server";
import { asistenciaService } from "@/services/asistencia.service";
import { apiGuard, isGuardError } from "@/lib/api-guard";
import { handleApiError } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const guard = await apiGuard(request);
  if (isGuardError(guard)) return guard;

  try {
    const { searchParams } = new URL(request.url);
    const dia = searchParams.get("dia") ? parseInt(searchParams.get("dia")!, 10) : undefined;

    const [dias, sesiones] = await Promise.all([
      asistenciaService.obtenerDiasEvento(guard.session.eventoId),
      asistenciaService.obtenerSesionesEvento(guard.session.eventoId, dia),
    ]);

    return NextResponse.json({ dias, sesiones });
  } catch (err) {
    return handleApiError(err, "GET /api/asistencias/metadata");
  }
}
