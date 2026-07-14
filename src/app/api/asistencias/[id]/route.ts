import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { asistenciaService } from "@/services/asistencia.service";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();

    const asistencia = await prisma.asistencia.findUnique({
      where: { id },
      select: { eventoId: true },
    });

    if (!asistencia || asistencia.eventoId !== session.eventoId) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }

    const updated = await prisma.asistencia.update({
      where: { id },
      data: {
        ...(body.nombres && { nombres: body.nombres }),
        ...(body.apellidoPaterno && { apellidoPaterno: body.apellidoPaterno }),
        ...(body.apellidoMaterno !== undefined && { apellidoMaterno: body.apellidoMaterno }),
      },
    });

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
  }
}

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

    const asistencia = await prisma.asistencia.findUnique({
      where: { id },
      select: { eventoId: true },
    });

    if (!asistencia || asistencia.eventoId !== session.eventoId) {
      return NextResponse.json({ error: "Registro no encontrado" }, { status: 404 });
    }

    await asistenciaService.eliminar(id);
    return NextResponse.json({ message: "Registro eliminado" });
  } catch {
    return NextResponse.json(
      { error: "Error al eliminar registro" },
      { status: 500 }
    );
  }
}
