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
    const dia = searchParams.get("dia");
    const sesion = searchParams.get("sesion");
    const diaNum = dia ? parseInt(dia, 10) : undefined;
    const sesionNum = sesion ? parseInt(sesion, 10) : undefined;

    const csv = await exportService.generateCSV(guard.session.eventoId, diaNum, sesionNum);

    const suffix = [dia && `_dia${dia}`, sesion && `_sesion${sesion}`].filter(Boolean).join("");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename=asistencia${suffix}.csv`,
      },
    });
  } catch (err) {
    return handleApiError(err, "GET /api/asistencias/exportar/csv");
  }
}
