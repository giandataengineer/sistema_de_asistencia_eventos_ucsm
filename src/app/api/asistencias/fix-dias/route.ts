import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { moves } = (await req.json()) as {
    moves: { fromDia: number; fromSesion: number; toDia: number; toSesion: number }[];
  };

  if (!moves || !Array.isArray(moves)) {
    return NextResponse.json({ error: "Formato invalido" }, { status: 400 });
  }

  const results: { from: string; to: string; count: number }[] = [];

  for (const m of moves) {
    const result = await prisma.asistencia.updateMany({
      where: {
        eventoId: session.eventoId,
        dia: m.fromDia,
        sesion: m.fromSesion,
        eliminado: false,
      },
      data: {
        dia: m.toDia,
        sesion: m.toSesion,
      },
    });
    results.push({
      from: `dia${m.fromDia}_ses${m.fromSesion}`,
      to: `dia${m.toDia}_ses${m.toSesion}`,
      count: result.count,
    });
  }

  return NextResponse.json({ success: true, results });
}
