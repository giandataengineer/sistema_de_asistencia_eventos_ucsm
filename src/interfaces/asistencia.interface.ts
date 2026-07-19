export interface Asistencia {
  id: string;
  numeroDni: string;
  apellidoPaterno: string;
  apellidoMaterno: string | null;
  nombres: string;
  tipoDni: string;
  etiqueta: string;
  dia: number;
  sesion: number;
  tipo: string;
  eventoId: string;
  registradoPor: string;
  fechaRegistro: Date;
  eliminado: boolean;
  permanencia?: string;
}

export interface AsistenciaCreate {
  numeroDni: string;
  apellidoPaterno: string;
  apellidoMaterno?: string | null;
  nombres: string;
  tipoDni: string;
  etiqueta?: string;
  dia?: number;
  sesion?: number;
  tipo?: string;
  eventoId: string;
  registradoPor: string;
}

export interface AsistenciaListParams {
  eventoId: string;
  page?: number;
  limit?: number;
  search?: string;
  dia?: number;
  sesion?: number;
  tipo?: string;
  etiqueta?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
