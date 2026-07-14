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

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const reniecService = {
  async consultarDni(dni: string, retries = 2): Promise<{
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

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        if (attempt > 0) await delay(1000 * attempt);

        const res = await fetch(`${RENIEC_API}?numero=${dni}`, {
          signal: AbortSignal.timeout(5000),
        });

        if (res.status === 429) {
          if (attempt < retries) continue;
          return { success: false, error: "RENIEC saturado, se reintentara despues" };
        }

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
        if (attempt < retries) continue;
        return { success: false, error: "Error al consultar RENIEC" };
      }
    }

    return { success: false, error: "Error al consultar RENIEC" };
  },
};
