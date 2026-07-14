import { z } from "zod";

export const createAsistenciaSchema = z.object({
  numeroDni: z
    .string()
    .length(8, "El DNI debe tener exactamente 8 digitos")
    .regex(/^\d{8}$/, "El DNI solo debe contener numeros"),
  apellidoPaterno: z
    .string()
    .min(1, "El apellido paterno es obligatorio")
    .max(100)
    .trim(),
  apellidoMaterno: z
    .string()
    .max(100)
    .trim()
    .nullable()
    .optional(),
  nombres: z
    .string()
    .min(1, "Los nombres son obligatorios")
    .max(150)
    .trim(),
  tipoDni: z.enum(["azul", "electronico"]),
  eventoId: z.string().min(1, "ID de evento requerido"),
  dia: z.number().int().min(1).optional(),
  tipo: z.enum(["entrada", "salida"]).optional(),
});

export type CreateAsistenciaInput = z.infer<typeof createAsistenciaSchema>;
