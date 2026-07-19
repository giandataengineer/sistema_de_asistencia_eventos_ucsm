import { NextRequest } from "next/server";
import { asistenciaRepository } from "@/repositories/asistencia.repository";
import { success, handleApiError } from "@/lib/api-response";
import { apiGuard, isGuardError } from "@/lib/api-guard";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const guard = await apiGuard(request);
  if (isGuardError(guard)) return guard;

  try {
    const analytics = await asistenciaRepository.getAnalytics(guard.session.eventoId);
    return success(analytics);
  } catch (err) {
    return handleApiError(err, "GET /api/analytics");
  }
}
