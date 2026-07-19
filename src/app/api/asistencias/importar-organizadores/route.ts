import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

interface OrganizadorRecord {
  apellidos: string;
  nombres: string;
  dni: string;
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { registros } = (await request.json()) as { registros: OrganizadorRecord[] };

  let creados = 0;
  let yaExisten = 0;

  for (const r of registros) {
    const dniStr = String(r.dni).padStart(8, "0");
    const apellidosParts = r.apellidos.trim().split(/\s+/);
    const apellidoPaterno = apellidosParts[0] || "";
    const apellidoMaterno = apellidosParts.slice(1).join(" ") || "";

    const existente = await prisma.asistencia.findFirst({
      where: {
        numeroDni: dniStr,
        eventoId: session.eventoId,
        etiqueta: "organizador",
      },
    });

    if (existente) {
      yaExisten++;
      continue;
    }

    await prisma.asistencia.create({
      data: {
        numeroDni: dniStr,
        apellidoPaterno,
        apellidoMaterno,
        nombres: r.nombres.trim(),
        tipoDni: "electronico",
        etiqueta: "organizador",
        dia: 1,
        sesion: 1,
        tipo: "entrada",
        eventoId: session.eventoId,
        registradoPor: session.sub,
      },
    });
    creados++;
  }

  return NextResponse.json({ creados, yaExisten, total: registros.length });
}
