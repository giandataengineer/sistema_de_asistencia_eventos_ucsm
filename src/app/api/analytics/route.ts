import { getSession } from "@/lib/auth";
import { asistenciaRepository } from "@/repositories/asistencia.repository";
import { success, error, handleApiError } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return error("No autorizado", 401);
    }

    const analytics = await asistenciaRepository.getAnalytics(session.eventoId);
    return success(analytics);
  } catch (err) {
    return handleApiError(err, "GET /api/analytics");
  }
}
