export interface DatosDNI {
  numeroDNI: string;
  apellidoPaterno: string;
  apellidoMaterno: string | null;
  nombres: string;
  fechaNacimiento?: string;
  sexo?: "M" | "F";
  tipoDNI: "azul" | "electronico";
  rawData: string;
}

export interface ScanResult {
  success: boolean;
  data?: DatosDNI;
  error?: string;
}
