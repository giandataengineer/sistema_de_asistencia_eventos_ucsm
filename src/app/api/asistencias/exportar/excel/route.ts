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
    const eventoNombre = searchParams.get("eventoNombre")?.slice(0, 100) || "Asistencia";
    const dia = searchParams.get("dia");
    const sesion = searchParams.get("sesion");
    const diaNum = dia ? parseInt(dia, 10) : undefined;
    const sesionNum = sesion ? parseInt(sesion, 10) : undefined;

    const buffer = await exportService.generateExcel(guard.session.eventoId, eventoNombre, diaNum, sesionNum);

    const suffix = [dia && `_dia${dia}`, sesion && `_sesion${sesion}`].filter(Boolean).join("");

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename=asistencia${suffix}.xlsx`,
      },
    });
  } catch (err) {
    return handleApiError(err, "GET /api/asistencias/exportar/excel");
  }
}
