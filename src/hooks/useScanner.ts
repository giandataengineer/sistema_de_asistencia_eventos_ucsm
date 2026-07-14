"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { extractDniFromBarcode } from "@/lib/pdf417-parser";
import { playBeep } from "@/lib/utils";

interface UseScannerOptions {
  onDniDetected?: (dni: string) => void;
  onScanError?: (error: string) => void;
  continuousMode?: boolean;
}

export function useScanner(options: UseScannerOptions = {}) {
  const [scanning, setScanning] = useState(false);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerIdRef = useRef(`scanner-${Math.random().toString(36).substring(2, 9)}`);
  const lastScannedRef = useRef<string>("");

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch {
        // Already stopped
      }
      scannerRef.current = null;
    }
    setScanning(false);
  }, []);

  const processRawData = useCallback(
    (raw: string) => {
      if (raw === lastScannedRef.current) return;
      lastScannedRef.current = raw;

      const result = extractDniFromBarcode(raw);

      if (result.success && result.dni) {
        if (navigator.vibrate) navigator.vibrate(200);
        playBeep();
        options.onDniDetected?.(result.dni);

        if (!options.continuousMode) {
          stopScanner();
        } else {
          setTimeout(() => {
            lastScannedRef.current = "";
          }, 2000);
        }
      } else {
        options.onScanError?.(result.error || "No se detecto un DNI valido");
      }
    },
    [options, stopScanner]
  );

  const startScanner = useCallback(async (forcedFacingMode?: "environment" | "user") => {
    lastScannedRef.current = "";

    const modeToUse = forcedFacingMode || facingMode;

    const scanner = new Html5Qrcode(containerIdRef.current, {
      formatsToSupport: [Html5QrcodeSupportedFormats.PDF_417, Html5QrcodeSupportedFormats.QR_CODE],
      useBarCodeDetectorIfSupported: true,
      verbose: false,
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
    } catch {
      setScanning(false);
      try {
        await scanner.start(
          { facingMode: modeToUse },
          { fps: 10, videoConstraints: { width: { ideal: 1920 }, height: { ideal: 1080 } } },
          (decodedText) => processRawData(decodedText),
          () => {}
        );
        setScanning(true);
      } catch (fallbackErr) {
        const message = fallbackErr instanceof Error ? fallbackErr.message : "Error al acceder a la camara";
        options.onScanError?.(message);
      }
    }
  }, [facingMode, options, processRawData]);

  const toggleCamera = useCallback(async () => {
    const newMode = facingMode === "environment" ? "user" : "environment";
    setFacingMode(newMode);
    await stopScanner();
    setTimeout(() => startScanner(newMode), 300);
  }, [facingMode, stopScanner, startScanner]);

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, [stopScanner]);

  return {
    scanning,
    startScanner,
    stopScanner,
    processRawData,
    toggleCamera,
    facingMode,
    containerId: containerIdRef.current,
  };
}
