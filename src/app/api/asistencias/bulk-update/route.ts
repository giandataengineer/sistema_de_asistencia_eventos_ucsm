import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiGuard, isGuardError } from "@/lib/api-guard";
import { handleApiError } from "@/lib/api-response";
import { RATE_LIMITS } from "@/lib/rate-limiter";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const guard = await apiGuard(req, { rateLimit: RATE_LIMITS.write });
  if (isGuardError(guard)) return guard;

  try {
  const { updates } = (await req.json()) as {
    updates: { dni: string; nombres: string; apellidoPaterno: string; apellidoMaterno: string }[];
  };

  if (!updates || !Array.isArray(updates)) {
    return NextResponse.json({ error: "Formato invalido" }, { status: 400 });
  }

  let totalUpdated = 0;

  for (const u of updates) {
    const result = await prisma.asistencia.updateMany({
      where: {
        numeroDni: u.dni,
        eventoId: guard.session.eventoId,
        eliminado: false,
        OR: [
          { apellidoPaterno: "POR VERIFICAR" },
          { apellidoPaterno: "NO ENCONTRADO" },
          { apellidoPaterno: "..." },
          { apellidoPaterno: "POR ACTUALIZAR" },
          { nombres: "Registrando" },
          { nombres: { startsWith: "DNI " } },
          { nombres: u.dni },
        ],
      },
      data: {
        nombres: u.nombres,
        apellidoPaterno: u.apellidoPaterno,
        apellidoMaterno: u.apellidoMaterno,
      },
    });
    totalUpdated += result.count;
  }

  return NextResponse.json({ success: true, totalUpdated });
  } catch (err) {
    return handleApiError(err, "POST /api/asistencias/bulk-update");
  }
}
