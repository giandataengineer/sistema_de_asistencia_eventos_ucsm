import { NextRequest, NextResponse } from "next/server";
import { asistenciaService } from "@/services/asistencia.service";
import { createAsistenciaSchema } from "@/validators/asistencia.validator";
import { apiGuard, isGuardError } from "@/lib/api-guard";
import { handleApiError } from "@/lib/api-response";
import { RATE_LIMITS } from "@/lib/rate-limiter";

export const dynamic = "force-dynamic";

const MAX_LIMIT = 100;

export async function GET(request: NextRequest) {
  const guard = await apiGuard(request);
  if (isGuardError(guard)) return guard;

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
  const search = searchParams.get("search")?.trim().slice(0, 100) || undefined;
  const dia = searchParams.get("dia") ? parseInt(searchParams.get("dia")!, 10) : undefined;
  const sesion = searchParams.get("sesion") ? parseInt(searchParams.get("sesion")!, 10) : undefined;
  const tipo = searchParams.get("tipo") || undefined;
  const etiqueta = searchParams.get("etiqueta") || undefined;

  const result = await asistenciaService.listar({
    eventoId: guard.session.eventoId,
    page,
    limit,
    search,
    dia,
    sesion,
    tipo,
    etiqueta,
  });

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const guard = await apiGuard(request, { rateLimit: RATE_LIMITS.write });
  if (isGuardError(guard)) return guard;

  try {
    const body = await request.json();

    const parsed = createAsistenciaSchema.safeParse({
      ...body,
      eventoId: guard.session.eventoId,
    });

    if (!parsed.success) {
      const firstIssue = parsed.error.issues?.[0];
      return NextResponse.json(
        { error: firstIssue?.message || "Datos invalidos" },
        { status: 400 }
      );
    }

    const result = await asistenciaService.registrar(parsed.data, guard.session.sub);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, duplicado: true },
        { status: 409 }
      );
    }

    return NextResponse.json(result.data, { status: 201 });
  } catch (err) {
    return handleApiError(err, "POST /api/asistencias");
  }
}
