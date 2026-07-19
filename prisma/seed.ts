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

  const passwordHash = await bcrypt.hash("costos2026", 10);

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

  const organizadores = [
    { apellidos: "Pinto Nina", nombres: "Dalhya Stephany", dni: "73622039" },
    { apellidos: "Quispe Gutierrez", nombres: "Maria Jose", dni: "60059702" },
    { apellidos: "Condori Coyla", nombres: "Marelyn Victoria", dni: "75761298" },
    { apellidos: "Paja Cuyo", nombres: "Paola Lizeth", dni: "73941874" },
    { apellidos: "Rodriguez Chirio", nombres: "Diego Mijael", dni: "60470853" },
    { apellidos: "Rios Cardenas", nombres: "Gabriela Alejandra", dni: "74635837" },
    { apellidos: "Lovon Paredes", nombres: "Maria Josed", dni: "73752223" },
    { apellidos: "Mamani Aguilar", nombres: "Angeles Viviana", dni: "77022250" },
    { apellidos: "Lizarazo Mares", nombres: "Anai Shiomara", dni: "74544035" },
    { apellidos: "Cardenas Acsara", nombres: "Sheyla Vanessa", dni: "61050057" },
    { apellidos: "Barreto Merma", nombres: "Karen Nataly", dni: "72009944" },
    { apellidos: "Martinez Apaza", nombres: "Mayra Alejandra", dni: "70472756" },
    { apellidos: "Queque Perez", nombres: "Gabriela Ariana", dni: "60794536" },
    { apellidos: "Sarcco Puma", nombres: "Brinn Alison", dni: "74611687" },
    { apellidos: "Bustos Cueva", nombres: "Andrea Fabiana", dni: "71489531" },
    { apellidos: "Bedregal Fuentes", nombres: "Stephany Alessandra", dni: "61048977" },
    { apellidos: "Gutierres Tamayo", nombres: "Samira Graciel", dni: "60968080" },
    { apellidos: "Valdivia Rodriguez", nombres: "Alexandra Carla", dni: "72886074" },
    { apellidos: "Luna Zeballos", nombres: "Yamilet Fernanda", dni: "73897798" },
    { apellidos: "Terrazas Pacheco", nombres: "Andrea Elvira", dni: "60458348" },
    { apellidos: "Chambi Olarte", nombres: "Karen Lizbeth", dni: "75740934" },
    { apellidos: "Paredes Rivera", nombres: "Brendy Rita", dni: "61049396" },
    { apellidos: "Galindo Poma", nombres: "Karla Silvana", dni: "73543517" },
    { apellidos: "Holguino Huaman", nombres: "Itawa Lucero", dni: "73299440" },
    { apellidos: "Rosas Villanueva", nombres: "Jhon Alexis", dni: "73818739" },
  ];

  const sesiones = [
    { dia: 1, sesion: 1, tipo: "entrada" as const },
    { dia: 1, sesion: 1, tipo: "salida" as const },
    { dia: 1, sesion: 2, tipo: "entrada" as const },
    { dia: 1, sesion: 3, tipo: "entrada" as const },
    { dia: 2, sesion: 1, tipo: "entrada" as const },
    { dia: 2, sesion: 2, tipo: "entrada" as const },
    { dia: 2, sesion: 2, tipo: "salida" as const },
    { dia: 2, sesion: 3, tipo: "entrada" as const },
    { dia: 2, sesion: 4, tipo: "entrada" as const },
  ];

  let orgCreados = 0;
  let registrosCreados = 0;

  for (const org of organizadores) {
    const parts = org.apellidos.split(" ");
    const apellidoPaterno = parts[0] || "";
    const apellidoMaterno = parts.slice(1).join(" ") || "";

    for (const s of sesiones) {
      const existe = await prisma.asistencia.findFirst({
        where: {
          numeroDni: org.dni,
          eventoId: evento.id,
          dia: s.dia,
          sesion: s.sesion,
          tipo: s.tipo,
        },
      });

      if (existe) {
        if (existe.etiqueta !== "organizador") {
          await prisma.asistencia.update({
            where: { id: existe.id },
            data: { etiqueta: "organizador" },
          });
          registrosCreados++;
        }
      } else {
        await prisma.asistencia.create({
          data: {
            numeroDni: org.dni,
            apellidoPaterno,
            apellidoMaterno,
            nombres: org.nombres,
            tipoDni: "electronico",
            etiqueta: "organizador",
            dia: s.dia,
            sesion: s.sesion,
            tipo: s.tipo,
            eventoId: evento.id,
            registradoPor: admin.id,
          },
        });
        registrosCreados++;
      }
    }
    orgCreados++;
  }

  console.log("Seed completado:");
  console.log("  Usuario:", admin.username);
  console.log("  Evento:", evento.nombre);
  console.log("  Organizadores procesados:", orgCreados);
  console.log("  Registros de asistencia creados/actualizados:", registrosCreados);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
