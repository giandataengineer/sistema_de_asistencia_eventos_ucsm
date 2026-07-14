import { asistenciaRepository } from "@/repositories/asistencia.repository";
import type { AsistenciaListParams } from "@/interfaces/asistencia.interface";
import type { CreateAsistenciaInput } from "@/validators/asistencia.validator";
import { formatTimePeru } from "@/lib/utils";
import { prisma } from "@/lib/db";

async function calcularDia(eventoId: string): Promise<number> {
  const evento = await prisma.evento.findUnique({
    where: { id: eventoId },
    select: { fechaInicio: true },
  });

  if (!evento) return 1;

  const ahora = new Date();
  const inicio = new Date(evento.fechaInicio);
  inicio.setHours(0, 0, 0, 0);

  const hoy = new Date(ahora);
  hoy.setHours(0, 0, 0, 0);

  const diffMs = hoy.getTime() - inicio.getTime();
  const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  return Math.max(1, diffDias + 1);
}

export const asistenciaService = {
  async registrar(input: CreateAsistenciaInput, registradoPor: string) {
    const dia = input.dia ?? await calcularDia(input.eventoId);
    const tipo = input.tipo ?? "entrada";

    if (tipo === "salida") {
      const tieneEntrada = await asistenciaRepository.findByDniEventoDiaTipo(
        input.numeroDni,
        input.eventoId,
        dia,
        "entrada"
      );
      if (!tieneEntrada || tieneEntrada.eliminado) {
        return {
          success: false,
          error: "No se puede registrar SALIDA sin ENTRADA previa",
          duplicado: false,
        };
      }
    }

    const existente = await asistenciaRepository.findByDniEventoDiaTipo(
      input.numeroDni,
      input.eventoId,
      dia,
      tipo
    );

    if (existente) {
      if (existente.eliminado) {
        const reactivado = await prisma.asistencia.update({
          where: { id: existente.id },
          data: {
            eliminado: false,
            eliminadoAt: null,
            fechaRegistro: new Date(),
            apellidoPaterno: input.apellidoPaterno,
            apellidoMaterno: input.apellidoMaterno,
            nombres: input.nombres,
            registradoPor,
          },
        });
        return { success: true, data: reactivado };
      }

      const tipoLabel = tipo === "entrada" ? "entrada" : "salida";
      const hora = formatTimePeru(existente.fechaRegistro);
      return {
        success: false,
        error: `${tipoLabel.toUpperCase()} ya registrada el dia ${dia} a las ${hora}`,
        duplicado: true,
      };
    }

    const asistencia = await asistenciaRepository.create({
      ...input,
      dia,
      tipo,
      registradoPor,
    });

    return { success: true, data: asistencia };
  },

  async listar(params: AsistenciaListParams) {
    return asistenciaRepository.findAll(params);
  },

  async eliminar(id: string) {
    return asistenciaRepository.softDelete(id);
  },

  async contarPorEvento(eventoId: string) {
    return asistenciaRepository.countByEvento(eventoId);
  },

  async obtenerParaExportar(eventoId: string, dia?: number) {
    return asistenciaRepository.findAllForExport(eventoId, dia);
  },

  async obtenerDiasEvento(eventoId: string): Promise<number[]> {
    return asistenciaRepository.getDistinctDias(eventoId);
  },
};
