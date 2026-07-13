export interface Usuario {
  id: string;
  username: string;
  nombre: string;
  activo: boolean;
  eventoId: string;
  eventoNombre: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface JWTPayload {
  sub: string;
  username: string;
  nombre: string;
  eventoId: string;
  iat: number;
  exp: number;
}
