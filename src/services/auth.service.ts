import bcrypt from "bcryptjs";
import { usuarioRepository } from "@/repositories/usuario.repository";
import { createToken } from "@/lib/auth";
import type { LoginInput } from "@/validators/auth.validator";

export const authService = {
  async login(input: LoginInput) {
    const usuario = await usuarioRepository.findByUsername(input.username);
    if (!usuario || !usuario.activo) {
      return { success: false, error: "Credenciales incorrectas" };
    }

    const passwordValid = await bcrypt.compare(input.password, usuario.passwordHash);
    if (!passwordValid) {
      return { success: false, error: "Credenciales incorrectas" };
    }

    const token = await createToken({
      sub: usuario.id,
      username: usuario.username,
      nombre: usuario.nombre,
      eventoId: usuario.eventoId,
    });

    return {
      success: true,
      token,
      usuario: {
        id: usuario.id,
        username: usuario.username,
        nombre: usuario.nombre,
        eventoId: usuario.eventoId,
        eventoNombre: usuario.evento.nombre,
      },
    };
  },
};
