"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useAsistencias } from "@/hooks/useAsistencias";
import BarcodeScanner from "@/components/scanner/BarcodeScanner";
import ManualInput from "@/components/scanner/ManualInput";
import ExternalScanner from "@/components/scanner/ExternalScanner";
import AsistenciaTable from "@/components/asistencia/AsistenciaTable";
import DeleteModal from "@/components/asistencia/DeleteModal";
import { toast } from "sonner";
import {
  Camera,
  Keyboard,
  ScanBarcode,
  Users,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

type ScanMode = "camera" | "manual" | "external";

const MODE_TABS: { mode: ScanMode; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { mode: "camera", label: "Camara", icon: Camera },
  { mode: "external", label: "Escaner", icon: ScanBarcode },
  { mode: "manual", label: "Manual", icon: Keyboard },
];

export default function RegistroPage() {
  const { usuario } = useAuth();
  const [mode, setMode] = useState<ScanMode>("camera");
  const [continuousMode, setContinuousMode] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; nombre: string } | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successName, setSuccessName] = useState("");
  const [dniLoading, setDniLoading] = useState(false);
  const [lastManualResult, setLastManualResult] = useState<{ nombre: string; success: boolean } | null>(null);
  const processingRef = useRef(false);

  const { data, fetchAsistencias, registrar, eliminar, consultarDni } = useAsistencias();

  useEffect(() => {
    fetchAsistencias(1);
  }, [fetchAsistencias]);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/asistencias/actualizar-nombres", { method: "POST" });
        if (res.ok) {
          const result = await res.json();
          if (result.actualizados > 0) {
            fetchAsistencias(1);
          }
        }
      } catch {
        // silencioso en background
      }
    }, 45000);
    return () => clearInterval(interval);
  }, [fetchAsistencias]);

  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const debouncedRefresh = useCallback(() => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    refreshTimerRef.current = setTimeout(() => fetchAsistencias(1), 1500);
  }, [fetchAsistencias]);

  const handleDniDetected = useCallback(
    async (dni: string) => {
      if (processingRef.current) return;
      processingRef.current = true;
      setDniLoading(true);
      setLastManualResult(null);

      try {
        const regResult = await registrar({
          numeroDni: dni,
          apellidoPaterno: "...",
          apellidoMaterno: null,
          nombres: "Registrando",
          tipoDni: "electronico",
        });

        if (regResult.success) {
          toast.success(`DNI ${dni} registrado`, { duration: 1200 });
          setSuccessName(dni);
          setShowSuccessModal(true);
          setLastManualResult({ nombre: `DNI ${dni} - Registrado`, success: true });
          setTimeout(() => setShowSuccessModal(false), 700);
          debouncedRefresh();

          consultarDni(dni).then((reniecResult) => {
            const patchData = reniecResult.success && reniecResult.data
              ? reniecResult.data
              : { nombres: `DNI ${dni}`, apellidoPaterno: "POR VERIFICAR", apellidoMaterno: "" };

            fetch(`/api/asistencias/${regResult.data.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(patchData),
            }).then(() => debouncedRefresh());
          });
        } else if (regResult.duplicado) {
          toast.warning(regResult.error, { duration: 2000 });
          setLastManualResult({ nombre: regResult.error || "Ya registrado hoy", success: false });
        } else {
          toast.error(regResult.error || "Error al registrar");
          setLastManualResult({ nombre: regResult.error || "Error al registrar", success: false });
        }
      } catch {
        toast.error("Error de conexion. Intente nuevamente.");
        setLastManualResult({ nombre: "Error de conexion", success: false });
      } finally {
        setDniLoading(false);
        processingRef.current = false;
      }
    },
    [consultarDni, registrar, debouncedRefresh]
  );

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const ok = await eliminar(deleteTarget.id);
    if (ok) {
      toast.success("Registro eliminado");
      fetchAsistencias(1);
    } else {
      toast.error("Error al eliminar");
    }
    setDeleteTarget(null);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-primary tracking-tight">Registrar Asistencia</h1>
          <p className="text-sm text-muted mt-0.5">Escanee el DNI o ingrese los 8 digitos manualmente</p>
        </div>
        <div className="flex items-center gap-4 px-4 py-2.5 bg-white rounded-xl border border-border shadow-sm">
          <Users className="w-5 h-5 text-accent" />
          <div>
            <p className="text-2xl font-bold text-primary leading-none">{data?.total ?? 0}</p>
            <p className="text-[0.65rem] text-muted uppercase tracking-wider">Asistentes</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-border shadow-sm p-4 mb-6">
        <div className="flex items-center gap-1 p-1 bg-surface-alt rounded-lg mb-4">
          {MODE_TABS.map((tab) => (
            <button
              key={tab.mode}
              onClick={() => setMode(tab.mode)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg
                text-sm font-medium transition-all ${
                  mode === tab.mode
                    ? "bg-primary text-accent shadow-sm"
                    : "text-muted hover:text-ink"
                }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between mb-4 px-1">
          <span className="text-sm text-ink-light">Modo Cola Continua</span>
          <button onClick={() => setContinuousMode(!continuousMode)} className="text-accent">
            {continuousMode ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8 text-muted" />}
          </button>
        </div>

        {mode === "camera" && (
          <button
            onClick={() => setShowScanner(true)}
            className="w-full py-3.5 rounded-xl font-bold text-sm
              bg-gradient-to-r from-accent-dim to-accent text-primary-deep
              hover:shadow-[0_8px_24px_rgba(0,230,118,0.35)]
              hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
          >
            <Camera className="w-5 h-5" />
            Abrir Camara y Escanear DNI
          </button>
        )}

        {mode === "manual" && (
          <ManualInput
            onDniDetected={handleDniDetected}
            loading={dniLoading}
            lastResult={lastManualResult}
          />
        )}
        {mode === "external" && (
          <ExternalScanner
            onDniDetected={handleDniDetected}
            onError={(err) => toast.error(err)}
            continuousMode={continuousMode}
          />
        )}
      </div>

      <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="px-4 py-3 bg-gradient-to-r from-primary to-primary-mid text-accent text-sm font-semibold uppercase tracking-wider">
          Ultimos Registros
        </div>
        <div className="p-4">
          <AsistenciaTable registros={data?.data ?? []} onDelete={(id, nombre) => setDeleteTarget({ id, nombre })} />
        </div>
      </div>

      {showScanner && (
        <BarcodeScanner
          onDniDetected={handleDniDetected}
          onError={(err) => toast.error(err)}
          onClose={() => setShowScanner(false)}
          continuousMode={continuousMode}
        />
      )}
      {deleteTarget && <DeleteModal nombre={deleteTarget.nombre} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />}

      {showSuccessModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-accent/20 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-primary/90 p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-4 animate-in zoom-in-50 duration-300 border border-accent/30">
            <div className="w-24 h-24 rounded-full bg-accent flex items-center justify-center animate-bounce shadow-[0_0_40px_rgba(0,230,118,0.6)]">
              <span className="text-primary text-5xl font-black">&#10003;</span>
            </div>
            <h2 className="text-4xl font-black text-accent tracking-wider uppercase drop-shadow-md">Registrado!</h2>
            {successName && (
              <p className="text-white text-xl font-medium mt-2">{successName}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
