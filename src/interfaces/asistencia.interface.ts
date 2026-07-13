export interface Asistencia {
  id: string;
  numeroDni: string;
  apellidoPaterno: string;
  apellidoMaterno: string | null;
  nombres: string;
  tipoDni: string;
  eventoId: string;
  registradoPor: string;
  fechaRegistro: Date;
  eliminado: boolean;
}

export interface AsistenciaCreate {
  numeroDni: string;
  apellidoPaterno: string;
  apellidoMaterno?: string | null;
  nombres: string;
  tipoDni: string;
  eventoId: string;
  registradoPor: string;
}

export interface AsistenciaListParams {
  eventoId: string;
  page?: number;
  limit?: number;
  search?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
