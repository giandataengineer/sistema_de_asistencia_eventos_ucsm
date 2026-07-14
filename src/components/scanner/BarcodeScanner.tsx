"use client";

import { useScanner } from "@/hooks/useScanner";
import { X, Camera, Loader2, RefreshCw } from "lucide-react";

interface BarcodeScannerProps {
  onDniDetected: (dni: string) => void;
  onError: (error: string) => void;
  onClose: () => void;
  continuousMode?: boolean;
}

export default function BarcodeScanner({
  onDniDetected,
  onError,
  onClose,
  continuousMode = false,
}: BarcodeScannerProps) {
  const { scanning, startScanner, stopScanner, scanImageFile, toggleCamera, containerId } = useScanner({
    onDniDetected,
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
                Posicione el codigo de barras 1D del DNI frente a la camara
              </p>
            </div>

            <div className="flex flex-col gap-4 w-full px-8">
              <button
                onClick={() => startScanner()}
                className="w-full py-3 rounded-xl font-bold text-primary-deep
                  bg-gradient-to-r from-accent-dim to-accent
                  hover:shadow-[0_8px_24px_rgba(0,230,118,0.35)]
                  hover:-translate-y-0.5 transition-all"
              >
                <Camera className="w-5 h-5 inline-block mr-2" />
                Iniciar Camara en Vivo
              </button>

              <div className="relative w-full">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) scanImageFile(file);
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  style={{ zIndex: 10 }}
                />
                <button
                  className="w-full py-3 rounded-xl font-bold text-accent border-2 border-accent
                    flex items-center justify-center gap-2
                    hover:bg-accent/10 transition-all"
                >
                  <Camera className="w-5 h-5" />
                  Tomar Foto (Recomendado)
                </button>
              </div>
            </div>
          </div>
        )}

        {scanning && (
          <>
            <div className="absolute top-4 right-4 z-50">
              <button
                onClick={toggleCamera}
                className="p-3 bg-black/50 text-white rounded-full backdrop-blur-sm border border-white/20 hover:bg-black/70 transition-colors"
                title="Cambiar Camara"
              >
                <RefreshCw className="w-6 h-6" />
              </button>
            </div>
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div
                className="relative w-[340px] h-[180px] border-2 border-accent/80 rounded-lg
                  shadow-[0_0_0_9999px_rgba(0,0,0,0.6)] overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-[2px] bg-red-500 shadow-[0_0_15px_3px_rgba(239,68,68,0.8)] animate-scan-line" />
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap
                  bg-accent/90 text-primary-deep text-xs font-bold px-3 py-1 rounded-full">
                  Enfoque el codigo DNI dentro del recuadro
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
