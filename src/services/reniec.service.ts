const RENIEC_API_V1 = "https://api.apis.net.pe/v1/dni";
const RENIEC_API_V2 = "https://api.apis.net.pe/v2/reniec/dni";

interface ReniecResponse {
  nombre?: string;
  tipoDocumento?: string;
  numeroDocumento?: string;
  apellidoPaterno?: string;
  apellidoMaterno?: string;
  nombres?: string;
}

const cache = new Map<string, { data: ReniecResponse; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 30;

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function tryFetch(url: string): Promise<ReniecResponse | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
    if (res.status === 429) return null;
    if (!res.ok) return null;
    const json = await res.json();
    if (json.nombres || json.apellidoPaterno) return json;
    return null;
  } catch {
    return null;
  }
}

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
          nombres: cached.data.nombres || "",
          apellidoPaterno: cached.data.apellidoPaterno || "",
          apellidoMaterno: cached.data.apellidoMaterno || "",
        },
      };
    }

    // Intento 1: API v1
    let json = await tryFetch(`${RENIEC_API_V1}?numero=${dni}`);

    // Intento 2: retry v1 tras delay (para 429)
    if (!json) {
      await delay(800);
      json = await tryFetch(`${RENIEC_API_V1}?numero=${dni}`);
    }

    // Intento 3: API v2 como fallback
    if (!json) {
      await delay(500);
      json = await tryFetch(`${RENIEC_API_V2}?numero=${dni}`);
    }

    if (json) {
      cache.set(dni, { data: json, timestamp: Date.now() });
      return {
        success: true,
        data: {
          nombres: json.nombres || "",
          apellidoPaterno: json.apellidoPaterno || "",
          apellidoMaterno: json.apellidoMaterno || "",
        },
      };
    }

    return { success: false, error: "No se pudo obtener datos de RENIEC" };
  },
};
