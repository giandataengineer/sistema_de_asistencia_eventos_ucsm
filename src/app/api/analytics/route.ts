import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { asistenciaRepository } from "@/repositories/asistencia.repository";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const analytics = await asistenciaRepository.getAnalytics(session.eventoId);
  return NextResponse.json(analytics);
}
