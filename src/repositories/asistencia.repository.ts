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
        estadoPago: data.estadoPago ?? null,
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

    const dnis = [...new Set(data.map((r) => r.numeroDni))];
    const dias = [...new Set(data.map((r) => r.dia))];
    const sesiones = [...new Set(data.map((r) => r.sesion))];

    const pares = dnis.length > 0 ? await prisma.asistencia.findMany({
      where: {
        eventoId,
        eliminado: false,
        numeroDni: { in: dnis },
        dia: { in: dias },
        sesion: { in: sesiones },
      },
      select: { numeroDni: true, dia: true, sesion: true, tipo: true, fechaRegistro: true },
    }) : [];

    const pareMap = new Map<string, { entrada?: Date; salida?: Date }>();
    for (const p of pares) {
      const key = `${p.numeroDni}-${p.dia}-${p.sesion}`;
      const entry = pareMap.get(key) ?? {};
      if (p.tipo === "entrada") entry.entrada = p.fechaRegistro;
      if (p.tipo === "salida") entry.salida = p.fechaRegistro;
      pareMap.set(key, entry);
    }

    const dataWithPerm = data.map((r) => {
      const key = `${r.numeroDni}-${r.dia}-${r.sesion}`;
      const par = pareMap.get(key);
      if (!par?.entrada || !par?.salida) return { ...r, permanencia: "No corresponde" };
      const diffMs = new Date(par.salida).getTime() - new Date(par.entrada).getTime();
      if (diffMs < 0) return { ...r, permanencia: "No corresponde" };
      const horas = Math.floor(diffMs / 3600000);
      const minutos = Math.floor((diffMs % 3600000) / 60000);
      return { ...r, permanencia: horas > 0 ? `${horas}h ${minutos}min` : `${minutos}min` };
    });

    return {
      data: dataWithPerm,
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
      prisma.$queryRaw`
        SELECT COUNT(DISTINCT numero_dni)::int AS total FROM asistencias
        WHERE evento_id = ${eventoId} AND eliminado = false AND etiqueta = 'participante'
      `.then((r: unknown) => (r as Array<{ total: number }>)[0]?.total ?? 0),
      prisma.$queryRaw`
        SELECT COUNT(DISTINCT numero_dni)::int AS total FROM asistencias
        WHERE evento_id = ${eventoId} AND eliminado = false AND etiqueta = 'organizador'
      `.then((r: unknown) => (r as Array<{ total: number }>)[0]?.total ?? 0),
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
      permanenciaData,
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
      prisma.$queryRaw`
        SELECT
          e.dia,
          e.sesion,
          COUNT(*)::int AS pares,
          ROUND(AVG(EXTRACT(EPOCH FROM (s.fecha_registro - e.fecha_registro)) / 60))::int AS promedio_min,
          ROUND(MIN(EXTRACT(EPOCH FROM (s.fecha_registro - e.fecha_registro)) / 60))::int AS min_min,
          ROUND(MAX(EXTRACT(EPOCH FROM (s.fecha_registro - e.fecha_registro)) / 60))::int AS max_min
        FROM asistencias e
        INNER JOIN asistencias s
          ON e.numero_dni = s.numero_dni
          AND e.evento_id = s.evento_id
          AND e.dia = s.dia
          AND e.sesion = s.sesion
          AND e.tipo = 'entrada'
          AND s.tipo = 'salida'
          AND e.eliminado = false
          AND s.eliminado = false
        WHERE e.evento_id = ${eventoId}
        GROUP BY e.dia, e.sesion
        ORDER BY e.dia, e.sesion
      ` as Promise<Array<{ dia: number; sesion: number; pares: number; promedio_min: number; min_min: number; max_min: number }>>,
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
      permanencia: (permanenciaData as Array<{ dia: number; sesion: number; pares: number; promedio_min: number; min_min: number; max_min: number }>).map((r) => ({
        dia: r.dia,
        sesion: r.sesion,
        pares: r.pares,
        promedioMin: r.promedio_min,
        minMin: r.min_min,
        maxMin: r.max_min,
      })),
    };
  },

  async countByEtiqueta(eventoId: string, etiqueta: string) {
    return prisma.asistencia.count({
      where: { eventoId, eliminado: false, etiqueta },
    });
  },
};
