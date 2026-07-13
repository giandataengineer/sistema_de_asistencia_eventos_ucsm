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
  const eventoId = searchParams.get("eventoId");
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "20", 10);
  const search = searchParams.get("search") || undefined;

  if (!eventoId) {
    return NextResponse.json(
      { error: "El eventoId es obligatorio" },
      { status: 400 }
    );
  }

  const result = await asistenciaService.listar({
    eventoId,
    page,
    limit,
    search,
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
    const parsed = createAsistenciaSchema.safeParse(body);

    if (!parsed.success) {
      const issues = parsed.error.issues ?? parsed.error;
      const msg = Array.isArray(issues) ? issues[0]?.message : "Datos invalidos";
      return NextResponse.json(
        { error: msg || "Datos invalidos" },
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
  } catch {
    return NextResponse.json(
      { error: "Error al registrar asistencia" },
      { status: 500 }
    );
  }
}
