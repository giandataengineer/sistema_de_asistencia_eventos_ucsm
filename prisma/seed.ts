import { config } from "dotenv";
import path from "node:path";
config({ path: path.join(__dirname, "..", ".env") });

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

async function main() {
  const evento = await prisma.evento.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      nombre: "IV Seminario Internacional de Costos y Gestion de Operaciones",
      descripcion: "IV Seminario Internacional de Costos y Gestion de Operaciones - UCSM",
      fechaInicio: new Date("2026-08-01"),
      fechaFin: new Date("2026-08-03"),
      lugar: "Universidad Catolica de Santa Maria, Arequipa",
      activo: true,
    },
  });

  const passwordHash = await bcrypt.hash("costos2026", 12);

  const admin = await prisma.usuario.upsert({
    where: { username: "seminario" },
    update: {},
    create: {
      username: "seminario",
      passwordHash,
      nombre: "Administrador",
      eventoId: evento.id,
      activo: true,
    },
  });

  console.log("Seed completado:");
  console.log("  Usuario:", admin.username);
  console.log("  Evento:", evento.nombre);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
