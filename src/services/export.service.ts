import { asistenciaRepository } from "@/repositories/asistencia.repository";
import { formatDatePeru, formatTimePeru } from "@/lib/utils";
import ExcelJS from "exceljs";

interface ExportRow {
  numero: number;
  dni: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  nombres: string;
  dia: number;
  fecha: string;
  hora: string;
}

function buildRows(
  registros: Awaited<ReturnType<typeof asistenciaRepository.findAllForExport>>
): ExportRow[] {
  return registros.map((r, i) => ({
    numero: i + 1,
    dni: r.numeroDni,
    apellidoPaterno: r.apellidoPaterno,
    apellidoMaterno: r.apellidoMaterno || "",
    nombres: r.nombres,
    dia: r.dia,
    fecha: formatDatePeru(r.fechaRegistro),
    hora: formatTimePeru(r.fechaRegistro),
  }));
}

const HEADERS = [
  "N",
  "DNI",
  "Apellido Paterno",
  "Apellido Materno",
  "Nombres",
  "Dia",
  "Fecha",
  "Hora",
];

export const exportService = {
  async generateCSV(eventoId: string, dia?: number): Promise<string> {
    const registros = await asistenciaRepository.findAllForExport(eventoId, dia);
    const rows = buildRows(registros);

    const BOM = "﻿";
    const header = HEADERS.join(";");
    const body = rows
      .map((r) =>
        [r.numero, r.dni, r.apellidoPaterno, r.apellidoMaterno, r.nombres, r.dia, r.fecha, r.hora].join(";")
      )
      .join("\n");

    return `${BOM}${header}\n${body}`;
  },

  async generateExcel(eventoId: string, eventoNombre: string, dia?: number): Promise<Buffer> {
    const registros = await asistenciaRepository.findAllForExport(eventoId, dia);
    const rows = buildRows(registros);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "AsistePro";
    workbook.created = new Date();

    const sheetName = dia
      ? `${eventoNombre.substring(0, 25)} Dia ${dia}`
      : eventoNombre.substring(0, 31);
    const sheet = workbook.addWorksheet(sheetName);

    sheet.columns = [
      { header: "N", key: "numero", width: 6 },
      { header: "DNI", key: "dni", width: 12 },
      { header: "Apellido Paterno", key: "apellidoPaterno", width: 22 },
      { header: "Apellido Materno", key: "apellidoMaterno", width: 22 },
      { header: "Nombres", key: "nombres", width: 25 },
      { header: "Dia", key: "dia", width: 6 },
      { header: "Fecha", key: "fecha", width: 12 },
      { header: "Hora", key: "hora", width: 10 },
    ];

    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF183B2A" },
    };
    headerRow.alignment = { horizontal: "center", vertical: "middle" };
    headerRow.height = 24;

    rows.forEach((row) => sheet.addRow(row));

    sheet.eachRow((row) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  },

  async getDataForPDF(eventoId: string, eventoNombre: string, dia?: number) {
    const registros = await asistenciaRepository.findAllForExport(eventoId, dia);
    const rows = buildRows(registros);
    return {
      eventoNombre: dia ? `${eventoNombre} - Dia ${dia}` : eventoNombre,
      fechaGeneracion: formatDatePeru(new Date()),
      totalAsistentes: rows.length,
      headers: HEADERS,
      rows: rows.map((r) => [
        r.numero,
        r.dni,
        r.apellidoPaterno,
        r.apellidoMaterno,
        r.nombres,
        r.dia,
        r.fecha,
        r.hora,
      ]),
    };
  },
};
