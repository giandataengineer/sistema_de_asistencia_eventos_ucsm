import { z } from "zod";

export const loginSchema = z.object({
  username: z
    .string()
    .min(1, "El usuario es obligatorio")
    .max(50, "El usuario no puede exceder 50 caracteres")
    .trim(),
  password: z
    .string()
    .min(1, "La contrasena es obligatoria")
    .max(100, "La contrasena no puede exceder 100 caracteres"),
});

export type LoginInput = z.infer<typeof loginSchema>;
