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
  LogIn,
  LogOut,
  Plus,
  ClipboardList,
  Calendar,
  Settings,
  X,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

type ScanMode = "camera" | "manual" | "external";
type TipoRegistro = "entrada" | "salida";
type TipoAsistenciaDia = "entrada_salida" | "solo_entrada" | "solo_salida";

interface RegistroModule {
  id: number;
  label: string;
}

interface DiaConfig {
  dia: number;
  nombre: string | null;
  fecha: string | null;
  tipoAsistencia: TipoAsistenciaDia;
}

interface PaymentStatus {
  found: boolean;
  estadoPago: string;
  nombreCompleto?: {
    apellidoPaterno: string;
    apellidoMaterno: string | null;
    nombres: string;
  };
}

const MODE_TABS: { mode: ScanMode; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { mode: "camera", label: "Camara", icon: Camera },
  { mode: "external", label: "Escaner", icon: ScanBarcode },
  { mode: "manual", label: "Manual", icon: Keyboard },
];

function formatFechaDia(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const dias = ["Domingo", "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"];
  const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  return `${dias[date.getDay()]} ${d} ${meses[date.getMonth()]}`;
}

function buildModules(count: number): RegistroModule[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    label: `${i + 1}° Registro de Asistencia`,
  }));
}

export default function RegistroPage() {
  const { usuario } = useAuth();
  const [fechas, setFechas] = useState<Record<number, string>>({});
  const [availableDias, setAvailableDias] = useState<number[]>([]);
  const [diasConfig, setDiasConfig] = useState<DiaConfig[]>([]);
  const [selectedDia, setSelectedDia] = useState<number | null>(null);
  const [modules, setModules] = useState<RegistroModule[]>([{ id: 1, label: "1° Registro de Asistencia" }]);
  const [activeModuleId, setActiveModuleId] = useState(1);
  const [mode, setMode] = useState<ScanMode>("camera");
  const [tipoRegistro, setTipoRegistro] = useState<TipoRegistro>("entrada");
  const [continuousMode, setContinuousMode] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; nombre: string } | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successName, setSuccessName] = useState("");
  const [dniLoading, setDniLoading] = useState(false);
  const [lastManualResult, setLastManualResult] = useState<{ nombre: string; success: boolean } | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDiaModal, setShowDiaModal] = useState(false);
  const [newDiaNum, setNewDiaNum] = useState(1);
  const [newDiaNombre, setNewDiaNombre] = useState("");
  const [newDiaFecha, setNewDiaFecha] = useState("");
  const [newDiaTipo, setNewDiaTipo] = useState<TipoAsistenciaDia>("entrada_salida");
  const processingRef = useRef(false);
  const initializedRef = useRef(false);

  const { data, fetchAsistencias, registrar, eliminar, consultarDni, verificarPago } = useAsistencias();

  const fetchDiasConfig = useCallback(async () => {
    try {
      const res = await fetch("/api/dias");
      if (res.ok) {
        const result = await res.json();
        setDiasConfig(result.dias ?? []);
      }
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [metaRes, diaRes] = await Promise.all([
          fetch("/api/asistencias/metadata"),
          fetch("/api/asistencias/dia-actual"),
          fetchDiasConfig(),
        ]);

        const meta = metaRes.ok ? await metaRes.json() : { dias: [] };
        const diaData = diaRes.ok ? await diaRes.json() : { dia: 1, totalDias: 1, fechas: {} };

        setFechas(diaData.fechas ?? {});

        const diasFromDb: number[] = meta.dias ?? [];
        const allDias: number[] = [];
        for (let i = 1; i <= (diaData.totalDias ?? 1); i++) {
          allDias.push(i);
        }
        const merged = [...new Set([...allDias, ...diasFromDb])].sort((a, b) => a - b);
        setAvailableDias(merged);

        if (!initializedRef.current && merged.length > 0) {
          initializedRef.current = true;
          const current = diasFromDb.includes(diaData.dia) ? diaData.dia : merged[merged.length - 1];
          setSelectedDia(current);
        }
      } catch {
        setAvailableDias([1]);
      }
    })();
  }, [fetchDiasConfig]);

  const currentDiaConfig = diasConfig.find((d) => d.dia === selectedDia);
  const tipoAsistenciaDia: TipoAsistenciaDia = currentDiaConfig?.tipoAsistencia ?? "entrada_salida";

  useEffect(() => {
    if (selectedDia === null) return;
    if (tipoAsistenciaDia === "solo_entrada") setTipoRegistro("entrada");
    else if (tipoAsistenciaDia === "solo_salida") setTipoRegistro("salida");
  }, [selectedDia, tipoAsistenciaDia]);

  useEffect(() => {
    if (selectedDia === null) return;

    (async () => {
      try {
        const res = await fetch(`/api/asistencias/metadata?dia=${selectedDia}`);
        if (!res.ok) return;
        const meta = await res.json();
        const dbSessions: number[] = meta.sesiones ?? [];
        const maxSession = dbSessions.length > 0 ? Math.max(...dbSessions) : 1;
        setModules(buildModules(maxSession));
        setActiveModuleId(1);
      } catch {
        setModules([{ id: 1, label: "1° Registro de Asistencia" }]);
      }
    })();
  }, [selectedDia]);

  useEffect(() => {
    if (selectedDia === null) return;
    fetchAsistencias(1, undefined, selectedDia, activeModuleId, tipoRegistro);
  }, [fetchAsistencias, selectedDia, activeModuleId, tipoRegistro]);

  useEffect(() => {
    if (selectedDia === null) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/asistencias/actualizar-nombres", { method: "POST" });
        if (res.ok) {
          const result = await res.json();
          if (result.actualizados > 0) {
            fetchAsistencias(1, undefined, selectedDia, activeModuleId, tipoRegistro);
          }
        }
      } catch { /* silent */ }
    }, 45000);
    return () => clearInterval(interval);
  }, [fetchAsistencias, selectedDia, activeModuleId, tipoRegistro]);

  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const debouncedRefresh = useCallback(() => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    refreshTimerRef.current = setTimeout(() => {
      if (selectedDia !== null) {
        fetchAsistencias(1, undefined, selectedDia, activeModuleId, tipoRegistro);
      }
    }, 1500);
  }, [fetchAsistencias, selectedDia, activeModuleId, tipoRegistro]);

  const handleAddModule = () => {
    if (modules.length >= 10) {
      toast.warning("Maximo 10 registros de asistencia");
      return;
    }
    if (selectedDia === null) {
      toast.warning("Selecciona un dia primero");
      return;
    }
    const nextNum = modules.length + 1;
    setModules(buildModules(nextNum));
    setActiveModuleId(nextNum);
    if (tipoAsistenciaDia === "solo_entrada") setTipoRegistro("entrada");
    else if (tipoAsistenciaDia === "solo_salida") setTipoRegistro("salida");
    else setTipoRegistro("entrada");
    toast.success(`${nextNum}° Registro de Asistencia agregado`);
  };

  const handleCreateDia = async () => {
    try {
      const res = await fetch("/api/dias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dia: newDiaNum,
          nombre: newDiaNombre || `Dia ${newDiaNum}`,
          fecha: newDiaFecha || null,
          tipoAsistencia: newDiaTipo,
        }),
      });
      if (res.ok) {
        toast.success(`Dia ${newDiaNum} creado`);
        setShowDiaModal(false);
        if (!availableDias.includes(newDiaNum)) {
          setAvailableDias((prev) => [...prev, newDiaNum].sort((a, b) => a - b));
        }
        await fetchDiasConfig();
        setSelectedDia(newDiaNum);
      } else {
        const err = await res.json();
        toast.error(err.error || "Error al crear dia");
      }
    } catch {
      toast.error("Error de conexion");
    }
  };

  const handleDniDetected = useCallback(
    async (dni: string) => {
      if (processingRef.current) return;
      if (selectedDia === null) {
        toast.warning("Selecciona un dia primero");
        return;
      }
      processingRef.current = true;
      setDniLoading(true);
      setLastManualResult(null);
      setPaymentStatus(null);

      const tipoLabel = tipoRegistro === "entrada" ? "ENTRADA" : "SALIDA";

      try {
        // 1. RENIEC lookup FIRST to get real names
        const reniecResult = await consultarDni(dni);
        const nombres = reniecResult.success && reniecResult.data
          ? reniecResult.data
          : { nombres: `DNI ${dni}`, apellidoPaterno: "POR VERIFICAR", apellidoMaterno: "" };

        // 2. Check payment with RENIEC names against Excel list
        const pagoResult = await verificarPago(
          nombres.apellidoPaterno,
          nombres.apellidoMaterno,
          nombres.nombres
        );

        // If participant list has more complete name, use it
        if (pagoResult.found && pagoResult.nombreCompleto) {
          const nc = pagoResult.nombreCompleto;
          const reniecParts = (nombres.nombres || "").split(" ").filter(Boolean);
          const listParts = nc.nombres.split(" ").filter(Boolean);
          if (listParts.length > reniecParts.length) {
            nombres.nombres = nc.nombres;
          }
          if (!nombres.apellidoMaterno && nc.apellidoMaterno) {
            nombres.apellidoMaterno = nc.apellidoMaterno;
          }
        }

        // 3. Show payment status
        setPaymentStatus(pagoResult);
        setShowPaymentModal(true);

        // 4. Register attendance WITH real names
        const regResult = await registrar({
          numeroDni: dni,
          apellidoPaterno: nombres.apellidoPaterno,
          apellidoMaterno: nombres.apellidoMaterno || null,
          nombres: nombres.nombres,
          tipoDni: "electronico",
          tipo: tipoRegistro,
          sesion: activeModuleId,
          dia: selectedDia,
        });

        if (regResult.success) {
          const nombreCompleto = `${nombres.apellidoPaterno} ${nombres.apellidoMaterno || ""} ${nombres.nombres}`.trim();
          toast.success(`${tipoLabel} - ${nombreCompleto} (Dia ${selectedDia})`, { duration: 2000 });
          setSuccessName(`${tipoLabel} - ${nombreCompleto}`);
          setShowSuccessModal(true);
          setLastManualResult({ nombre: `${nombreCompleto} - ${tipoLabel}`, success: true });
          setTimeout(() => setShowSuccessModal(false), 1500);
          debouncedRefresh();
        } else if (regResult.duplicado) {
          toast.warning(regResult.error, { duration: 2000 });
          setLastManualResult({ nombre: regResult.error || "Ya registrado", success: false });
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
    [consultarDni, registrar, debouncedRefresh, tipoRegistro, activeModuleId, selectedDia, verificarPago]
  );

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const ok = await eliminar(deleteTarget.id);
    if (ok) {
      toast.success("Registro eliminado");
      if (selectedDia !== null) {
        fetchAsistencias(1, undefined, selectedDia, activeModuleId, tipoRegistro);
      }
    } else {
      toast.error("Error al eliminar");
    }
    setDeleteTarget(null);
  };

  const activeModule = modules.find((m) => m.id === activeModuleId);
  const selectedFecha = selectedDia && fechas[selectedDia] ? formatFechaDia(fechas[selectedDia]) : null;

  if (selectedDia === null) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-xl font-bold text-primary tracking-tight">Registrar Asistencia</h1>
          <p className="text-sm text-muted mt-0.5">{usuario?.eventoNombre}</p>
        </div>

        <div className="bg-white rounded-xl border border-border shadow-sm p-8 text-center">
          <Calendar className="w-12 h-12 text-accent mx-auto mb-4" />
          <h2 className="text-lg font-bold text-primary mb-2">Selecciona el dia del evento</h2>
          <p className="text-sm text-muted mb-6">Elige la fecha para registrar asistencia</p>
          <div className="flex flex-wrap justify-center gap-3">
            {availableDias.length === 0 && (
              <p className="text-sm text-muted">Cargando dias disponibles...</p>
            )}
            {availableDias.map((dia) => {
              const cfg = diasConfig.find((d) => d.dia === dia);
              const tipoLabel = cfg?.tipoAsistencia === "solo_entrada" ? "Solo Entrada"
                : cfg?.tipoAsistencia === "solo_salida" ? "Solo Salida"
                : "Entrada y Salida";
              return (
                <button
                  key={dia}
                  onClick={() => setSelectedDia(dia)}
                  className="flex flex-col items-center px-6 py-4 rounded-xl border-2 border-accent bg-accent/10 text-primary font-bold hover:bg-accent hover:text-primary-deep transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
                >
                  <span className="text-lg">Dia {dia}</span>
                  {cfg?.nombre && <span className="text-xs font-medium text-muted mt-0.5">{cfg.nombre}</span>}
                  {fechas[dia] && (
                    <span className="text-xs font-medium text-muted mt-0.5">{formatFechaDia(fechas[dia])}</span>
                  )}
                  <span className="text-[0.6rem] text-accent mt-1 bg-accent/20 px-2 py-0.5 rounded-full">{tipoLabel}</span>
                </button>
              );
            })}
            <button
              onClick={() => {
                setNewDiaNum(availableDias.length > 0 ? Math.max(...availableDias) + 1 : 1);
                setNewDiaNombre("");
                setNewDiaFecha("");
                setNewDiaTipo("entrada_salida");
                setShowDiaModal(true);
              }}
              className="flex flex-col items-center justify-center px-6 py-4 rounded-xl border-2 border-dashed border-border text-muted hover:border-accent hover:text-accent transition-all"
            >
              <Plus className="w-8 h-8 mb-1" />
              <span className="text-sm font-bold">Nuevo Dia</span>
            </button>
          </div>
        </div>

        {showDiaModal && (
          <DiaConfigModal
            diaNum={newDiaNum}
            nombre={newDiaNombre}
            fecha={newDiaFecha}
            tipo={newDiaTipo}
            onDiaNumChange={setNewDiaNum}
            onNombreChange={setNewDiaNombre}
            onFechaChange={setNewDiaFecha}
            onTipoChange={setNewDiaTipo}
            onConfirm={handleCreateDia}
            onCancel={() => setShowDiaModal(false)}
          />
        )}
      </div>
    );
  }

  const tipoAsistenciaLabel = tipoAsistenciaDia === "solo_entrada" ? "Solo Entrada"
    : tipoAsistenciaDia === "solo_salida" ? "Solo Salida"
    : "Entrada y Salida";

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-primary tracking-tight">Registrar Asistencia</h1>
          <p className="text-sm text-muted mt-0.5">{usuario?.eventoNombre}</p>
        </div>
        <div className="flex items-center gap-4 px-4 py-2.5 bg-white rounded-xl border border-border shadow-sm">
          <Users className="w-5 h-5 text-accent" />
          <div>
            <p className="text-2xl font-bold text-primary leading-none">{data?.total ?? 0}</p>
            <p className="text-[0.65rem] text-muted uppercase tracking-wider">{tipoRegistro === "entrada" ? "Entradas" : "Salidas"} ({activeModuleId}° Reg)</p>
          </div>
        </div>
      </div>

      {/* Day selector with dates */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted" />
          <span className="text-sm font-medium text-ink">Fecha:</span>
        </div>
        <div className="flex items-center gap-1 p-1 bg-white border border-border rounded-xl shadow-sm">
          {availableDias.map((dia) => (
            <button
              key={dia}
              onClick={() => setSelectedDia(dia)}
              className={`flex flex-col items-center px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${
                selectedDia === dia
                  ? "bg-primary text-accent shadow-sm"
                  : "text-muted hover:text-ink hover:bg-surface-alt"
              }`}
            >
              <span>Dia {dia}</span>
              {fechas[dia] && (
                <span className={`text-[0.6rem] font-medium mt-0.5 ${selectedDia === dia ? "text-accent/80" : "text-muted"}`}>
                  {formatFechaDia(fechas[dia])}
                </span>
              )}
            </button>
          ))}
          <button
            onClick={() => {
              setNewDiaNum(availableDias.length > 0 ? Math.max(...availableDias) + 1 : 1);
              setNewDiaNombre("");
              setNewDiaFecha("");
              setNewDiaTipo("entrada_salida");
              setShowDiaModal(true);
            }}
            className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-muted hover:text-accent transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
        <span className="text-xs text-muted bg-surface-alt px-2 py-1 rounded-lg">{tipoAsistenciaLabel}</span>
      </div>

      {/* Session modules selector */}
      <div className="mb-4">
        <div className="flex flex-wrap gap-2 items-center">
          {modules.map((mod) => (
            <button
              key={mod.id}
              onClick={() => {
                setActiveModuleId(mod.id);
                if (tipoAsistenciaDia === "solo_entrada") setTipoRegistro("entrada");
                else if (tipoAsistenciaDia === "solo_salida") setTipoRegistro("salida");
                else setTipoRegistro("entrada");
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-bold transition-all ${
                activeModuleId === mod.id
                  ? "bg-primary text-accent border-primary shadow-lg scale-105"
                  : "bg-white text-muted border-border hover:border-primary/50 hover:text-primary"
              }`}
            >
              <ClipboardList className="w-4 h-4" />
              {mod.label}
            </button>
          ))}
          {modules.length < 10 && (
            <button
              onClick={handleAddModule}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border-2 border-dashed border-border text-sm font-medium text-muted hover:border-accent hover:text-accent transition-all"
            >
              <Plus className="w-4 h-4" />
              Agregar
            </button>
          )}
        </div>
      </div>

      {/* Active module registration area */}
      <div className="bg-white rounded-xl border border-border shadow-sm p-4 mb-6">
        <div className="text-center mb-3">
          <h2 className="text-lg font-bold text-primary">{activeModule?.label}</h2>
          <p className="text-xs text-muted">
            Dia {selectedDia}{selectedFecha ? ` - ${selectedFecha}` : ""} | {tipoAsistenciaLabel}
          </p>
        </div>

        {/* Entrada / Salida toggle - only show both when tipo is entrada_salida */}
        {tipoAsistenciaDia === "entrada_salida" ? (
          <div className="flex items-center gap-2 p-1 bg-surface-alt rounded-lg mb-4">
            <button
              onClick={() => setTipoRegistro("entrada")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all ${
                tipoRegistro === "entrada"
                  ? "bg-green-600 text-white shadow-md"
                  : "text-muted hover:text-ink"
              }`}
            >
              <LogIn className="w-5 h-5" />
              ENTRADA
            </button>
            <button
              onClick={() => setTipoRegistro("salida")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all ${
                tipoRegistro === "salida"
                  ? "bg-orange-500 text-white shadow-md"
                  : "text-muted hover:text-ink"
              }`}
            >
              <LogOut className="w-5 h-5" />
              SALIDA
            </button>
          </div>
        ) : (
          <div className={`flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold mb-4 ${
            tipoAsistenciaDia === "solo_entrada"
              ? "bg-green-600 text-white"
              : "bg-orange-500 text-white"
          }`}>
            {tipoAsistenciaDia === "solo_entrada" ? <LogIn className="w-5 h-5" /> : <LogOut className="w-5 h-5" />}
            {tipoAsistenciaDia === "solo_entrada" ? "SOLO ENTRADA" : "SOLO SALIDA"}
          </div>
        )}

        {/* Mode tabs */}
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
        <div className={`px-4 py-3 text-white text-sm font-semibold uppercase tracking-wider flex items-center justify-between ${
          tipoRegistro === "entrada"
            ? "bg-gradient-to-r from-green-700 to-green-600"
            : "bg-gradient-to-r from-orange-600 to-orange-500"
        }`}>
          <span className="flex items-center gap-2">
            {tipoRegistro === "entrada" ? <LogIn className="w-4 h-4" /> : <LogOut className="w-4 h-4" />}
            <span>
              Dia {selectedDia}{selectedFecha ? ` (${selectedFecha})` : ""} - {activeModule?.label} - {tipoRegistro === "entrada" ? "Entradas" : "Salidas"}
            </span>
          </span>
          <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">{data?.total ?? 0}</span>
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

      {/* Success modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-accent/20 backdrop-blur-sm animate-in fade-in duration-300">
          <div className={`${tipoRegistro === "salida" ? "bg-orange-500/90" : "bg-primary/90"} p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-4 animate-in zoom-in-50 duration-300 border border-accent/30`}>
            <div className={`w-24 h-24 rounded-full ${tipoRegistro === "salida" ? "bg-white" : "bg-accent"} flex items-center justify-center animate-bounce shadow-[0_0_40px_rgba(0,230,118,0.6)]`}>
              {tipoRegistro === "salida"
                ? <LogOut className="text-orange-500 w-12 h-12" />
                : <span className="text-primary text-5xl font-black">&#10003;</span>
              }
            </div>
            <h2 className="text-4xl font-black text-white tracking-wider uppercase drop-shadow-md">
              {tipoRegistro === "salida" ? "Salida!" : "Entrada!"}
            </h2>
            {successName && (
              <p className="text-white text-xl font-medium mt-2">{successName}</p>
            )}
          </div>
        </div>
      )}

      {/* Payment status modal */}
      {showPaymentModal && paymentStatus && (
        <PaymentStatusModal
          status={paymentStatus}
          onClose={() => setShowPaymentModal(false)}
        />
      )}

      {/* Day creation modal */}
      {showDiaModal && (
        <DiaConfigModal
          diaNum={newDiaNum}
          nombre={newDiaNombre}
          fecha={newDiaFecha}
          tipo={newDiaTipo}
          onDiaNumChange={setNewDiaNum}
          onNombreChange={setNewDiaNombre}
          onFechaChange={setNewDiaFecha}
          onTipoChange={setNewDiaTipo}
          onConfirm={handleCreateDia}
          onCancel={() => setShowDiaModal(false)}
        />
      )}
    </div>
  );
}

function PaymentStatusModal({ status, onClose }: { status: PaymentStatus; onClose: () => void }) {
  const isPaid = status.estadoPago === "FINALIZADO";
  const isNotRegistered = !status.found;

  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div
        className={`relative w-[90vw] max-w-sm p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-4 animate-in zoom-in-75 duration-300 ${
          isPaid ? "bg-green-500" : isNotRegistered ? "bg-gray-500" : "bg-red-500"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-3 right-3 text-white/70 hover:text-white">
          <X className="w-6 h-6" />
        </button>

        <div className={`w-20 h-20 rounded-full bg-white/20 flex items-center justify-center`}>
          {isPaid ? (
            <CheckCircle2 className="w-12 h-12 text-white" />
          ) : (
            <AlertCircle className="w-12 h-12 text-white" />
          )}
        </div>

        <h2 className="text-2xl font-black text-white text-center uppercase tracking-wider">
          {isPaid ? "PAGO REALIZADO" : isNotRegistered ? "NO REGISTRADO" : "PENDIENTE DE PAGO"}
        </h2>

        {status.nombreCompleto && (
          <p className="text-white text-center text-sm font-medium">
            {status.nombreCompleto.nombres} {status.nombreCompleto.apellidoPaterno} {status.nombreCompleto.apellidoMaterno || ""}
          </p>
        )}

        <div className={`mt-2 px-4 py-2 rounded-full text-sm font-bold ${
          isPaid ? "bg-white/20 text-white" : "bg-white/20 text-white"
        }`}>
          {isPaid ? "Acceso autorizado" : isNotRegistered ? "No encontrado en la lista" : "Verificar con organizacion"}
        </div>
      </div>
    </div>
  );
}

function DiaConfigModal({
  diaNum, nombre, fecha, tipo,
  onDiaNumChange, onNombreChange, onFechaChange, onTipoChange,
  onConfirm, onCancel,
}: {
  diaNum: number;
  nombre: string;
  fecha: string;
  tipo: TipoAsistenciaDia;
  onDiaNumChange: (n: number) => void;
  onNombreChange: (s: string) => void;
  onFechaChange: (s: string) => void;
  onTipoChange: (t: TipoAsistenciaDia) => void;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-[90vw] max-w-md p-6 animate-in zoom-in-75 duration-300">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-primary flex items-center gap-2">
            <Settings className="w-5 h-5 text-accent" />
            Configurar Nuevo Dia
          </h2>
          <button onClick={onCancel} className="text-muted hover:text-ink">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink mb-1">Numero de Dia</label>
            <input
              type="number"
              min={1}
              value={diaNum}
              onChange={(e) => onDiaNumChange(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1">Nombre (opcional)</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => onNombreChange(e.target.value)}
              placeholder={`Dia ${diaNum}`}
              className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1">Fecha (opcional)</label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => onFechaChange(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-2">Tipo de Registro de Asistencia</label>
            <div className="space-y-2">
              {([
                { value: "entrada_salida", label: "Entrada y Salida", desc: "Registrar tanto entrada como salida", color: "border-blue-400 bg-blue-50" },
                { value: "solo_entrada", label: "Solo Entrada", desc: "Solo registrar entradas", color: "border-green-400 bg-green-50" },
                { value: "solo_salida", label: "Solo Salida", desc: "Solo registrar salidas", color: "border-orange-400 bg-orange-50" },
              ] as const).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => onTipoChange(opt.value)}
                  className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all ${
                    tipo === opt.value
                      ? `${opt.color} border-opacity-100 shadow-sm`
                      : "border-border bg-white hover:bg-surface-alt"
                  }`}
                >
                  <span className="text-sm font-bold text-primary">{opt.label}</span>
                  <span className="block text-xs text-muted mt-0.5">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium text-muted hover:bg-surface-alt transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl bg-primary text-accent text-sm font-bold hover:bg-primary/90 transition-all shadow-sm"
          >
            Crear Dia {diaNum}
          </button>
        </div>
      </div>
    </div>
  );
}
