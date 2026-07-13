"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { parsePDF417 } from "@/lib/pdf417-parser";
import type { DatosDNI, ScanResult } from "@/interfaces/dni.interface";
import { playBeep } from "@/lib/utils";

interface UseScannerOptions {
  onScanSuccess?: (datos: DatosDNI) => void;
  onScanError?: (error: string) => void;
  continuousMode?: boolean;
}

export function useScanner(options: UseScannerOptions = {}) {
  const [scanning, setScanning] = useState(false);
  const [lastResult, setLastResult] = useState<ScanResult | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerIdRef = useRef(`scanner-${Math.random().toString(36).substring(2, 9)}`);
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
        // Sonido de "Pip" como escáner real
        playBeep();

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

  const startScanner = useCallback(async (forcedFacingMode?: "environment" | "user") => {
    lastScannedRef.current = "";
    setLastResult(null);

    const modeToUse = forcedFacingMode || facingMode;

    // Configuramos explícitamente el soporte para PDF417 (DNI)
    const scanner = new Html5Qrcode(containerIdRef.current, {
      formatsToSupport: [ Html5QrcodeSupportedFormats.PDF_417, Html5QrcodeSupportedFormats.QR_CODE ],
      useBarCodeDetectorIfSupported: true, // Usa API nativa si está disponible (mucho más rápido)
      verbose: false, // Requerido por TypeScript
    });
    scannerRef.current = scanner;
    setScanning(true);

    try {
      await scanner.start(
        { facingMode: modeToUse },
        {
          fps: 10,
          videoConstraints: {
            width: { ideal: 3840, min: 1920 },
            height: { ideal: 2160, min: 1080 },
            advanced: [{ focusMode: "continuous", zoom: 1.5 }] as any,
          },
        },
        (decodedText) => processRawData(decodedText),
        () => {} 
      );
    } catch (err) {
      setScanning(false);
      // Fallback: If advanced constraints failed, try again without advanced constraints
      try {
        await scanner.start(
          { facingMode: modeToUse },
          { fps: 10, videoConstraints: { width: { ideal: 1920 }, height: { ideal: 1080 } } },
          (decodedText) => processRawData(decodedText),
          () => {} 
        );
        setScanning(true);
      } catch (fallbackErr) {
        const message = fallbackErr instanceof Error ? fallbackErr.message : "Error al acceder a la cámara";
        options.onScanError?.(message);
      }
    }
  }, [facingMode, options, processRawData]);

  const toggleCamera = useCallback(async () => {
    const newMode = facingMode === "environment" ? "user" : "environment";
    setFacingMode(newMode);
    await stopScanner();
    // Restart scanner with new mode
    setTimeout(() => startScanner(newMode), 300);
  }, [facingMode, stopScanner, startScanner]);

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, [stopScanner]);

  const scanImageFile = useCallback(
    async (file: File) => {
      setScanning(true);
      try {
        const scanner = new Html5Qrcode(containerIdRef.current, {
          formatsToSupport: [ Html5QrcodeSupportedFormats.PDF_417, Html5QrcodeSupportedFormats.QR_CODE ],
          useBarCodeDetectorIfSupported: true,
          verbose: false,
        });
        const decodedText = await scanner.scanFile(file, false);
        processRawData(decodedText);
      } catch (err) {
        options.onScanError?.("No se encontró ningún código de barras en la foto. Intente con otra.");
      } finally {
        setScanning(false);
      }
    },
    [processRawData, options]
  );

  return {
    scanning,
    lastResult,
    startScanner,
    stopScanner,
    processRawData,
    scanImageFile,
    toggleCamera,
    facingMode,
    containerId: containerIdRef.current,
  };
}
