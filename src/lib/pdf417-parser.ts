import type { DatosDNI, ScanResult } from "@/interfaces/dni.interface";

// DNI azul peruano (1997): PDF417 con posiciones fijas de bytes
const BLUE_DNI_OFFSETS = {
  indicador: { start: 0, end: 2 },
  numeroDNI: { start: 2, end: 10 },
  apellidoPaterno: { start: 10, end: 50 },
  apellidoMaterno: { start: 50, end: 90 },
  nombres: { start: 90, end: 125 },
  sexo: { start: 125, end: 126 },
} as const;

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

// DNI azul (1997): PDF417 con datos de identidad en posiciones fijas
function parseBlueDNI(raw: string): DatosDNI | null {
  if (raw.length < BLUE_DNI_MIN_LENGTH) return null;

  const indicador = raw.substring(
    BLUE_DNI_OFFSETS.indicador.start,
    BLUE_DNI_OFFSETS.indicador.end
  );
  if (indicador !== BLUE_DNI_INDICATOR) return null;

  const numeroDNI = cleanField(
    raw.substring(BLUE_DNI_OFFSETS.numeroDNI.start, BLUE_DNI_OFFSETS.numeroDNI.end)
  );
  if (!isValidDNI(numeroDNI)) return null;

  return {
    numeroDNI,
    apellidoPaterno: cleanField(
      raw.substring(BLUE_DNI_OFFSETS.apellidoPaterno.start, BLUE_DNI_OFFSETS.apellidoPaterno.end)
    ),
    apellidoMaterno:
      cleanField(
        raw.substring(BLUE_DNI_OFFSETS.apellidoMaterno.start, BLUE_DNI_OFFSETS.apellidoMaterno.end)
      ) || null,
    nombres: cleanField(
      raw.substring(BLUE_DNI_OFFSETS.nombres.start, BLUE_DNI_OFFSETS.nombres.end)
    ),
    sexo: parseSexo(
      raw.substring(BLUE_DNI_OFFSETS.sexo.start, BLUE_DNI_OFFSETS.sexo.end)
    ),
    tipoDNI: "azul",
    rawData: raw,
  };
}

// DNI electronico: MRZ formato TD1 (3 lineas de 30 caracteres)
// Estructura real verificada con DNI-e peruano:
// Linea 1: I<PER41060712<3<<<<<<<<<<<<<<<
//   [0-1]  tipo doc "I<"
//   [2-4]  pais "PER"
//   [5-13] numero DNI (8 digitos + check digit)
//   [14-29] relleno <
// Linea 2: 8105152F3506271PER<<<<<<<<<<<<6
//   [0-5]  fecha nacimiento AAMMDD
//   [6]    check digit
//   [7]    sexo M/F
//   [8-13] fecha vencimiento AAMMDD
//   [14]   check digit
//   [15-17] nacionalidad "PER"
//   [18-28] datos opcionales
//   [29]   check digit global
// Linea 3: TICLLA<<YSABEL<YSIDORA<<<<<<<<<
//   apellidos<<nombres (separados por <<, palabras por <)
function parseMRZ(raw: string): DatosDNI | null {
  const cleaned = raw.replace(/\r/g, "");
  const lines = cleaned.split("\n").filter((l) => l.length >= 28);
  if (lines.length < 3) return null;

  const line1 = lines[0].padEnd(30, "<");
  const line2 = lines[1].padEnd(30, "<");
  const line3 = lines[2].padEnd(30, "<");

  // Validar que empiece con I (documento de identidad) y PER
  if (!line1.startsWith("I") || !line1.substring(2, 5).includes("PER")) {
    return null;
  }

  // Numero DNI: posiciones 5-13 en linea 1 (8 digitos + check)
  const numeroDNI = line1.substring(5, 13).replace(/</g, "");
  if (!isValidDNI(numeroDNI)) return null;

  // Sexo y fecha nacimiento de linea 2
  const fechaRaw = line2.substring(0, 6);
  const sexoCode = line2.substring(7, 8);

  // Apellidos y nombres de linea 3
  const line3Clean = line3.replace(/<+$/g, "");
  const partes = line3Clean.split("<<");
  const apellidos = (partes[0] || "").replace(/</g, " ").trim();
  const nombres = (partes[1] || "").replace(/</g, " ").trim();

  const apellidosSplit = apellidos.split(" ");

  let fechaNacimiento: string | undefined;
  if (/^\d{6}$/.test(fechaRaw)) {
    const yy = parseInt(fechaRaw.substring(0, 2), 10);
    const mm = fechaRaw.substring(2, 4);
    const dd = fechaRaw.substring(4, 6);
    const siglo = yy > 30 ? "19" : "20";
    fechaNacimiento = `${dd}/${mm}/${siglo}${fechaRaw.substring(0, 2)}`;
  }

  return {
    numeroDNI,
    apellidoPaterno: apellidosSplit[0] || apellidos,
    apellidoMaterno: apellidosSplit.length > 1 ? apellidosSplit.slice(1).join(" ") : null,
    nombres: nombres || "NO DISPONIBLE",
    sexo: sexoCode === "M" ? "M" : sexoCode === "F" ? "F" : undefined,
    fechaNacimiento,
    tipoDNI: "electronico",
    rawData: raw,
  };
}

// Code39 del DNI-e: solo contiene el numero CUI (8 digitos)
function parseCode39(raw: string): DatosDNI | null {
  const trimmed = raw.trim().replace(/[^0-9]/g, "");
  if (!isValidDNI(trimmed)) return null;

  return {
    numeroDNI: trimmed,
    apellidoPaterno: "",
    apellidoMaterno: null,
    nombres: "",
    tipoDNI: "electronico",
    rawData: raw,
  };
}

// Detecta automaticamente el tipo de DNI y parsea los datos
export function parsePDF417(rawData: string): ScanResult {
  if (!rawData || rawData.trim().length === 0) {
    return { success: false, error: "No se recibieron datos del escaner" };
  }

  const trimmed = rawData.trim();

  // Intentar como DNI azul (PDF417 con posiciones fijas, empieza con "01")
  const blueDNI = parseBlueDNI(trimmed);
  if (blueDNI) {
    return { success: true, data: blueDNI };
  }

  // Intentar como MRZ TD1 (3 lineas, formato I<PER...)
  const mrzDNI = parseMRZ(trimmed);
  if (mrzDNI) {
    return { success: true, data: mrzDNI };
  }

  // Intentar como Code39 (solo numero de DNI)
  const code39DNI = parseCode39(trimmed);
  if (code39DNI) {
    return { success: true, data: code39DNI };
  }

  // Fallback: buscar patron de 8 digitos consecutivos
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
    error: "No se pudo interpretar el codigo. Intente con ingreso manual.",
  };
}
