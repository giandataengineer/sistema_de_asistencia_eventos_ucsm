export interface Usuario {
  id: string;
  username: string;
  nombre: string;
  activo: boolean;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface JWTPayload {
  sub: string;
  username: string;
  nombre: string;
  iat: number;
  exp: number;
}
