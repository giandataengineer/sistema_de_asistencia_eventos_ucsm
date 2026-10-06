import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiGuard, isGuardError } from "@/lib/api-guard";

export async function GET(req: NextRequest) {
  const guard = await apiGuard(req);
  if (isGuardError(guard)) return guard;

  try {
    const dias = await prisma.diaEvento.findMany({
      where: { eventoId: guard.session.eventoId },
      orderBy: { dia: "asc" },
    });

    return NextResponse.json({ dias });
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const guard = await apiGuard(req);
  if (isGuardError(guard)) return guard;

  try {
    const { dia, nombre, fecha, tipoAsistencia } = await req.json();

    if (!dia || !tipoAsistencia) {
      return NextResponse.json({ error: "dia y tipoAsistencia requeridos" }, { status: 400 });
    }

    const valid = ["entrada_salida", "solo_entrada", "solo_salida"];
    if (!valid.includes(tipoAsistencia)) {
      return NextResponse.json({ error: "tipoAsistencia invalido" }, { status: 400 });
    }

    const diaEvento = await prisma.diaEvento.upsert({
      where: {
        eventoId_dia: { eventoId: guard.session.eventoId, dia: Number(dia) },
      },
      update: { nombre, fecha: fecha ? new Date(fecha) : null, tipoAsistencia },
      create: {
        dia: Number(dia),
        nombre: nombre || `Dia ${dia}`,
        fecha: fecha ? new Date(fecha) : null,
        tipoAsistencia,
        eventoId: guard.session.eventoId,
      },
    });

    return NextResponse.json({ diaEvento });
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const guard = await apiGuard(req);
  if (isGuardError(guard)) return guard;

  try {
    const { searchParams } = new URL(req.url);
    const dia = searchParams.get("dia");
    if (!dia) {
      return NextResponse.json({ error: "dia requerido" }, { status: 400 });
    }

    await prisma.diaEvento.deleteMany({
      where: { eventoId: guard.session.eventoId, dia: Number(dia) },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Error al eliminar dia" }, { status: 500 });
  }
}
