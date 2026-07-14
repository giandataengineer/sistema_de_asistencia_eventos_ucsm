export interface BarcodeScanResult {
  success: boolean;
  dni?: string;
  error?: string;
}

export function extractDniFromBarcode(rawData: string): BarcodeScanResult {
  if (!rawData || rawData.trim().length === 0) {
    return { success: false, error: "No se recibieron datos del escaner" };
  }

  const trimmed = rawData.trim().replace(/[^0-9]/g, "");

  if (/^\d{8}$/.test(trimmed)) {
    return { success: true, dni: trimmed };
  }

  const match = rawData.match(/\b(\d{8})\b/);
  if (match) {
    return { success: true, dni: match[1] };
  }

  return {
    success: false,
    error: "No se detecto un DNI valido (8 digitos)",
  };
}
