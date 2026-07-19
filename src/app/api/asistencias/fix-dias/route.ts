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
    const { moves } = (await req.json()) as {
      moves: { fromDia: number; fromSesion: number; toDia: number; toSesion: number }[];
    };

    if (!moves || !Array.isArray(moves) || moves.length > 50) {
      return NextResponse.json({ error: "Formato invalido" }, { status: 400 });
    }

    const results: { from: string; to: string; count: number }[] = [];

    for (const m of moves) {
      const result = await prisma.asistencia.updateMany({
        where: {
          eventoId: guard.session.eventoId,
          dia: m.fromDia,
          sesion: m.fromSesion,
          eliminado: false,
        },
        data: {
          dia: m.toDia,
          sesion: m.toSesion,
        },
      });
      results.push({
        from: `dia${m.fromDia}_ses${m.fromSesion}`,
        to: `dia${m.toDia}_ses${m.toSesion}`,
        count: result.count,
      });
    }

    return NextResponse.json({ success: true, results });
  } catch (err) {
    return handleApiError(err, "POST /api/asistencias/fix-dias");
  }
}
