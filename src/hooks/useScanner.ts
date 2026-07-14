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

async function applyZoomAndFocus(containerId: string) {
  try {
    const video = document.querySelector(`#${containerId} video`) as HTMLVideoElement | null;
    if (!video?.srcObject) return;
    const track = (video.srcObject as MediaStream).getVideoTracks()[0];
    if (!track) return;

    const caps = track.getCapabilities() as any;
    const settings: Record<string, unknown> = {};

    if (caps.zoom) {
      settings.zoom = Math.min(caps.zoom.max, 3.0);
    }
    if (caps.focusMode?.includes("continuous")) {
      settings.focusMode = "continuous";
    }

    if (Object.keys(settings).length > 0) {
      try {
        await track.applyConstraints({ advanced: [settings] } as any);
      } catch {
        await track.applyConstraints(settings as any);
      }
    }
  } catch {
    // Browser doesn't support zoom/focus constraints
  }
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
      formatsToSupport: [
        Html5QrcodeSupportedFormats.CODE_39,
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.ITF,
        Html5QrcodeSupportedFormats.EAN_13,
      ],
      useBarCodeDetectorIfSupported: true,
      verbose: false,
    });
    scannerRef.current = scanner;
    setScanning(true);

    const onSuccess = (decodedText: string) => processRawData(decodedText);
    const onFailure = () => {};

    const config = { fps: 15, qrbox: { width: 300, height: 150 } };

    // Intento 1: camara trasera forzada
    try {
      await scanner.start(
        { facingMode: { exact: modeToUse } },
        config,
        onSuccess,
        onFailure
      );
      setTimeout(() => applyZoomAndFocus(containerIdRef.current), 800);
      return;
    } catch {
      // exact no soportado, intentar sin exact
    }

    // Intento 2: camara trasera preferida
    try {
      await scanner.start(
        { facingMode: modeToUse },
        config,
        onSuccess,
        onFailure
      );
      setTimeout(() => applyZoomAndFocus(containerIdRef.current), 800);
      return;
    } catch {
      // tampoco funciono
    }

    // Intento 3: cualquier camara
    try {
      await scanner.start(
        { facingMode: "environment" },
        config,
        onSuccess,
        onFailure
      );
      setTimeout(() => applyZoomAndFocus(containerIdRef.current), 800);
    } catch (finalErr) {
      setScanning(false);
      const message = finalErr instanceof Error ? finalErr.message : "Error al acceder a la camara";
      options.onScanError?.(message);
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
