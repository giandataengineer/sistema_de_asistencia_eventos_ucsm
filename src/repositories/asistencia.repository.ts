import { prisma } from "@/lib/db";
import type { AsistenciaCreate, AsistenciaListParams } from "@/interfaces/asistencia.interface";

export const asistenciaRepository = {
  async create(data: AsistenciaCreate) {
    return prisma.asistencia.create({
      data: {
        numeroDni: data.numeroDni,
        apellidoPaterno: data.apellidoPaterno,
        apellidoMaterno: data.apellidoMaterno,
        nombres: data.nombres,
        tipoDni: data.tipoDni,
        eventoId: data.eventoId,
        registradoPor: data.registradoPor,
      },
    });
  },

  async findByDniAndEvento(numeroDni: string, eventoId: string) {
    return prisma.asistencia.findFirst({
      where: {
        numeroDni,
        eventoId,
        eliminado: false,
      },
    });
  },

  async findAll(params: AsistenciaListParams) {
    const { eventoId, page = 1, limit = 20, search } = params;
    const skip = (page - 1) * limit;

    const where = {
      eventoId,
      eliminado: false,
      ...(search && {
        OR: [
          { numeroDni: { contains: search } },
          { apellidoPaterno: { contains: search, mode: "insensitive" as const } },
          { apellidoMaterno: { contains: search, mode: "insensitive" as const } },
          { nombres: { contains: search, mode: "insensitive" as const } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      prisma.asistencia.findMany({
        where,
        orderBy: { fechaRegistro: "desc" },
        skip,
        take: limit,
      }),
      prisma.asistencia.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  // Todos los registros sin paginar para exportacion
  async findAllForExport(eventoId: string) {
    return prisma.asistencia.findMany({
      where: { eventoId, eliminado: false },
      orderBy: { fechaRegistro: "asc" },
    });
  },

  async softDelete(id: string) {
    return prisma.asistencia.update({
      where: { id },
      data: {
        eliminado: true,
        eliminadoAt: new Date(),
      },
    });
  },

  async countByEvento(eventoId: string) {
    return prisma.asistencia.count({
      where: { eventoId, eliminado: false },
    });
  },
};
