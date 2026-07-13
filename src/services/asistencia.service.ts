import { asistenciaRepository } from "@/repositories/asistencia.repository";
import type { AsistenciaListParams } from "@/interfaces/asistencia.interface";
import type { CreateAsistenciaInput } from "@/validators/asistencia.validator";
import { formatTimePeru } from "@/lib/utils";

export const asistenciaService = {
  async registrar(input: CreateAsistenciaInput, registradoPor: string) {
    const existente = await asistenciaRepository.findByDniAndEvento(
      input.numeroDni,
      input.eventoId
    );

    if (existente) {
      const hora = formatTimePeru(existente.fechaRegistro);
      return {
        success: false,
        error: `Este participante ya fue registrado a las ${hora}`,
        duplicado: true,
      };
    }

    const asistencia = await asistenciaRepository.create({
      ...input,
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

  async obtenerParaExportar(eventoId: string) {
    return asistenciaRepository.findAllForExport(eventoId);
  },
};
