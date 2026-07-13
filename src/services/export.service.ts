import { asistenciaRepository } from "@/repositories/asistencia.repository";
import { formatDatePeru, formatTimePeru, fullName } from "@/lib/utils";
import ExcelJS from "exceljs";

interface ExportRow {
  numero: number;
  dni: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  nombres: string;
  tipoDni: string;
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
    tipoDni: r.tipoDni === "azul" ? "DNI Azul" : "DNI Electronico",
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
  "Tipo DNI",
  "Fecha",
  "Hora",
];

export const exportService = {
  async generateCSV(eventoId: string): Promise<string> {
    const registros = await asistenciaRepository.findAllForExport(eventoId);
    const rows = buildRows(registros);

    // BOM para compatibilidad con Excel en espanol
    const BOM = "﻿";
    const header = HEADERS.join(";");
    const body = rows
      .map((r) =>
        [r.numero, r.dni, r.apellidoPaterno, r.apellidoMaterno, r.nombres, r.tipoDni, r.fecha, r.hora].join(";")
      )
      .join("\n");

    return `${BOM}${header}\n${body}`;
  },

  async generateExcel(eventoId: string, eventoNombre: string): Promise<Buffer> {
    const registros = await asistenciaRepository.findAllForExport(eventoId);
    const rows = buildRows(registros);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "AsistePro";
    workbook.created = new Date();

    const sheet = workbook.addWorksheet(eventoNombre.substring(0, 31));

    sheet.columns = [
      { header: "N", key: "numero", width: 6 },
      { header: "DNI", key: "dni", width: 12 },
      { header: "Apellido Paterno", key: "apellidoPaterno", width: 22 },
      { header: "Apellido Materno", key: "apellidoMaterno", width: 22 },
      { header: "Nombres", key: "nombres", width: 25 },
      { header: "Tipo DNI", key: "tipoDni", width: 16 },
      { header: "Fecha", key: "fecha", width: 12 },
      { header: "Hora", key: "hora", width: 10 },
    ];

    // Estilo de encabezados
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF1A2332" },
    };
    headerRow.alignment = { horizontal: "center", vertical: "middle" };
    headerRow.height = 24;

    rows.forEach((row) => sheet.addRow(row));

    // Bordes en todas las celdas con datos
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

  // Genera datos estructurados para que el cliente construya el PDF
  async getDataForPDF(eventoId: string, eventoNombre: string) {
    const registros = await asistenciaRepository.findAllForExport(eventoId);
    const rows = buildRows(registros);
    return {
      eventoNombre,
      fechaGeneracion: formatDatePeru(new Date()),
      totalAsistentes: rows.length,
      headers: HEADERS,
      rows: rows.map((r) => [
        r.numero,
        r.dni,
        r.apellidoPaterno,
        r.apellidoMaterno,
        r.nombres,
        r.tipoDni,
        r.fecha,
        r.hora,
      ]),
    };
  },
};
