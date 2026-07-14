export interface Asistencia {
  id: string;
  numeroDni: string;
  apellidoPaterno: string;
  apellidoMaterno: string | null;
  nombres: string;
  tipoDni: string;
  dia: number;
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
  dia?: number;
  eventoId: string;
  registradoPor: string;
}

export interface AsistenciaListParams {
  eventoId: string;
  page?: number;
  limit?: number;
  search?: string;
  dia?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
