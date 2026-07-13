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

export function playBeep() {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.type = "sine";
    oscillator.frequency.value = 800; // 800 Hz (frecuencia típica de escáner)

    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.5, audioCtx.currentTime + 0.05);
    gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.15);

    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + 0.15);
  } catch (e) {
    // Ignorar si el navegador no soporta Web Audio API o está bloqueado
    console.error("Audio beep failed:", e);
  }
}
