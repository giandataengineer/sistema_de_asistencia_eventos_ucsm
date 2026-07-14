"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { extractDniFromBarcode } from "@/lib/pdf417-parser";
import { ScanBarcode, Loader2, CheckCircle2 } from "lucide-react";
import { playBeep } from "@/lib/utils";

interface ExternalScannerProps {
  onDniDetected: (dni: string) => void;
  onError: (error: string) => void;
  continuousMode?: boolean;
}

export default function ExternalScanner({
  onDniDetected,
  onError,
  continuousMode = false,
}: ExternalScannerProps) {
  const [buffer, setBuffer] = useState("");
  const [status, setStatus] = useState<"waiting" | "detected">("waiting");
  const inputRef = useRef<HTMLInputElement>(null);
  const lastProcessedRef = useRef("");

  const processBuffer = useCallback(
    (value: string) => {
      const result = extractDniFromBarcode(value);
      if (result.success && result.dni) {
        if (result.dni === lastProcessedRef.current) return;
        lastProcessedRef.current = result.dni;

        if (navigator.vibrate) navigator.vibrate(200);
        playBeep();
        setStatus("detected");
        onDniDetected(result.dni);

        setTimeout(() => {
          setBuffer("");
          setStatus("waiting");
          lastProcessedRef.current = "";
          inputRef.current?.focus();
        }, 1500);
      }
    },
    [onDniDetected]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value.replace(/\D/g, "");
      setBuffer(value);

      if (value.length === 8) {
        processBuffer(value);
      }
    },
    [processBuffer]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && buffer.trim()) {
      e.preventDefault();
      const result = extractDniFromBarcode(buffer.trim());
      if (result.success && result.dni) {
        processBuffer(buffer.trim());
      } else {
        onError("DNI no valido. Debe contener 8 digitos.");
      }
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

      <div className="p-6 rounded-xl border-2 border-dashed border-accent/30 bg-accent/5 text-center">
        <ScanBarcode className="w-10 h-10 mx-auto mb-3 text-accent/60" />
        <p className="text-sm text-ink-light mb-4">
          Escanee el codigo de barras del DNI. Se registrara automaticamente al detectar 8 digitos.
        </p>

        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          value={buffer}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={() => inputRef.current?.focus()}
          className="w-full px-4 py-3 rounded-xl border border-border bg-white
            focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none
            transition-all text-sm text-center font-mono text-lg tracking-widest"
          placeholder="Esperando lectura..."
          maxLength={8}
          autoFocus
        />

        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted">
          {status === "waiting" ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Esperando datos del escaner...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-3 h-3 text-accent" />
              <span className="text-accent font-medium">DNI detectado. Consultando RENIEC...</span>
            </>
          )}
        </div>
      </div>

      {continuousMode && (
        <p className="text-xs text-accent font-medium text-center">
          Cola continua activa. Se registra automaticamente al detectar el DNI.
        </p>
      )}
    </div>
  );
}
