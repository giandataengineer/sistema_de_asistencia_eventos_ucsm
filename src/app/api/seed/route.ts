import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import participantesData from "../../../../prisma/participantes.json";

export async function GET() {
  try {
    const evento = await prisma.evento.upsert({
      where: { id: "00000000-0000-0000-0000-000000000002" },
      update: {},
      create: {
        id: "00000000-0000-0000-0000-000000000002",
        nombre: "Congreso EPII 2026",
        descripcion: "Congreso de la Escuela Profesional de Ingenieria Industrial - UCSM 2026",
        fechaInicio: new Date("2026-10-15"),
        fechaFin: new Date("2026-10-17"),
        lugar: "Universidad Catolica de Santa Maria, Arequipa",
        activo: true,
      },
    });

    const passwordHash = await bcrypt.hash("innovacionindustrial", 10);
    await prisma.usuario.upsert({
      where: { username: "congresoepii2026" },
      update: {},
      create: {
        username: "congresoepii2026",
        passwordHash,
        nombre: "Administrador Congreso EPII",
        eventoId: evento.id,
        activo: true,
      },
    });

    let imported = 0;
    const batch = 50;
    for (let i = 0; i < (participantesData as any[]).length; i += batch) {
      const chunk = (participantesData as any[]).slice(i, i + batch);
      await prisma.participante.createMany({
        data: chunk.map((p: any) => ({
          apellidoPaterno: p.apellidoPaterno,
          apellidoMaterno: p.apellidoMaterno || null,
          nombres: p.nombres,
          tipoParticipante: p.tipoParticipante,
          estadoPago: p.estadoPago,
          eventoId: evento.id,
        })),
        skipDuplicates: true,
      });
      imported += chunk.length;
    }

    return NextResponse.json({ ok: true, evento: evento.nombre, participantes: imported });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
