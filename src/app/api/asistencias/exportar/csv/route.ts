import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { exportService } from "@/services/export.service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const dia = new URL(request.url).searchParams.get("dia");
  const diaNum = dia ? parseInt(dia, 10) : undefined;

  const csv = await exportService.generateCSV(session.eventoId, diaNum);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=asistencia.csv",
    },
  });
}
