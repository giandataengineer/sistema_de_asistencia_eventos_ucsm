import { prisma } from "@/lib/db";

export const usuarioRepository = {
  async findByUsername(username: string) {
    return prisma.usuario.findUnique({
      where: { username },
      include: {
        evento: {
          select: { id: true, nombre: true },
        },
      },
    });
  },

  async findById(id: string) {
    return prisma.usuario.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        nombre: true,
        activo: true,
        eventoId: true,
        evento: {
          select: { nombre: true },
        },
      },
    });
  },
};
