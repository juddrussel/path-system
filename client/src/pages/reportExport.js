import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

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

export function exportReportToExcel({ title, subtitle, meta = [], kpis = [], tables = [] }) {
  const wb = XLSX.utils.book_new();

  const summaryRows = [
    ["PATH — " + title],
    [`Generated ${new Date().toLocaleString()}`],
  ];
  if (subtitle) summaryRows.push([subtitle]);
  if (meta.length) summaryRows.push([meta.join(" | ")]);
  if (kpis.length) {
    summaryRows.push([]);
    summaryRows.push(["Metric", "Value"]);
    kpis.forEach(k => summaryRows.push([k.label, k.value]));
  }
  const summaryWs = XLSX.utils.aoa_to_sheet(summaryRows);
  summaryWs["!cols"] = [{ wch: 42 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, summaryWs, "Summary");

  tables.forEach((t, idx) => {
    const rows = t.rows.length ? t.rows : [t.columns.map(() => "—")];
    const aoa = [t.columns, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws["!cols"] = t.columns.map((c, i) => ({
      wch: Math.min(60, Math.max(String(c ?? "").length + 2, ...rows.map(r => String(r[i] ?? "").length + 2), 10)),
    }));
    const sheetName = (t.title || `Data ${idx + 1}`).slice(0, 31);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  });

  XLSX.writeFile(wb, `${slugify(title)}.xlsx`);
}