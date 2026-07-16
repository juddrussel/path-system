import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
// Imported from the /dist build so bundlers (Vite, CRA, etc.) don't try to
// pull in ExcelJS's Node-only code paths (fs, Buffer polyfills) meant for
// server-side use — this build is the browser-safe one.
import ExcelJS from "exceljs/dist/exceljs.min.js";

/* ══════════════════════════════════════════════════════════════════════════
   reportExport.js — shared PDF / Excel export engine for the Reports page.

   Every report (Overview, Delayed Transactions, Processing Time, Faculty
   Workload, Returned/Rejected transaction detail, Quick Reports, Audit
   Trail...) is exported through the same two entry points:

     exportReportToPDF(payload)
     exportReportToExcel(payload)

   where `payload` is a plain object shaped like:

     {
       title:    "Delayed Transactions Report",
       subtitle: "Transactions past SLA thresholds",   // optional
       meta:     ["Date range: Last 30 Days", ...],     // optional, shown as a small line under the subtitle
       kpis:     [{ label: "Total Delayed", value: 12 }, ...], // optional
       tables:   [
         { title: "Delayed Transactions", columns: [...], rows: [[...], ...] },
       ],
     }

   Keeping one payload shape means every report — no matter how different
   its underlying data — gets the same branded PATH header, KPI strip,
   and table styling for free.
   ══════════════════════════════════════════════════════════════════════ */

const BRAND = { r: 124, g: 58, b: 237 }; // #7c3aed
const BRAND_HEX = "#7c3aed";

function slugify(s) {
  return (
    String(s)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "report"
  );
}

// The PATH logo is loaded once and cached as a data URL so every PDF export
// can stamp it in the header without re-fetching it each time. If it can't
// be loaded (missing asset, offline, etc.) exports still work — the header
// just falls back to a plain wordmark.
let _logoPromise = null;
function getLogoDataUrl() {
  if (_logoPromise) return _logoPromise;
  _logoPromise = fetch("/images/path.png")
    .then(res => (res.ok ? res.blob() : Promise.reject(new Error("logo not found"))))
    .then(
      blob =>
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        })
    )
    .catch(() => null);
  return _logoPromise;
}

/* ── PDF export ─────────────────────────────────────────────────────── */

export async function exportReportToPDF({ title, subtitle, meta = [], kpis = [], tables = [] }) {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  const headerH = 64;

  const logo = await getLogoDataUrl();

  const drawHeader = () => {
    doc.setFillColor(BRAND.r, BRAND.g, BRAND.b);
    doc.rect(0, 0, pageWidth, headerH, "F");

    let textX = margin;
    if (logo) {
      try {
        doc.addImage(logo, "PNG", margin, 12, 40, 40);
        textX = margin + 52;
      } catch {
        /* fall back to text-only wordmark */
      }
    }
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.text("PATH", textX, 30);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.text("Reports", textX, 44);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(title, pageWidth - margin, 28, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(`Generated ${new Date().toLocaleString()}`, pageWidth - margin, 42, { align: "right" });
  };

  drawHeader();
  doc.setTextColor(30, 30, 30);
  let y = headerH + 26;

  if (subtitle) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    doc.setTextColor(75, 75, 85);
    doc.text(subtitle, margin, y);
    y += 16;
  }

  if (meta.length) {
    doc.setFontSize(8.5);
    doc.setTextColor(120, 120, 130);
    doc.text(meta.join("    •    "), margin, y, { maxWidth: pageWidth - margin * 2 });
    y += 20;
  }

  if (kpis.length) {
    const gap = 10;
    const cardW = (pageWidth - margin * 2 - gap * (kpis.length - 1)) / kpis.length;
    const cardH = 46;
    kpis.forEach((k, i) => {
      const x = margin + i * (cardW + gap);
      doc.setDrawColor(228, 228, 236);
      doc.setFillColor(248, 247, 253);
      doc.roundedRect(x, y, cardW, cardH, 5, 5, "FD");
      doc.setTextColor(20, 20, 25);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13.5);
      doc.text(String(k.value), x + 10, y + 22);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.8);
      doc.setTextColor(120, 120, 130);
      doc.text(String(k.label), x + 10, y + 35, { maxWidth: cardW - 18 });
    });
    y += cardH + 22;
  }

  tables.forEach((t, idx) => {
    if (y > pageHeight - 120) {
      doc.addPage();
      drawHeader();
      y = headerH + 26;
    }
    if (t.title) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.5);
      doc.setTextColor(30, 30, 30);
      doc.text(t.title, margin, y);
      y += 8;
    }
    autoTable(doc, {
      startY: y + 6,
      head: [t.columns],
      body: t.rows.length ? t.rows : [t.columns.map(() => "—")],
      margin: { left: margin, right: margin, bottom: 40 },
      styles: { fontSize: 8, cellPadding: 5, textColor: [40, 40, 40] },
      headStyles: { fillColor: [BRAND.r, BRAND.g, BRAND.b], textColor: 255, fontStyle: "bold", fontSize: 8.2 },
      alternateRowStyles: { fillColor: [248, 247, 253] },
      theme: "grid",
      didDrawPage: () => {
        // subsequent auto-paginated pages within a long table still need the header
        if (doc.internal.getCurrentPageInfo().pageNumber > 1) drawHeader();
      },
    });
    y = doc.lastAutoTable.finalY + 24;
    if (idx < tables.length - 1 && y > pageHeight - 100) {
      doc.addPage();
      drawHeader();
      y = headerH + 26;
    }
  });

  const pageCount = doc.internal.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(150, 150, 155);
    doc.text(`PATH  •  Confidential Report  •  Page ${p} of ${pageCount}`, pageWidth / 2, pageHeight - 16, { align: "center" });
  }

  doc.save(`${slugify(title)}.pdf`);
}

/* ── Excel export ───────────────────────────────────────────────────── */

const BRAND_ARGB = "FF7C3AED";        // #7c3aed header / banner fill
const BRAND_TINT_ARGB = "FFF3F0FD";   // light purple — alternating rows
const HEADER_TINT_ARGB = "FFEDE9FE";  // pale purple — column header row
const WHITE_ARGB = "FFFFFFFF";
const BORDER_ARGB = "FFE4E4EC";
const INK_ARGB = "FF111827";
const MUTED_ARGB = "FF6B7280";
const HEADER_TEXT_ARGB = "FF3F2E77";

const THIN_BORDER = { style: "thin", color: { argb: BORDER_ARGB } };
const ALL_BORDERS = { top: THIN_BORDER, left: THIN_BORDER, bottom: THIN_BORDER, right: THIN_BORDER };

function safeSheetName(name, fallback) {
  // Excel sheet names: no \ / * ? : [ ], max 31 chars, can't be blank.
  const cleaned = String(name || fallback).replace(/[\\/*?:[\]]/g, "").slice(0, 31);
  return cleaned || fallback;
}

function triggerBlobDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function exportReportToExcel({ title, subtitle, meta = [], kpis = [], tables = [] }) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "PATH";
  wb.created = new Date();

  /* ── Summary sheet: title banner, generated/filters line, KPI table ── */
  const summary = wb.addWorksheet("Summary", { views: [{ showGridLines: false }] });
  summary.columns = [{ width: 36 }, { width: 22 }];

  summary.mergeCells("A1:B1");
  const banner = summary.getCell("A1");
  banner.value = `PATH — ${title}`;
  banner.font = { bold: true, size: 14, color: { argb: WHITE_ARGB } };
  banner.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND_ARGB } };
  banner.alignment = { vertical: "middle", indent: 1 };
  summary.getRow(1).height = 30;

  let r = 2;
  summary.getCell(`A${r}`).value = `Generated ${new Date().toLocaleString()}`;
  summary.getCell(`A${r}`).font = { italic: true, size: 9, color: { argb: MUTED_ARGB } };
  r++;

  if (subtitle) {
    summary.getCell(`A${r}`).value = subtitle;
    summary.getCell(`A${r}`).font = { size: 10.5, color: { argb: "FF374151" } };
    r++;
  }

  meta.forEach(m => {
    summary.getCell(`A${r}`).value = m;
    summary.getCell(`A${r}`).font = { size: 9, color: { argb: MUTED_ARGB } };
    r++;
  });

  if (kpis.length) {
    r++; // spacer row
    const headerRow = summary.getRow(r);
    ["Metric", "Value"].forEach((label, i) => {
      const cell = headerRow.getCell(i + 1);
      cell.value = label;
      cell.font = { bold: true, size: 10, color: { argb: WHITE_ARGB } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND_ARGB } };
      cell.border = ALL_BORDERS;
      cell.alignment = { vertical: "middle" };
    });
    headerRow.height = 20;
    r++;

    kpis.forEach((k, i) => {
      const row = summary.getRow(r);
      const labelCell = row.getCell(1);
      const valueCell = row.getCell(2);
      labelCell.value = k.label;
      valueCell.value = k.value;
      [labelCell, valueCell].forEach(cell => {
        cell.border = ALL_BORDERS;
        if (i % 2 === 1) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND_TINT_ARGB } };
      });
      labelCell.font = { size: 10, color: { argb: INK_ARGB } };
      valueCell.font = { size: 10, bold: true, color: { argb: INK_ARGB } };
      valueCell.alignment = { horizontal: "right" };
      r++;
    });
  }

  /* ── One styled sheet per data table ── */
  tables.forEach((t, idx) => {
    const sheetName = safeSheetName(t.title, `Data ${idx + 1}`);
    const ws = wb.addWorksheet(sheetName, {
      views: [{ state: "frozen", ySplit: 2, showGridLines: false }],
    });

    const colCount = t.columns.length;
    const rows = t.rows.length ? t.rows : [t.columns.map(() => "—")];

    // Title banner spanning every column
    ws.mergeCells(1, 1, 1, colCount);
    const bannerCell = ws.getCell(1, 1);
    bannerCell.value = t.title || sheetName;
    bannerCell.font = { bold: true, size: 12, color: { argb: WHITE_ARGB } };
    bannerCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND_ARGB } };
    bannerCell.alignment = { vertical: "middle", indent: 1 };
    ws.getRow(1).height = 24;

    // Column header row
    const headerRow = ws.getRow(2);
    t.columns.forEach((colName, i) => {
      const cell = headerRow.getCell(i + 1);
      cell.value = colName;
      cell.font = { bold: true, size: 9.5, color: { argb: HEADER_TEXT_ARGB } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: HEADER_TINT_ARGB } };
      cell.border = ALL_BORDERS;
      cell.alignment = { vertical: "middle", horizontal: "left" };
    });
    headerRow.height = 20;

    // Data rows, alternately shaded, numbers right-aligned
    rows.forEach((rowData, ri) => {
      const row = ws.getRow(ri + 3);
      rowData.forEach((val, ci) => {
        const cell = row.getCell(ci + 1);
        cell.value = val;
        cell.border = ALL_BORDERS;
        cell.font = { size: 9.5, color: { argb: "FF1F2937" } };
        if (ri % 2 === 1) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND_TINT_ARGB } };
        if (typeof val === "number") cell.alignment = { horizontal: "right" };
      });
    });

    // Auto-filter dropdown on the header row
    ws.autoFilter = { from: { row: 2, column: 1 }, to: { row: 2, column: colCount } };

    // Column widths sized to content, capped so nothing runs away
    t.columns.forEach((colName, i) => {
      const maxLen = Math.max(String(colName).length, ...rows.map(row => String(row[i] ?? "").length));
      ws.getColumn(i + 1).width = Math.min(48, Math.max(12, maxLen + 3));
    });
  });

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  triggerBlobDownload(blob, `${slugify(title)}.xlsx`);
}