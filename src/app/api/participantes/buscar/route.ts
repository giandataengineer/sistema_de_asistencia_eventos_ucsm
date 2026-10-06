import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiGuard, isGuardError } from "@/lib/api-guard";

export async function POST(req: NextRequest) {
  const guard = await apiGuard(req);
  if (isGuardError(guard)) return guard;

  try {
    const { apellidoPaterno, apellidoMaterno, nombres } = await req.json();

    if (!apellidoPaterno) {
      return NextResponse.json({ found: false, error: "Apellido paterno requerido" }, { status: 400 });
    }

    const normalizar = (s: string) =>
      s.normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase().trim();

    const apPat = normalizar(apellidoPaterno);
    const apMat = apellidoMaterno ? normalizar(apellidoMaterno) : null;
    const nom = nombres ? normalizar(nombres) : null;

    // Exact match first
    let participante = await prisma.participante.findFirst({
      where: {
        eventoId: guard.session.eventoId,
        apellidoPaterno: { equals: apPat, mode: "insensitive" },
        ...(apMat ? { apellidoMaterno: { equals: apMat, mode: "insensitive" } } : {}),
        ...(nom ? { nombres: { contains: nom.split(" ")[0], mode: "insensitive" } } : {}),
      },
    });

    // Fallback: partial match on apellido paterno + first name
    if (!participante && nom) {
      const primerNombre = nom.split(" ")[0];
      participante = await prisma.participante.findFirst({
        where: {
          eventoId: guard.session.eventoId,
          apellidoPaterno: { equals: apPat, mode: "insensitive" },
          nombres: { contains: primerNombre, mode: "insensitive" },
        },
      });
    }

    // Fallback: just apellido paterno + materno
    if (!participante) {
      participante = await prisma.participante.findFirst({
        where: {
          eventoId: guard.session.eventoId,
          apellidoPaterno: { equals: apPat, mode: "insensitive" },
          ...(apMat ? { apellidoMaterno: { equals: apMat, mode: "insensitive" } } : {}),
        },
      });
    }

    if (!participante) {
      return NextResponse.json({ found: false, estadoPago: "NO REGISTRADO" });
    }

    return NextResponse.json({
      found: true,
      estadoPago: participante.estadoPago,
      nombreCompleto: {
        apellidoPaterno: participante.apellidoPaterno,
        apellidoMaterno: participante.apellidoMaterno,
        nombres: participante.nombres,
      },
    });
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
