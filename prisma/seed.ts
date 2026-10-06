import { config } from "dotenv";
import path from "node:path";
config({ path: path.join(__dirname, "..", ".env") });

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import participantesData from "./participantes.json";

const adapter = new PrismaPg(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

async function main() {
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

  const admin = await prisma.usuario.upsert({
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

  console.log("Seed - Usuario:", admin.username);
  console.log("Seed - Evento:", evento.nombre);

  // Import participantes from Excel data
  let imported = 0;
  const batchSize = 50;
  for (let i = 0; i < participantesData.length; i += batchSize) {
    const batch = participantesData.slice(i, i + batchSize);
    await prisma.participante.createMany({
      data: batch.map((p: any) => ({
        apellidoPaterno: p.apellidoPaterno,
        apellidoMaterno: p.apellidoMaterno || null,
        nombres: p.nombres,
        tipoParticipante: p.tipoParticipante,
        estadoPago: p.estadoPago,
        eventoId: evento.id,
      })),
      skipDuplicates: true,
    });
    imported += batch.length;
  }

  console.log("Seed - Participantes importados:", imported);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
