import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiGuard, isGuardError } from "@/lib/api-guard";
import { handleApiError } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const guard = await apiGuard(request);
  if (isGuardError(guard)) return guard;

  try {
    const eventos = await prisma.evento.findMany({
      where: { activo: true },
      orderBy: { fechaInicio: "desc" },
      take: 50,
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
  } catch (err) {
    return handleApiError(err, "GET /api/eventos");
  }
}
