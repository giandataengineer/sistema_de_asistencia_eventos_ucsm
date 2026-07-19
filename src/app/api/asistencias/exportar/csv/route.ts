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
  const dia = searchParams.get("dia");
  const sesion = searchParams.get("sesion");
  const diaNum = dia ? parseInt(dia, 10) : undefined;
  const sesionNum = sesion ? parseInt(sesion, 10) : undefined;

  const csv = await exportService.generateCSV(session.eventoId, diaNum, sesionNum);

  const suffix = [dia && `_dia${dia}`, sesion && `_sesion${sesion}`].filter(Boolean).join("");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename=asistencia${suffix}.csv`,
    },
  });
}
