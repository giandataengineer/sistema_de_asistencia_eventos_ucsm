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
        etiqueta: data.etiqueta ?? "participante",
        dia: data.dia ?? 1,
        sesion: data.sesion ?? 1,
        tipo: data.tipo ?? "entrada",
        eventoId: data.eventoId,
        registradoPor: data.registradoPor,
      },
    });
  },

  async findByDniEventoDiaSesionTipo(numeroDni: string, eventoId: string, dia: number, sesion: number, tipo: string) {
    return prisma.asistencia.findFirst({
      where: { numeroDni, eventoId, dia, sesion, tipo },
    });
  },

  async findAll(params: AsistenciaListParams) {
    const { eventoId, page = 1, limit = 20, search, dia, sesion, etiqueta } = params;
    const skip = (page - 1) * limit;

    const where = {
      eventoId,
      eliminado: false,
      ...(dia && { dia }),
      ...(sesion && { sesion }),
      ...(params.tipo && { tipo: params.tipo }),
      ...(etiqueta && { etiqueta }),
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

  async findAllForExport(eventoId: string, dia?: number, sesion?: number) {
    return prisma.asistencia.findMany({
      where: {
        eventoId,
        eliminado: false,
        ...(dia && { dia }),
        ...(sesion && { sesion }),
      },
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

  async getDistinctDias(eventoId: string): Promise<number[]> {
    const result = await prisma.asistencia.findMany({
      where: { eventoId, eliminado: false },
      select: { dia: true },
      distinct: ["dia"],
      orderBy: { dia: "asc" },
    });
    return result.map((r) => r.dia);
  },

  async getDistinctSesiones(eventoId: string, dia?: number): Promise<number[]> {
    const result = await prisma.asistencia.findMany({
      where: { eventoId, eliminado: false, ...(dia && { dia }) },
      select: { sesion: true },
      distinct: ["sesion"],
      orderBy: { sesion: "asc" },
    });
    return result.map((r) => r.sesion);
  },

  async getAnalytics(eventoId: string) {
    const [
      totalRegistros,
      totalEntradas,
      totalSalidas,
      participantes,
      organizadores,
      dniUnicos,
      registrosPorDia,
      registrosPorSesion,
      registrosPorHora,
      ultimosRegistros,
    ] = await Promise.all([
      prisma.asistencia.count({ where: { eventoId, eliminado: false } }),
      prisma.asistencia.count({ where: { eventoId, eliminado: false, tipo: "entrada" } }),
      prisma.asistencia.count({ where: { eventoId, eliminado: false, tipo: "salida" } }),
      prisma.asistencia.count({ where: { eventoId, eliminado: false, etiqueta: "participante" } }),
      prisma.asistencia.count({ where: { eventoId, eliminado: false, etiqueta: "organizador" } }),
      prisma.asistencia.findMany({
        where: { eventoId, eliminado: false },
        select: { numeroDni: true },
        distinct: ["numeroDni"],
      }),
      prisma.asistencia.groupBy({
        by: ["dia"],
        where: { eventoId, eliminado: false, tipo: "entrada" },
        _count: { id: true },
        orderBy: { dia: "asc" },
      }),
      prisma.asistencia.groupBy({
        by: ["sesion"],
        where: { eventoId, eliminado: false, tipo: "entrada" },
        _count: { id: true },
        orderBy: { sesion: "asc" },
      }),
      prisma.$queryRaw`
        SELECT EXTRACT(HOUR FROM fecha_registro) AS hora, COUNT(*)::int AS total
        FROM asistencias
        WHERE evento_id = ${eventoId} AND eliminado = false AND tipo = 'entrada'
        GROUP BY hora ORDER BY hora
      ` as Promise<Array<{ hora: number; total: number }>>,
      prisma.asistencia.findMany({
        where: { eventoId, eliminado: false },
        orderBy: { fechaRegistro: "desc" },
        take: 10,
        select: {
          numeroDni: true,
          apellidoPaterno: true,
          nombres: true,
          tipo: true,
          etiqueta: true,
          fechaRegistro: true,
          dia: true,
          sesion: true,
        },
      }),
    ]);

    const [
      entradasPorDia,
      salidasPorDia,
      topAsistentes,
      registrosPorDiaSesion,
    ] = await Promise.all([
      prisma.asistencia.groupBy({
        by: ["dia"],
        where: { eventoId, eliminado: false, tipo: "entrada" },
        _count: { id: true },
        orderBy: { dia: "asc" },
      }),
      prisma.asistencia.groupBy({
        by: ["dia"],
        where: { eventoId, eliminado: false, tipo: "salida" },
        _count: { id: true },
        orderBy: { dia: "asc" },
      }),
      prisma.$queryRaw`
        SELECT numero_dni, apellido_paterno, nombres, etiqueta, COUNT(*)::int AS registros
        FROM asistencias
        WHERE evento_id = ${eventoId} AND eliminado = false AND tipo = 'entrada'
        GROUP BY numero_dni, apellido_paterno, nombres, etiqueta
        ORDER BY registros DESC
        LIMIT 10
      ` as Promise<Array<{ numero_dni: string; apellido_paterno: string; nombres: string; etiqueta: string; registros: number }>>,
      prisma.asistencia.groupBy({
        by: ["dia", "sesion"],
        where: { eventoId, eliminado: false, tipo: "entrada" },
        _count: { id: true },
        orderBy: [{ dia: "asc" }, { sesion: "asc" }],
      }),
    ]);

    const tasaRetencion = totalEntradas > 0
      ? Math.round((totalSalidas / totalEntradas) * 100)
      : 0;

    const salidasMap = new Map(salidasPorDia.map((r) => [r.dia, r._count.id]));

    return {
      kpis: {
        totalRegistros,
        totalEntradas,
        totalSalidas,
        asistentesUnicos: dniUnicos.length,
        participantes,
        organizadores,
        tasaRetencion,
      },
      distribucionPorDia: entradasPorDia.map((r) => ({
        dia: r.dia,
        entradas: r._count.id,
        salidas: salidasMap.get(r.dia) ?? 0,
        total: r._count.id,
      })),
      distribucionPorSesion: registrosPorSesion.map((r) => ({
        sesion: r.sesion,
        total: r._count.id,
      })),
      distribucionPorHora: (registrosPorHora as Array<{ hora: number; total: number }>).map((r) => ({
        hora: Number(r.hora),
        total: r.total,
      })),
      distribucionPorDiaSesion: registrosPorDiaSesion.map((r) => ({
        dia: r.dia,
        sesion: r.sesion,
        total: r._count.id,
      })),
      topAsistentes: (topAsistentes as Array<{ numero_dni: string; apellido_paterno: string; nombres: string; etiqueta: string; registros: number }>).map((r) => ({
        dni: r.numero_dni,
        apellido: r.apellido_paterno,
        nombres: r.nombres,
        etiqueta: r.etiqueta,
        registros: r.registros,
      })),
      ultimosRegistros,
    };
  },

  async countByEtiqueta(eventoId: string, etiqueta: string) {
    return prisma.asistencia.count({
      where: { eventoId, eliminado: false, etiqueta },
    });
  },
};
