"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { parsePDF417 } from "@/lib/pdf417-parser";
import type { DatosDNI } from "@/interfaces/dni.interface";
import { ScanBarcode, Loader2 } from "lucide-react";

interface ExternalScannerProps {
  onScan: (datos: DatosDNI) => void;
  onError: (error: string) => void;
  continuousMode?: boolean;
}

export default function ExternalScanner({
  onScan,
  onError,
  continuousMode = false,
}: ExternalScannerProps) {
  const [buffer, setBuffer] = useState("");
  const [waiting, setWaiting] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  const processInput = useCallback(
    (raw: string) => {
      const result = parsePDF417(raw);

      if (result.success && result.data) {
        if (navigator.vibrate) navigator.vibrate(200);
        onScan(result.data);
      } else {
        onError(result.error || "No se pudo leer el codigo");
      }

      setBuffer("");
      if (continuousMode) {
        setTimeout(() => inputRef.current?.focus(), 500);
      }
    },
    [onScan, onError, continuousMode]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && buffer.trim()) {
      e.preventDefault();
      processInput(buffer.trim());
    }
  };

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <ScanBarcode className="w-5 h-5 text-accent" />
        <h3 className="font-semibold text-ink">Escaner Externo</h3>
      </div>

      <div className="p-6 rounded-xl border-2 border-dashed border-accent/30 bg-accent/5
        text-center">
        <ScanBarcode className="w-10 h-10 mx-auto mb-3 text-accent/60" />
        <p className="text-sm text-ink-light mb-4">
          Enfoque el escaner al codigo de barras del DNI.
          El campo de texto recibira los datos automaticamente.
        </p>

        <input
          ref={inputRef}
          type="text"
          value={buffer}
          onChange={(e) => {
            setBuffer(e.target.value);
            setWaiting(false);
          }}
          onKeyDown={handleKeyDown}
          onBlur={() => inputRef.current?.focus()}
          className="w-full px-4 py-3 rounded-xl border border-border bg-white
            focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none
            transition-all text-sm text-center"
          placeholder="Esperando lectura del escaner..."
          autoFocus
        />

        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted">
          {waiting ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Esperando datos del escaner...</span>
            </>
          ) : (
            <span>Datos recibidos. Presione Enter o escanee el siguiente DNI.</span>
          )}
        </div>
      </div>

      {continuousMode && (
        <p className="text-xs text-accent font-medium text-center">
          Cola continua activa. El campo se limpia tras cada lectura exitosa.
        </p>
      )}
    </div>
  );
}
