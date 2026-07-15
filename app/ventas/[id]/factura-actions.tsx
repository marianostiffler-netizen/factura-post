"use client";

import { useState } from "react";
import { Download, Printer } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

/**
 * Acciones de la factura: descargar como PDF (rasteriza el mismo nodo del
 * documento, así el diseño queda idéntico) o imprimir vía el navegador.
 */
export function FacturaActions({ filename }: { filename: string }) {
  const [loading, setLoading] = useState(false);

  async function downloadPdf() {
    const el = document.getElementById("factura-doc");
    if (!el) {
      toast.error("No se encontró el documento");
      return;
    }
    setLoading(true);
    try {
      const [{ default: html2canvas }, jspdf] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);
      const JsPDF = jspdf.jsPDF;

      const canvas = await html2canvas(el, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
      });
      const imgData = canvas.toDataURL("image/png");

      const pdf = new JsPDF({ unit: "pt", format: "a4" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 24;
      const usableWidth = pageWidth - margin * 2;
      const imgHeight = (canvas.height * usableWidth) / canvas.width;
      const usableHeight = pageHeight - margin * 2;

      let heightLeft = imgHeight;
      let position = margin;
      pdf.addImage(imgData, "PNG", margin, position, usableWidth, imgHeight);
      heightLeft -= usableHeight;

      // Si el documento es más alto que una página, paginar.
      while (heightLeft > 0) {
        pdf.addPage();
        position = margin - (imgHeight - heightLeft);
        pdf.addImage(imgData, "PNG", margin, position, usableWidth, imgHeight);
        heightLeft -= usableHeight;
      }

      pdf.save(`${filename}.pdf`);
    } catch (e) {
      console.error(e);
      toast.error("No se pudo generar el PDF");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button onClick={downloadPdf} disabled={loading}>
        <Download className="size-4" />
        {loading ? "Generando…" : "Descargar PDF"}
      </Button>
      <Button onClick={() => window.print()} variant="outline">
        <Printer className="size-4" /> Imprimir
      </Button>
    </>
  );
}
