import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const eventos = await prisma.evento.findMany({
    where: { activo: true },
    orderBy: { fechaInicio: "desc" },
    select: {
      id: true,
      nombre: true,
      descripcion: true,
      fechaInicio: true,
      fechaFin: true,
      lugar: true,
    },
  });

  return NextResponse.json(eventos);
}
