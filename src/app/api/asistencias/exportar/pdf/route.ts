import { NextRequest, NextResponse } from "next/server";
import { exportService } from "@/services/export.service";
import { apiGuard, isGuardError } from "@/lib/api-guard";
import { handleApiError } from "@/lib/api-response";
import { RATE_LIMITS } from "@/lib/rate-limiter";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const guard = await apiGuard(request, { rateLimit: RATE_LIMITS.export });
  if (isGuardError(guard)) return guard;

  try {
    const { searchParams } = new URL(request.url);
    const eventoNombre = searchParams.get("eventoNombre")?.slice(0, 100) || "Evento";
    const dia = searchParams.get("dia");
    const sesion = searchParams.get("sesion");
    const diaNum = dia ? parseInt(dia, 10) : undefined;
    const sesionNum = sesion ? parseInt(sesion, 10) : undefined;

    const data = await exportService.getDataForPDF(guard.session.eventoId, eventoNombre, diaNum, sesionNum);
    return NextResponse.json(data);
  } catch (err) {
    return handleApiError(err, "GET /api/asistencias/exportar/pdf");
  }
}
