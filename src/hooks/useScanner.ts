"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { parsePDF417 } from "@/lib/pdf417-parser";
import type { DatosDNI, ScanResult } from "@/interfaces/dni.interface";

interface UseScannerOptions {
  onScanSuccess?: (datos: DatosDNI) => void;
  onScanError?: (error: string) => void;
  continuousMode?: boolean;
}

export function useScanner(options: UseScannerOptions = {}) {
  const [scanning, setScanning] = useState(false);
  const [lastResult, setLastResult] = useState<ScanResult | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerIdRef = useRef("scanner-container");
  const lastScannedRef = useRef<string>("");

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch {
        // El scanner ya estaba detenido
      }
      scannerRef.current = null;
    }
    setScanning(false);
  }, []);

  const processRawData = useCallback(
    (raw: string) => {
      // Evitar procesar el mismo codigo dos veces seguidas
      if (raw === lastScannedRef.current) return;
      lastScannedRef.current = raw;

      const result = parsePDF417(raw);
      setLastResult(result);

      if (result.success && result.data) {
        // Vibracion haptica al detectar
        if (navigator.vibrate) navigator.vibrate(200);

        options.onScanSuccess?.(result.data);

        if (!options.continuousMode) {
          stopScanner();
        } else {
          // Limpiar despues de 2 segundos para permitir otro escaneo
          setTimeout(() => {
            lastScannedRef.current = "";
          }, 2000);
        }
      } else {
        options.onScanError?.(result.error || "Error desconocido");
      }
    },
    [options, stopScanner]
  );

  const startScanner = useCallback(async () => {
    lastScannedRef.current = "";
    setLastResult(null);

    const scanner = new Html5Qrcode(containerIdRef.current);
    scannerRef.current = scanner;
    setScanning(true);

    try {
      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 300, height: 150 },
          aspectRatio: 1.777,
        },
        (decodedText) => processRawData(decodedText),
        () => {} // Silenciar errores de frames sin codigo detectado
      );
    } catch (err) {
      setScanning(false);
      const message =
        err instanceof Error ? err.message : "No se pudo acceder a la camara";
      options.onScanError?.(message);
    }
  }, [processRawData, options]);

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  return {
    scanning,
    lastResult,
    startScanner,
    stopScanner,
    processRawData,
    containerId: containerIdRef.current,
  };
}
