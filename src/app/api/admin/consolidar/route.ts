// ponytail: endpoint temporal de una sola corrida; borrar tras ejecutarlo
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { apiGuard, isGuardError } from "@/lib/api-guard";
import participantesData from "../../../../../prisma/participantes.json";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type P = { apellidoPaterno: string; apellidoMaterno: string | null; nombres: string; tipoParticipante: string; estadoPago: string };

const norm = (s: string | null | undefined) =>
  (s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase().replace(/\s+/g, " ").trim();

// Mismo orden de matching que /api/participantes/buscar
function buscarPago(lista: P[], apPat: string, apMat: string | null, nombres: string): string {
  const pat = norm(apPat), mat = norm(apMat), nom1 = norm(nombres).split(" ")[0];
  const porPat = lista.filter((p) => norm(p.apellidoPaterno) === pat);
  const hit =
    porPat.find((p) => (!mat || norm(p.apellidoMaterno) === mat) && (!nom1 || norm(p.nombres).includes(nom1))) ??
    (nom1 ? porPat.find((p) => norm(p.nombres).includes(nom1)) : undefined) ??
    porPat.find((p) => !mat || norm(p.apellidoMaterno) === mat);
  return hit?.estadoPago ?? "NO REGISTRADO";
}

const DIAS = [
  { dia: 1, fecha: "2026-10-06" },
  { dia: 2, fecha: "2026-10-07" },
];
// Escaneo accidental en un 3er registro inexistente del 7 oct; su entrada real ya esta en el 2do
const ESCANEO_ERRONEO = "72393619";

export async function POST(req: NextRequest) {
  const guard = await apiGuard(req);
  if (isGuardError(guard)) return guard;
  const eventoId = guard.session.eventoId;
  const dryRun = new URL(req.url).searchParams.get("dryRun") === "1";
  const lista = participantesData as P[];

  try {
    const resumen = await prisma.$transaction(async (tx) => {
      // 1. Lista de pagos
      await tx.participante.deleteMany({ where: { eventoId } });
      await tx.participante.createMany({ data: lista.map((p) => ({ ...p, eventoId })) });

      // 2. Dia segun fecha real de registro (hora Lima): 6 oct -> Dia 1, 7 oct -> Dia 2
      const fechaLima = Prisma.sql`((fecha_registro AT TIME ZONE 'UTC') AT TIME ZONE 'America/Lima')::date`;
      const nuevoDia = Prisma.sql`CASE ${fechaLima} WHEN '2026-10-06'::date THEN 1 WHEN '2026-10-07'::date THEN 2 END`;
      const erroneo = await tx.$executeRaw`
        DELETE FROM asistencias WHERE evento_id = ${eventoId} AND numero_dni = ${ESCANEO_ERRONEO}
          AND dia = 3 AND sesion = 3 AND ${fechaLima} = '2026-10-07'::date`;
      // Duplicados: misma persona, dia, toma y tipo -> se queda el primer registro
      const duplicados = await tx.$executeRaw`
        DELETE FROM asistencias WHERE id IN (
          SELECT id FROM (
            SELECT id, ROW_NUMBER() OVER (
              PARTITION BY numero_dni, ${nuevoDia}, sesion, tipo ORDER BY eliminado ASC, fecha_registro ASC
            ) AS rn FROM asistencias WHERE evento_id = ${eventoId} AND ${nuevoDia} IS NOT NULL
          ) t WHERE rn > 1
        )`;
      // +1000 temporal para no chocar con el unique durante el renumerado
      await tx.$executeRaw`UPDATE asistencias SET dia = ${nuevoDia} + 1000 WHERE evento_id = ${eventoId} AND ${nuevoDia} IS NOT NULL`;
      await tx.$executeRaw`UPDATE asistencias SET dia = dia - 1000 WHERE evento_id = ${eventoId} AND dia > 1000`;

      await tx.diaEvento.deleteMany({ where: { eventoId } });
      await tx.diaEvento.createMany({
        data: DIAS.map((d) => ({ dia: d.dia, nombre: `Dia ${d.dia}`, fecha: new Date(d.fecha), tipoAsistencia: "entrada_salida", eventoId })),
      });
      await tx.evento.update({
        where: { id: eventoId },
        data: { fechaInicio: new Date(DIAS[0].fecha), fechaFin: new Date(DIAS[DIAS.length - 1].fecha) },
      });

      // 3. Recalcular estado de pago de cada asistencia
      const personas = await tx.asistencia.findMany({
        where: { eventoId },
        select: { numeroDni: true, apellidoPaterno: true, apellidoMaterno: true, nombres: true },
        distinct: ["numeroDni"],
      });
      const porEstado = new Map<string, string[]>();
      for (const p of personas) {
        const estado = buscarPago(lista, p.apellidoPaterno, p.apellidoMaterno, p.nombres);
        porEstado.set(estado, [...(porEstado.get(estado) ?? []), p.numeroDni]);
      }
      for (const [estadoPago, dnis] of porEstado) {
        await tx.asistencia.updateMany({ where: { eventoId, numeroDni: { in: dnis } }, data: { estadoPago } });
      }

      const conteo = await tx.asistencia.groupBy({
        by: ["dia", "sesion", "tipo"],
        where: { eventoId, eliminado: false },
        _count: { id: true },
        orderBy: [{ dia: "asc" }, { sesion: "asc" }, { tipo: "asc" }],
      });
      const r = {
        participantes: lista.length,
        escaneoErroneo: erroneo,
        duplicadosEliminados: duplicados,
        personasPorEstado: Object.fromEntries([...porEstado].map(([k, v]) => [k, v.length])),
        conteo: conteo.map((c) => `D${c.dia} S${c.sesion} ${c.tipo}: ${c._count.id}`),
      };
      if (dryRun) throw Object.assign(new Error("DRY_RUN"), { resumen: r });
      return r;
    }, { timeout: 50_000 });
    return NextResponse.json({ ok: true, ...resumen });
  } catch (e) {
    const err = e as Error & { resumen?: unknown };
    if (err.message === "DRY_RUN") return NextResponse.json({ dryRun: true, ...(err.resumen as object) });
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
