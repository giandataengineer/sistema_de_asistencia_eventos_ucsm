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

  const { updates } = (await req.json()) as {
    updates: { dni: string; nombres: string; apellidoPaterno: string; apellidoMaterno: string }[];
  };

  if (!updates || !Array.isArray(updates)) {
    return NextResponse.json({ error: "Formato invalido" }, { status: 400 });
  }

  let totalUpdated = 0;

  for (const u of updates) {
    const result = await prisma.asistencia.updateMany({
      where: {
        numeroDni: u.dni,
        eventoId: session.eventoId,
        eliminado: false,
        OR: [
          { apellidoPaterno: "POR VERIFICAR" },
          { apellidoPaterno: "NO ENCONTRADO" },
          { apellidoPaterno: "..." },
          { apellidoPaterno: "POR ACTUALIZAR" },
          { nombres: "Registrando" },
          { nombres: { startsWith: "DNI " } },
          { nombres: u.dni },
        ],
      },
      data: {
        nombres: u.nombres,
        apellidoPaterno: u.apellidoPaterno,
        apellidoMaterno: u.apellidoMaterno,
      },
    });
    totalUpdated += result.count;
  }

  return NextResponse.json({ success: true, totalUpdated });
}
