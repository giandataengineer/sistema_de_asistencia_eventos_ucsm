import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { asistenciaService } from "@/services/asistencia.service";

export const dynamic = "force-dynamic";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { id } = await params;
    await asistenciaService.eliminar(id);
    return NextResponse.json({ message: "Registro eliminado" });
  } catch {
    return NextResponse.json(
      { error: "Error al eliminar registro" },
      { status: 500 }
    );
  }
}
