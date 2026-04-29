"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { useI18n } from "@/lib/i18n";

type Props = {
  targetId: string;
  fileName?: string;
  variant?: "primary" | "icon";
  label?: string;
};

export function ReceiptDownloadButton({
  targetId,
  fileName = "receipt.pdf",
  variant = "primary",
  label,
}: Props) {
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);

  async function download() {
    const node = document.getElementById(targetId);
    if (!node) return;
    setBusy(true);
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);
      const canvas = await html2canvas(node, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "pt",
        format: "a4",
      });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 24;
      const usableWidth = pageWidth - margin * 2;
      const ratio = usableWidth / canvas.width;
      const imgHeight = canvas.height * ratio;

      if (imgHeight <= pageHeight - margin * 2) {
        pdf.addImage(imgData, "PNG", margin, margin, usableWidth, imgHeight);
      } else {
        // Multi-page: slice the canvas
        let y = 0;
        const pageCanvasHeight = (pageHeight - margin * 2) / ratio;
        while (y < canvas.height) {
          const sliceHeight = Math.min(pageCanvasHeight, canvas.height - y);
          const slice = document.createElement("canvas");
          slice.width = canvas.width;
          slice.height = sliceHeight;
          const ctx = slice.getContext("2d");
          if (!ctx) break;
          ctx.drawImage(
            canvas,
            0,
            y,
            canvas.width,
            sliceHeight,
            0,
            0,
            canvas.width,
            sliceHeight
          );
          const sliceData = slice.toDataURL("image/png");
          if (y > 0) pdf.addPage();
          pdf.addImage(
            sliceData,
            "PNG",
            margin,
            margin,
            usableWidth,
            sliceHeight * ratio
          );
          y += sliceHeight;
        }
      }
      pdf.save(fileName);
    } finally {
      setBusy(false);
    }
  }

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={download}
        disabled={busy}
        title={label || t.receipt.download}
        aria-label={label || t.receipt.download}
        className="text-slate-600 hover:text-brand-600 disabled:opacity-50"
      >
        <Download className="h-4 w-4 inline" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={download}
      disabled={busy}
      className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
    >
      <Download className="h-4 w-4" />
      {busy ? t.common.saving : label || t.receipt.download}
    </button>
  );
}
