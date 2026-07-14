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
      ],
    },
    select: { id: true, numeroDni: true },
    take: 5,
  });

  if (pendientes.length === 0) {
    const totalPendientes = await prisma.asistencia.count({
      where: {
        eventoId: session.eventoId,
        eliminado: false,
        OR: [
          { apellidoPaterno: "POR VERIFICAR" },
        ],
      },
    });

    return NextResponse.json({
      total: 0,
      actualizados: 0,
      noEncontrados: totalPendientes,
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
          nombres: `DNI ${reg.numeroDni}`,
          apellidoPaterno: "POR VERIFICAR",
          apellidoMaterno: "",
        },
      });
      noEncontrados++;
    }

    await delay(300);
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
