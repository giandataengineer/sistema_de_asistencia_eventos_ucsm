const RENIEC_API_V1 = "https://api.apis.net.pe/v1/dni";
const RENIEC_API_V2 = "https://api.apis.net.pe/v2/reniec/dni";
const ELDNI_URL = "https://eldni.com/pe/buscar-por-dni";

interface DniData {
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
}

const cache = new Map<string, { data: DniData; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 30;

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function tryApiFetch(url: string): Promise<DniData | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) return null;
    const json = await res.json();
    if (json.nombres || json.apellidoPaterno) {
      return {
        nombres: json.nombres || "",
        apellidoPaterno: json.apellidoPaterno || "",
        apellidoMaterno: json.apellidoMaterno || "",
      };
    }
    return null;
  } catch {
    return null;
  }
}

async function tryElDni(dni: string): Promise<DniData | null> {
  try {
    const pageRes = await fetch(ELDNI_URL, { signal: AbortSignal.timeout(6000) });
    if (!pageRes.ok) return null;
    const html = await pageRes.text();
    const cookieHeader = pageRes.headers.get("set-cookie") || "";

    const tokenMatch = html.match(/name="_token"[^>]*value="([^"]+)"/);
    if (!tokenMatch) return null;
    const csrfToken = tokenMatch[1];

    const sessionMatch = cookieHeader.match(/eldni_session=([^;]+)/);
    const xsrfMatch = cookieHeader.match(/XSRF-TOKEN=([^;]+)/);
    const cookies = [
      sessionMatch ? `eldni_session=${sessionMatch[1]}` : "",
      xsrfMatch ? `XSRF-TOKEN=${xsrfMatch[1]}` : "",
    ].filter(Boolean).join("; ");

    const formRes = await fetch(ELDNI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Cookie": cookies,
      },
      body: `_token=${csrfToken}&dni=${dni}`,
      signal: AbortSignal.timeout(8000),
    });

    if (!formRes.ok) return null;
    const resultHtml = await formRes.text();

    const cells = resultHtml.match(/<td[^>]*>([^<]+)</g);
    if (!cells || cells.length < 4) return null;

    const extract = (s: string) => s.replace(/<td[^>]*>/, "").trim();
    const nombres = extract(cells[1]);
    const apellidoPaterno = extract(cells[2]);
    const apellidoMaterno = extract(cells[3]);

    if (!nombres) return null;

    return { nombres, apellidoPaterno, apellidoMaterno };
  } catch {
    return null;
  }
}

export const reniecService = {
  async consultarDni(dni: string): Promise<{
    success: boolean;
    data?: DniData;
    error?: string;
  }> {
    if (!/^\d{8}$/.test(dni)) {
      return { success: false, error: "DNI debe tener 8 digitos" };
    }

    const cached = cache.get(dni);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return { success: true, data: cached.data };
    }

    // 1. eldni.com (base de datos mas amplia)
    let data = await tryElDni(dni);

    // 2. API v1 fallback
    if (!data) {
      data = await tryApiFetch(`${RENIEC_API_V1}?numero=${dni}`);
    }

    // 3. API v2 fallback
    if (!data) {
      await delay(500);
      data = await tryApiFetch(`${RENIEC_API_V2}?numero=${dni}`);
    }

    if (data) {
      cache.set(dni, { data, timestamp: Date.now() });
      return { success: true, data };
    }

    return { success: false, error: "No se pudo obtener datos de RENIEC" };
  },
};
