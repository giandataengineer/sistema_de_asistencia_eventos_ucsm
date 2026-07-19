import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiGuard, isGuardError } from "@/lib/api-guard";
import { handleApiError } from "@/lib/api-response";
import { RATE_LIMITS } from "@/lib/rate-limiter";

export const dynamic = "force-dynamic";
export const maxDuration = 10;

interface ImportRecord {
  numeroDni: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  nombres: string;
  dia: number;
  hora: string;
  fecha: string;
}

export async function POST(request: NextRequest) {
  const guard = await apiGuard(request, { rateLimit: RATE_LIMITS.write });
  if (isGuardError(guard)) return guard;

  try {
  const { registros, offset = 0 } = (await request.json()) as {
    registros: ImportRecord[];
    offset?: number;
  };

  const BATCH_SIZE = 15;
  const batch = registros.slice(offset, offset + BATCH_SIZE);

  let restaurados = 0;
  let creados = 0;
  let yaExisten = 0;

  for (const r of batch) {
    const existente = await prisma.asistencia.findFirst({
      where: {
        numeroDni: r.numeroDni,
        eventoId: guard.session.eventoId,
        dia: r.dia,
        tipo: "entrada",
      },
    });

    if (existente) {
      if (existente.eliminado) {
        await prisma.asistencia.update({
          where: { id: existente.id },
          data: {
            eliminado: false,
            eliminadoAt: null,
            apellidoPaterno: r.apellidoPaterno !== "..." ? r.apellidoPaterno : existente.apellidoPaterno,
            apellidoMaterno: r.apellidoMaterno || existente.apellidoMaterno,
            nombres: r.nombres !== "Registrando" ? r.nombres : existente.nombres,
          },
        });
        restaurados++;
      } else {
        yaExisten++;
      }
    } else {
      let fechaRegistro: Date;
      try {
        const [day, month, year] = r.fecha.split("/").map(Number);
        const [h, m, s] = r.hora.split(":").map(Number);
        fechaRegistro = new Date(year, month - 1, day, h, m, s);
      } catch {
        fechaRegistro = new Date();
      }

      await prisma.asistencia.create({
        data: {
          numeroDni: r.numeroDni,
          apellidoPaterno: r.apellidoPaterno,
          apellidoMaterno: r.apellidoMaterno,
          nombres: r.nombres,
          tipoDni: "electronico",
          dia: r.dia,
          tipo: "entrada",
          eventoId: guard.session.eventoId,
          registradoPor: guard.session.sub,
          fechaRegistro,
        },
      });
      creados++;
    }
  }

  const procesados = offset + batch.length;
  const terminado = procesados >= registros.length;

  return NextResponse.json({
    restaurados,
    creados,
    yaExisten,
    procesados,
    total: registros.length,
    restantes: registros.length - procesados,
    terminado,
  });
  } catch (err) {
    return handleApiError(err, "POST /api/asistencias/importar");
  }
}
