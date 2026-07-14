"use client";

import { FileSpreadsheet, FileText, FileDown } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface ExportButtonsProps {
  eventoNombre: string;
  dia?: number;
}

export default function ExportButtons({ eventoNombre, dia }: ExportButtonsProps) {
  const buildParams = () => {
    const params = new URLSearchParams({ eventoNombre });
    if (dia) params.set("dia", String(dia));
    return params;
  };

  const downloadCSV = () => {
    const params = buildParams();
    window.open(`/api/asistencias/exportar/csv?${params}`, "_blank");
  };

  const downloadExcel = () => {
    const params = buildParams();
    window.open(`/api/asistencias/exportar/excel?${params}`, "_blank");
  };

  const downloadPDF = async () => {
    const params = buildParams();
    const res = await fetch(`/api/asistencias/exportar/pdf?${params}`);
    const data = await res.json();

    const doc = new jsPDF({ orientation: "landscape" });

    doc.setFontSize(11);
    doc.text("Universidad Catolica de Santa Maria", 14, 16);
    doc.setFontSize(14);
    doc.text(data.eventoNombre, 14, 24);
    doc.setFontSize(9);
    doc.text(`Fecha de generacion: ${data.fechaGeneracion}`, 14, 32);
    doc.text(`Total de asistentes: ${data.totalAsistentes}`, 14, 38);

    autoTable(doc, {
      startY: 44,
      head: [data.headers],
      body: data.rows,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: {
        fillColor: [24, 59, 42],
        textColor: [0, 230, 118],
        fontStyle: "bold",
      },
      alternateRowStyles: { fillColor: [242, 247, 244] },
    });

    const suffix = dia ? `_dia${dia}` : "";
    doc.save(`asistencia${suffix}.pdf`);
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={downloadCSV}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium
          bg-white border border-border hover:border-accent/40 hover:bg-accent/5
          transition-all"
        title="Exportar CSV"
      >
        <FileDown className="w-4 h-4 text-accent-dim" />
        <span className="hidden sm:inline">CSV</span>
      </button>

      <button
        onClick={downloadExcel}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium
          bg-white border border-border hover:border-accent/40 hover:bg-accent/5
          transition-all"
        title="Exportar Excel"
      >
        <FileSpreadsheet className="w-4 h-4 text-accent-dim" />
        <span className="hidden sm:inline">Excel</span>
      </button>

      <button
        onClick={downloadPDF}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium
          bg-white border border-border hover:border-accent/40 hover:bg-accent/5
          transition-all"
        title="Exportar PDF"
      >
        <FileText className="w-4 h-4 text-red-500" />
        <span className="hidden sm:inline">PDF</span>
      </button>
    </div>
  );
}
