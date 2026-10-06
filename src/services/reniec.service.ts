const RENIEC_API_V1 = "https://api.apis.net.pe/v1/dni";
const RENIEC_API_V2 = "https://api.apis.net.pe/v2/reniec/dni";
const ELDNI_URL = "https://eldni.com/pe/buscar-por-dni";
const APIPERU_URL = "https://apiperu.dev/api/dni";
const APIPERU_TOKEN = process.env.APIPERU_TOKEN ?? "";
const DNIRUC_URL = "https://dniruc.apisperu.com/api/v1/dni";
const DNIRUC_TOKEN = process.env.DNIRUC_TOKEN ?? "";
const CONSULTADNI_URL = "https://api.consultadni.com/api/dni";

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
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
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

let elDniSession: { cookies: string; token: string; ts: number } | null = null;

async function getElDniSession(): Promise<{ cookies: string; token: string } | null> {
  if (elDniSession && Date.now() - elDniSession.ts < 1000 * 60 * 10) {
    return elDniSession;
  }
  try {
    const pageRes = await fetch(ELDNI_URL, {
      signal: AbortSignal.timeout(8000),
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml",
      },
    });
    if (!pageRes.ok) return null;
    const html = await pageRes.text();

    const tokenMatch = html.match(/name="_token"[^>]*value="([^"]+)"/);
    if (!tokenMatch) return null;

    const allCookies: string[] = [];
    const setCookies = pageRes.headers.getSetCookie?.() || [];
    for (const c of setCookies) {
      const match = c.match(/^([^=]+=[^;]+)/);
      if (match) allCookies.push(match[1]);
    }

    if (allCookies.length === 0) {
      const cookieHeader = pageRes.headers.get("set-cookie") || "";
      const sessionMatch = cookieHeader.match(/eldni_session=([^;]+)/);
      const xsrfMatch = cookieHeader.match(/XSRF-TOKEN=([^;]+)/);
      if (sessionMatch) allCookies.push(`eldni_session=${sessionMatch[1]}`);
      if (xsrfMatch) allCookies.push(`XSRF-TOKEN=${xsrfMatch[1]}`);
    }

    elDniSession = { cookies: allCookies.join("; "), token: tokenMatch[1], ts: Date.now() };
    return elDniSession;
  } catch {
    return null;
  }
}

async function tryElDni(dni: string): Promise<DniData | null> {
  try {
    const session = await getElDniSession();
    if (!session) return null;

    const formRes = await fetch(ELDNI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Cookie": session.cookies,
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Referer": ELDNI_URL,
      },
      body: `_token=${encodeURIComponent(session.token)}&dni=${dni}`,
      signal: AbortSignal.timeout(10000),
    });

    if (!formRes.ok) {
      elDniSession = null;
      return null;
    }
    const resultHtml = await formRes.text();

    const cells = resultHtml.match(/<td[^>]*>([^<]+)/g);
    if (!cells || cells.length < 4) return null;

    const extract = (s: string) => s.replace(/<td[^>]*>/, "").replace(/<$/, "").trim();
    const nombres = extract(cells[1]);
    const apellidoPaterno = extract(cells[2]);
    const apellidoMaterno = extract(cells[3]);

    if (!nombres || nombres.length < 2) return null;

    return { nombres, apellidoPaterno, apellidoMaterno };
  } catch {
    elDniSession = null;
    return null;
  }
}

async function tryApiPeruDev(dni: string): Promise<DniData | null> {
  try {
    const res = await fetch(APIPERU_URL, {
      method: "POST",
      signal: AbortSignal.timeout(8000),
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${APIPERU_TOKEN}`,
      },
      body: JSON.stringify({ dni }),
    });
    if (!res.ok) return null;
    const json = await res.json();
    if (json.success && json.data?.nombres) {
      return {
        nombres: json.data.nombres || "",
        apellidoPaterno: json.data.apellido_paterno || "",
        apellidoMaterno: json.data.apellido_materno || "",
      };
    }
    return null;
  } catch {
    return null;
  }
}

async function tryDniRuc(dni: string): Promise<DniData | null> {
  if (!DNIRUC_TOKEN) return null;
  try {
    const res = await fetch(`${DNIRUC_URL}/${dni}?token=${DNIRUC_TOKEN}`, {
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return null;
    const json = await res.json();
    if (json.success && json.nombres) {
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

async function tryConsultaDni(dni: string): Promise<DniData | null> {
  try {
    const res = await fetch(`${CONSULTADNI_URL}/${dni}`, {
      signal: AbortSignal.timeout(6000),
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    const json = await res.json();
    if (json.nombres) {
      return {
        nombres: json.nombres || "",
        apellidoPaterno: json.apellidoPaterno || json.apellido_paterno || "",
        apellidoMaterno: json.apellidoMaterno || json.apellido_materno || "",
      };
    }
    return null;
  } catch {
    return null;
  }
}

// Race two providers - return the first successful result
async function raceProviders(fns: (() => Promise<DniData | null>)[]): Promise<DniData | null> {
  const results = await Promise.allSettled(fns.map((fn) => fn()));
  for (const r of results) {
    if (r.status === "fulfilled" && r.value) return r.value;
  }
  return null;
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

    // Wave 1: race eldni + apis.net.pe v1 in parallel
    let data = await raceProviders([
      () => tryElDni(dni),
      () => tryApiFetch(`${RENIEC_API_V1}?numero=${dni}`),
    ]);

    // Wave 2: race apis.net.pe v2 + dniruc in parallel
    if (!data) {
      data = await raceProviders([
        () => tryApiFetch(`${RENIEC_API_V2}?numero=${dni}`),
        () => tryDniRuc(dni),
      ]);
    }

    // Wave 3: race apiperu.dev + consultadni in parallel
    if (!data) {
      data = await raceProviders([
        () => tryApiPeruDev(dni),
        () => tryConsultaDni(dni),
      ]);
    }

    // Wave 4: retry eldni with fresh session
    if (!data) {
      elDniSession = null;
      await delay(500);
      data = await tryElDni(dni);
    }

    if (data) {
      cache.set(dni, { data, timestamp: Date.now() });
      return { success: true, data };
    }

    return { success: false, error: "No se pudo obtener datos de RENIEC" };
  },
};
