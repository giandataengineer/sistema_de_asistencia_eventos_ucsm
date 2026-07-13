"use client";

import { useScanner } from "@/hooks/useScanner";
import type { DatosDNI } from "@/interfaces/dni.interface";
import { X, Camera, Loader2 } from "lucide-react";

interface BarcodeScannerProps {
  onScan: (datos: DatosDNI) => void;
  onError: (error: string) => void;
  onClose: () => void;
  continuousMode?: boolean;
}

export default function BarcodeScanner({
  onScan,
  onError,
  onClose,
  continuousMode = false,
}: BarcodeScannerProps) {
  const { scanning, startScanner, stopScanner, containerId } = useScanner({
    onScanSuccess: onScan,
    onScanError: onError,
    continuousMode,
  });

  const handleClose = () => {
    stopScanner();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 bg-primary-deep">
        <div className="flex items-center gap-2 text-white">
          <Camera className="w-5 h-5 text-accent" />
          <span className="font-semibold text-sm">
            {continuousMode ? "Modo Cola Continua" : "Escanear DNI"}
          </span>
        </div>
        <button
          onClick={handleClose}
          className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
        >
          <X className="w-5 h-5 text-white" />
        </button>
      </div>

      <div className="flex-1 relative flex items-center justify-center bg-black">
        <div id={containerId} className="w-full h-full" />

        {!scanning && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-6">
            <div className="text-center text-white/70 px-8">
              <p className="text-lg font-medium mb-2">Lector de DNI Peruano</p>
              <p className="text-sm">
                Posicione el codigo de barras PDF417 del reverso del DNI
                frente a la camara
              </p>
            </div>
            <button
              onClick={startScanner}
              className="px-8 py-3 rounded-xl font-bold text-primary-deep
                bg-gradient-to-r from-accent-dim to-accent
                hover:shadow-[0_8px_24px_rgba(0,230,118,0.35)]
                hover:-translate-y-0.5 transition-all"
            >
              <Camera className="w-5 h-5 inline-block mr-2" />
              Iniciar Camara
            </button>
          </div>
        )}

        {scanning && (
          <>
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div
                className="w-[320px] h-[160px] border-2 border-accent rounded-lg
                  shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]"
              >
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap
                  bg-accent/90 text-primary-deep text-xs font-bold px-3 py-1 rounded-full">
                  Enfoque el codigo de barras aqui
                </div>
              </div>
            </div>

            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2
              bg-black/60 backdrop-blur-sm px-4 py-2 rounded-full text-white text-sm">
              <Loader2 className="w-4 h-4 animate-spin text-accent" />
              Buscando codigo...
            </div>
          </>
        )}
      </div>

      {continuousMode && scanning && (
        <div className="px-4 py-2 bg-accent/10 text-center">
          <span className="text-accent text-xs font-medium">
            Cola continua activa &mdash; escaneo automatico tras cada lectura
          </span>
        </div>
      )}
    </div>
  );
}
