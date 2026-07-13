import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { exportService } from "@/services/export.service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const eventoId = new URL(request.url).searchParams.get("eventoId");
  if (!eventoId) {
    return NextResponse.json({ error: "eventoId requerido" }, { status: 400 });
  }

  const csv = await exportService.generateCSV(eventoId);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=asistencia.csv",
    },
  });
}
