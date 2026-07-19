import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiGuard, isGuardError } from "@/lib/api-guard";
import { handleApiError } from "@/lib/api-response";
import { RATE_LIMITS } from "@/lib/rate-limiter";

export const dynamic = "force-dynamic";

interface OrganizadorRecord {
  apellidos: string;
  nombres: string;
  dni: string;
}

export async function POST(request: NextRequest) {
  const guard = await apiGuard(request, { rateLimit: RATE_LIMITS.write });
  if (isGuardError(guard)) return guard;

  try {
    const { registros } = (await request.json()) as { registros: OrganizadorRecord[] };

    if (!registros || !Array.isArray(registros) || registros.length > 500) {
      return NextResponse.json({ error: "Formato invalido o limite excedido" }, { status: 400 });
    }

    let creados = 0;
    let yaExisten = 0;

    for (const r of registros) {
      const dniStr = String(r.dni).padStart(8, "0");

      if (!/^\d{8}$/.test(dniStr)) continue;

      const apellidosParts = r.apellidos.trim().split(/\s+/);
      const apellidoPaterno = apellidosParts[0]?.slice(0, 100) || "";
      const apellidoMaterno = apellidosParts.slice(1).join(" ").slice(0, 100) || "";

      const existente = await prisma.asistencia.findFirst({
        where: {
          numeroDni: dniStr,
          eventoId: guard.session.eventoId,
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
          nombres: r.nombres.trim().slice(0, 150),
          tipoDni: "electronico",
          etiqueta: "organizador",
          dia: 1,
          sesion: 1,
          tipo: "entrada",
          eventoId: guard.session.eventoId,
          registradoPor: guard.session.sub,
        },
      });
      creados++;
    }

    return NextResponse.json({ creados, yaExisten, total: registros.length });
  } catch (err) {
    return handleApiError(err, "POST /api/asistencias/importar-organizadores");
  }
}
