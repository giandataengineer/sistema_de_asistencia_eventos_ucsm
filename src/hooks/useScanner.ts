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

async function applyMaxQualityConstraints(containerId: string) {
  try {
    const video = document.querySelector(`#${containerId} video`) as HTMLVideoElement | null;
    if (!video?.srcObject) return;
    const track = (video.srcObject as MediaStream).getVideoTracks()[0];
    if (!track) return;

    const capabilities = track.getCapabilities() as any;
    const advanced: Record<string, unknown> = {};

    if (capabilities.focusMode?.includes("continuous")) {
      advanced.focusMode = "continuous";
    }
    if (capabilities.zoom) {
      advanced.zoom = Math.min(capabilities.zoom.max, 2.5);
    }
    if (capabilities.focusDistance) {
      advanced.focusDistance = capabilities.focusDistance.min;
    }

    if (Object.keys(advanced).length > 0) {
      await track.applyConstraints({ advanced: [advanced] } as any);
    }
  } catch {
    // Not all browsers support these constraints
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

    try {
      await scanner.start(
        { facingMode: modeToUse },
        {
          fps: 15,
          videoConstraints: {
            width: { ideal: 3840, min: 1280 },
            height: { ideal: 2160, min: 720 },
            aspectRatio: { ideal: 16 / 9 },
            frameRate: { ideal: 30 },
            advanced: [{ focusMode: "continuous", zoom: 2.0 }] as any,
          },
        },
        onSuccess,
        onFailure
      );
      await applyMaxQualityConstraints(containerIdRef.current);
    } catch {
      setScanning(false);
      try {
        await scanner.start(
          { facingMode: modeToUse },
          {
            fps: 15,
            videoConstraints: {
              width: { ideal: 1920 },
              height: { ideal: 1080 },
            },
          },
          onSuccess,
          onFailure
        );
        setScanning(true);
        await applyMaxQualityConstraints(containerIdRef.current);
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
