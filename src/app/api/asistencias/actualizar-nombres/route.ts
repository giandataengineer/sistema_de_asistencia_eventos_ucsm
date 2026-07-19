import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { reniecService } from "@/services/reniec.service";

export const dynamic = "force-dynamic";

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const pendientes = await prisma.asistencia.findMany({
    where: {
      eventoId: session.eventoId,
      eliminado: false,
      OR: [
        { nombres: "Registrando" },
        { apellidoPaterno: "..." },
        { nombres: "POR ACTUALIZAR" },
        { apellidoPaterno: "POR ACTUALIZAR" },
        { apellidoPaterno: "POR VERIFICAR" },
        { nombres: { startsWith: "DNI " } },
      ],
    },
    select: { id: true, numeroDni: true },
    take: 5,
  });

  if (pendientes.length === 0) {
    return NextResponse.json({
      total: 0,
      actualizados: 0,
      noEncontrados: 0,
      terminado: true,
    });
  }

  let actualizados = 0;
  let noEncontrados = 0;

  for (const reg of pendientes) {
    const result = await reniecService.consultarDni(reg.numeroDni);

    if (result.success && result.data) {
      await prisma.asistencia.update({
        where: { id: reg.id },
        data: {
          nombres: result.data.nombres,
          apellidoPaterno: result.data.apellidoPaterno,
          apellidoMaterno: result.data.apellidoMaterno,
        },
      });
      actualizados++;
    } else {
      await prisma.asistencia.update({
        where: { id: reg.id },
        data: {
          nombres: reg.numeroDni,
          apellidoPaterno: "NO ENCONTRADO",
          apellidoMaterno: "",
        },
      });
      noEncontrados++;
    }

    await delay(500);
  }

  const restantes = await prisma.asistencia.count({
    where: {
      eventoId: session.eventoId,
      eliminado: false,
      OR: [
        { nombres: "Registrando" },
        { apellidoPaterno: "..." },
        { nombres: "POR ACTUALIZAR" },
        { apellidoPaterno: "POR ACTUALIZAR" },
        { apellidoPaterno: "POR VERIFICAR" },
        { nombres: { startsWith: "DNI " } },
      ],
    },
  });

  return NextResponse.json({
    total: pendientes.length,
    actualizados,
    noEncontrados,
    restantes,
    terminado: restantes === 0,
  });
}
