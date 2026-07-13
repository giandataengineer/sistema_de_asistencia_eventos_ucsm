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

  const startScanner = useCallback(async () => {
    lastScannedRef.current = "";
    setLastResult(null);

    // Configuramos explícitamente el soporte para PDF417 (DNI)
    const scanner = new Html5Qrcode(containerIdRef.current, {
      formatsToSupport: [ Html5QrcodeSupportedFormats.PDF_417, Html5QrcodeSupportedFormats.QR_CODE ],
      useBarCodeDetectorIfSupported: true, // Usa API nativa si está disponible (mucho más rápido)
    });
    scannerRef.current = scanner;
    setScanning(true);

    try {
      await scanner.start(
        { facingMode: "environment" },
        {
          // Bajamos un poco los FPS a 10. PDF417 requiere mucho CPU para procesar. 
          // Si le exigimos muchos FPS, el celular salta frames y nunca lo lee.
          fps: 10,
          videoConstraints: {
            // Forzamos la resolución al máximo posible (4K si el celular lo soporta, o su máximo)
            width: { ideal: 3840, min: 1920 },
            height: { ideal: 2160, min: 1080 },
            // Forzamos enfoque continuo y un ligero zoom (si el hardware lo permite) 
            // porque el PDF417 necesita verse GRANDE en la pantalla.
            advanced: [{ focusMode: "continuous", zoom: 1.5 }] as any,
          },
        },
        (decodedText) => processRawData(decodedText),
        () => {} 
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

  const scanImageFile = useCallback(
    async (file: File) => {
      setScanning(true);
      try {
        const scanner = new Html5Qrcode(containerIdRef.current);
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
    containerId: containerIdRef.current,
  };
}
