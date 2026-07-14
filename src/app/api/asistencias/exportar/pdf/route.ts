import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { exportService } from "@/services/export.service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const eventoNombre = searchParams.get("eventoNombre") || "Evento";
  const dia = searchParams.get("dia");
  const diaNum = dia ? parseInt(dia, 10) : undefined;

  const data = await exportService.getDataForPDF(session.eventoId, eventoNombre, diaNum);
  return NextResponse.json(data);
}
