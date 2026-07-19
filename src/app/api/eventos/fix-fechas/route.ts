import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { fechaInicio, fechaFin } = (await req.json()) as {
    fechaInicio: string;
    fechaFin: string;
  };

  const updated = await prisma.evento.update({
    where: { id: session.eventoId },
    data: {
      fechaInicio: new Date(fechaInicio),
      fechaFin: new Date(fechaFin),
    },
  });

  return NextResponse.json({
    success: true,
    fechaInicio: updated.fechaInicio,
    fechaFin: updated.fechaFin,
  });
}
