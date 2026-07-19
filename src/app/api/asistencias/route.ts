import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { asistenciaService } from "@/services/asistencia.service";
import { createAsistenciaSchema } from "@/validators/asistencia.validator";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "20", 10);
  const search = searchParams.get("search") || undefined;
  const dia = searchParams.get("dia") ? parseInt(searchParams.get("dia")!, 10) : undefined;
  const sesion = searchParams.get("sesion") ? parseInt(searchParams.get("sesion")!, 10) : undefined;
  const tipo = searchParams.get("tipo") || undefined;
  const etiqueta = searchParams.get("etiqueta") || undefined;

  const result = await asistenciaService.listar({
    eventoId: session.eventoId,
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
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();

    const parsed = createAsistenciaSchema.safeParse({
      ...body,
      eventoId: session.eventoId,
    });

    if (!parsed.success) {
      const firstIssue = parsed.error.issues?.[0];
      return NextResponse.json(
        { error: firstIssue?.message || "Datos invalidos" },
        { status: 400 }
      );
    }

    const result = await asistenciaService.registrar(parsed.data, session.sub);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, duplicado: true },
        { status: 409 }
      );
    }

    return NextResponse.json(result.data, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al registrar asistencia";
    console.error("POST /api/asistencias error:", message);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
