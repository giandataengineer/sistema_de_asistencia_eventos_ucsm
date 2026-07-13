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
  const eventoId = searchParams.get("eventoId");
  const eventoNombre = searchParams.get("eventoNombre") || "Asistencia";

  if (!eventoId) {
    return NextResponse.json({ error: "eventoId requerido" }, { status: 400 });
  }

  const buffer = await exportService.generateExcel(eventoId, eventoNombre);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename=asistencia_${eventoId.substring(0, 8)}.xlsx`,
    },
  });
}
