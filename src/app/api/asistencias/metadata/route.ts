import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { asistenciaService } from "@/services/asistencia.service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const dia = searchParams.get("dia") ? parseInt(searchParams.get("dia")!, 10) : undefined;

  const [dias, sesiones] = await Promise.all([
    asistenciaService.obtenerDiasEvento(session.eventoId),
    asistenciaService.obtenerSesionesEvento(session.eventoId, dia),
  ]);

  return NextResponse.json({ dias, sesiones });
}
