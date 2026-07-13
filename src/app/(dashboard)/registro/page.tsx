"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useAsistencias } from "@/hooks/useAsistencias";
import BarcodeScanner from "@/components/scanner/BarcodeScanner";
import ManualInput from "@/components/scanner/ManualInput";
import ExternalScanner from "@/components/scanner/ExternalScanner";
import AsistenciaTable from "@/components/asistencia/AsistenciaTable";
import DeleteModal from "@/components/asistencia/DeleteModal";
import type { DatosDNI } from "@/interfaces/dni.interface";
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

  const { data, fetchAsistencias, registrar, eliminar } = useAsistencias({
    eventoId: usuario?.eventoId ?? "",
  });

  useEffect(() => {
    if (usuario?.eventoId) fetchAsistencias(1);
  }, [fetchAsistencias, usuario?.eventoId]);

  const handleScan = useCallback(
    async (datos: DatosDNI) => {
      const result = await registrar({
        numeroDni: datos.numeroDNI,
        apellidoPaterno: datos.apellidoPaterno,
        apellidoMaterno: datos.apellidoMaterno,
        nombres: datos.nombres,
        tipoDni: datos.tipoDNI,
      });

      if (result.success) {
        toast.success(`${datos.apellidoPaterno} ${datos.nombres} registrado`, { duration: 2000 });
        setSuccessName(`${datos.nombres} ${datos.apellidoPaterno}`);
        setShowSuccessModal(true);
        setTimeout(() => setShowSuccessModal(false), 1500);
        fetchAsistencias(1);
      } else if (result.duplicado) {
        toast.warning(result.error, { duration: 3000 });
      } else {
        toast.error(result.error || "Error al registrar");
      }
    },
    [registrar, fetchAsistencias]
  );

  const handleManualSubmit = useCallback(
    async (form: { numeroDni: string; apellidoPaterno: string; apellidoMaterno: string; nombres: string }) => {
      const result = await registrar({
        numeroDni: form.numeroDni,
        apellidoPaterno: form.apellidoPaterno,
        apellidoMaterno: form.apellidoMaterno || null,
        nombres: form.nombres,
        tipoDni: "electronico",
      });

      if (result.success) {
        toast.success(`${form.apellidoPaterno} ${form.nombres} registrado`);
        setSuccessName(`${form.nombres} ${form.apellidoPaterno}`);
        setShowSuccessModal(true);
        setTimeout(() => setShowSuccessModal(false), 1500);
        fetchAsistencias(1);
      } else if (result.duplicado) {
        toast.warning(result.error);
      } else {
        toast.error(result.error || "Error al registrar");
      }
    },
    [registrar, fetchAsistencias]
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
          <p className="text-sm text-muted mt-0.5">Escanee el DNI o ingrese los datos manualmente</p>
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

        {mode === "manual" && <ManualInput onSubmit={handleManualSubmit} />}
        {mode === "external" && (
          <ExternalScanner onScan={handleScan} onError={(err) => toast.error(err)} continuousMode={continuousMode} />
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
        <BarcodeScanner onScan={handleScan} onError={(err) => toast.error(err)} onClose={() => setShowScanner(false)} continuousMode={continuousMode} />
      )}
      {deleteTarget && <DeleteModal nombre={deleteTarget.nombre} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />}
      
      {showSuccessModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-accent/20 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-primary/90 p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-4 animate-in zoom-in-50 duration-300 border border-accent/30">
            <div className="w-24 h-24 rounded-full bg-accent flex items-center justify-center animate-bounce shadow-[0_0_40px_rgba(0,230,118,0.6)]">
              <span className="text-primary text-5xl font-black">✓</span>
            </div>
            <h2 className="text-4xl font-black text-accent tracking-wider uppercase drop-shadow-md">¡Registrado!</h2>
            {successName && (
              <p className="text-white text-xl font-medium mt-2">{successName}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
