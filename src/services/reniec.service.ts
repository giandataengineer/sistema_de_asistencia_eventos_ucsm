const RENIEC_API = "https://api.apis.net.pe/v1/dni";

interface ReniecResponse {
  nombre: string;
  tipoDocumento: string;
  numeroDocumento: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  nombres: string;
}

const cache = new Map<string, { data: ReniecResponse; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 30;

export const reniecService = {
  async consultarDni(dni: string): Promise<{
    success: boolean;
    data?: {
      nombres: string;
      apellidoPaterno: string;
      apellidoMaterno: string;
    };
    error?: string;
  }> {
    if (!/^\d{8}$/.test(dni)) {
      return { success: false, error: "DNI debe tener 8 digitos" };
    }

    const cached = cache.get(dni);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return {
        success: true,
        data: {
          nombres: cached.data.nombres,
          apellidoPaterno: cached.data.apellidoPaterno,
          apellidoMaterno: cached.data.apellidoMaterno,
        },
      };
    }

    try {
      const res = await fetch(`${RENIEC_API}?numero=${dni}`, {
        signal: AbortSignal.timeout(3000),
      });

      if (!res.ok) {
        return { success: false, error: "DNI no encontrado en RENIEC" };
      }

      const json: ReniecResponse = await res.json();

      if (!json.nombres && !json.apellidoPaterno) {
        return { success: false, error: "No se encontraron datos para este DNI" };
      }

      cache.set(dni, { data: json, timestamp: Date.now() });

      return {
        success: true,
        data: {
          nombres: json.nombres || "",
          apellidoPaterno: json.apellidoPaterno || "",
          apellidoMaterno: json.apellidoMaterno || "",
        },
      };
    } catch {
      return { success: false, error: "Error al consultar RENIEC. Intente de nuevo." };
    }
  },
};
