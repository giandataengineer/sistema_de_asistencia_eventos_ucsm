export function formatDatePeru(date: Date): string {
  return new Intl.DateTimeFormat("es-PE", {
    timeZone: "America/Lima",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export function formatTimePeru(date: Date): string {
  return new Intl.DateTimeFormat("es-PE", {
    timeZone: "America/Lima",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
}

export function formatDateTimePeru(date: Date): string {
  return `${formatDatePeru(date)} ${formatTimePeru(date)}`;
}

export function fullName(
  apellidoPaterno: string,
  apellidoMaterno: string | null,
  nombres: string
): string {
  const parts = [apellidoPaterno, apellidoMaterno, nombres].filter(Boolean);
  return parts.join(" ");
}
