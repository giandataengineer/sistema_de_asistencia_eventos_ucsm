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
  const eventoNombre = searchParams.get("eventoNombre") || "Evento";

  if (!eventoId) {
    return NextResponse.json({ error: "eventoId requerido" }, { status: 400 });
  }

  // El PDF se genera del lado del cliente con jsPDF
  // Esta ruta provee los datos estructurados
  const data = await exportService.getDataForPDF(eventoId, eventoNombre);
  return NextResponse.json(data);
}
