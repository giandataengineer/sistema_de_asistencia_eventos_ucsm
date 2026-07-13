import type { DatosDNI, ScanResult } from "@/interfaces/dni.interface";

// Posiciones de bytes para DNI azul peruano (formato 1997 adultos)
const BLUE_DNI_OFFSETS = {
  indicador: { start: 0, end: 2 },
  numeroDNI: { start: 2, end: 10 },
  apellidoPaterno: { start: 10, end: 50 },
  apellidoMaterno: { start: 50, end: 90 },
  nombres: { start: 90, end: 125 },
  sexo: { start: 125, end: 126 },
} as const;

const DNI_LENGTH = 8;
const BLUE_DNI_MIN_LENGTH = 126;
const BLUE_DNI_INDICATOR = "01";

function cleanField(raw: string): string {
  return raw.replace(/\0/g, "").trim();
}

function parseSexo(code: string): "M" | "F" | undefined {
  if (code === "1") return "M";
  if (code === "2") return "F";
  return undefined;
}

function isValidDNI(dni: string): boolean {
  return /^\d{8}$/.test(dni);
}

// Parseo del DNI azul (1997) usando posiciones fijas de bytes
function parseBlueDNI(raw: string): DatosDNI | null {
  if (raw.length < BLUE_DNI_MIN_LENGTH) return null;

  const indicador = raw.substring(
    BLUE_DNI_OFFSETS.indicador.start,
    BLUE_DNI_OFFSETS.indicador.end
  );
  if (indicador !== BLUE_DNI_INDICATOR) return null;

  const numeroDNI = cleanField(
    raw.substring(
      BLUE_DNI_OFFSETS.numeroDNI.start,
      BLUE_DNI_OFFSETS.numeroDNI.end
    )
  );
  if (!isValidDNI(numeroDNI)) return null;

  return {
    numeroDNI,
    apellidoPaterno: cleanField(
      raw.substring(
        BLUE_DNI_OFFSETS.apellidoPaterno.start,
        BLUE_DNI_OFFSETS.apellidoPaterno.end
      )
    ),
    apellidoMaterno: cleanField(
      raw.substring(
        BLUE_DNI_OFFSETS.apellidoMaterno.start,
        BLUE_DNI_OFFSETS.apellidoMaterno.end
      )
    ) || null,
    nombres: cleanField(
      raw.substring(
        BLUE_DNI_OFFSETS.nombres.start,
        BLUE_DNI_OFFSETS.nombres.end
      )
    ),
    sexo: parseSexo(
      raw.substring(BLUE_DNI_OFFSETS.sexo.start, BLUE_DNI_OFFSETS.sexo.end)
    ),
    tipoDNI: "azul",
    rawData: raw,
  };
}

// Los DNI electronicos usan MRZ (TD1) en lugar de PDF417 con posiciones fijas.
// El MRZ tiene 3 lineas de 30 caracteres separadas por salto de linea.
function parseElectronicDNI(raw: string): DatosDNI | null {
  const lines = raw.split(/[\n\r]+/).filter((l) => l.length >= 28);
  if (lines.length < 3) return null;

  const line1 = lines[0].padEnd(30, "<");
  const line2 = lines[1].padEnd(30, "<");
  const line3 = lines[2].padEnd(30, "<");

  // Linea 1: tipo doc (2) + pais (3) + numero doc (9) + check (1) + ...
  const numeroDNI = line1.substring(5, 14).replace(/</g, "");
  if (!isValidDNI(numeroDNI)) return null;

  // Linea 2: fecha nac (6) + check (1) + sexo (1) + ...
  const fechaRaw = line2.substring(0, 6);
  const sexoCode = line2.substring(7, 8);

  // Linea 3: apellidos<<nombres (separados por <<)
  const nombreCompleto = line3.replace(/</g, " ").trim();
  const partes = line3.split("<<");
  const apellidos = (partes[0] || "").replace(/</g, " ").trim();
  const nombres = (partes[1] || "").replace(/</g, " ").trim();

  const apellidosSplit = apellidos.split(" ");

  return {
    numeroDNI,
    apellidoPaterno: apellidosSplit[0] || nombreCompleto,
    apellidoMaterno: apellidosSplit.length > 1 ? apellidosSplit.slice(1).join(" ") : null,
    nombres: nombres || "NO DISPONIBLE",
    sexo: sexoCode === "M" ? "M" : sexoCode === "F" ? "F" : undefined,
    fechaNacimiento: fechaRaw.length === 6
      ? `${fechaRaw.substring(4, 6)}/${fechaRaw.substring(2, 4)}/19${fechaRaw.substring(0, 2)}`
      : undefined,
    tipoDNI: "electronico",
    rawData: raw,
  };
}

// Detecta automaticamente el tipo de DNI y lo parsea
export function parsePDF417(rawData: string): ScanResult {
  if (!rawData || rawData.trim().length === 0) {
    return { success: false, error: "No se recibieron datos del escaner" };
  }

  const trimmed = rawData.trim();

  // Intentar como DNI azul primero (posiciones fijas)
  const blueDNI = parseBlueDNI(trimmed);
  if (blueDNI) {
    return { success: true, data: blueDNI };
  }

  // Intentar como DNI electronico (formato MRZ)
  const electronicDNI = parseElectronicDNI(trimmed);
  if (electronicDNI) {
    return { success: true, data: electronicDNI };
  }

  // Fallback: buscar un patron de 8 digitos como DNI
  const dniMatch = trimmed.match(/\b(\d{8})\b/);
  if (dniMatch) {
    return {
      success: true,
      data: {
        numeroDNI: dniMatch[1],
        apellidoPaterno: "",
        apellidoMaterno: null,
        nombres: "",
        tipoDNI: "electronico",
        rawData: trimmed,
      },
    };
  }

  return {
    success: false,
    error: "No se pudo interpretar el codigo de barras. Intente con ingreso manual.",
  };
}
