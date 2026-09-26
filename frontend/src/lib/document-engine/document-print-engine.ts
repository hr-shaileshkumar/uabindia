// ─── Universal Enterprise Document Print Engine ──────────────────────────────

function escapeHtml(value: string | number | null | undefined): string {
  if (value == null) return "";
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export interface PrintDocumentOptions {
  title?: string;
  documentNumber?: string;
  date?: string;
  watermarkText?: string;
  companyName?: string;
  companyAddress?: string;
  companyGstin?: string;
  companyPan?: string;
  partyName?: string;
  partyAddress?: string;
  partyGstin?: string;
  lineItems?: Array<{
    description: string;
    hsnCode?: string;
    quantity: number;
    unitPrice: number;
    taxRate?: number;
    lineTotal: number;
  }>;
  summaryFields?: Record<string, any>;
  subTotal?: number;
  taxAmount?: number;
  grandTotal?: number;
  currency?: string;
  notes?: string;
  includeSignatureBlock?: boolean;
}

export function printRecordDocument(options: PrintDocumentOptions): void {
  const companyName = options.companyName || "UAB INDIA ENTERPRISES PRIVATE LIMITED";
  const companyAddress =
    options.companyAddress ||
    "Plot 42, Tech Horizon Park, Electronic City, Bengaluru, Karnataka - 560100";
  const companyGstin = options.companyGstin || "29AABCU9603R1ZM";
  const title = options.title || "Official Document";
  const docNum = options.documentNumber || `DOC-${Date.now()}`;
  const date = options.date || new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  const watermark = options.watermarkText || "";

  const popup = window.open("", "_blank", "noopener,noreferrer,width=920,height=1050");
  if (!popup) return;

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(title)} - ${escapeHtml(docNum)}</title>
  <style>
    @page { size: A4 portrait; margin: 12mm; }
    * { box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #0f172a; margin: 0; padding: 16px; font-size: 11px; background: #fff; line-height: 1.4; }
    .doc-container { max-width: 820px; margin: 0 auto; border: 1px solid #cbd5e1; padding: 20px; position: relative; border-radius: 4px; }
    ${
      watermark
        ? `.watermark { position: absolute; top: 40%; left: 12%; transform: rotate(-35deg); font-size: 68px; font-weight: 800; color: rgba(148, 163, 184, 0.12); pointer-events: none; text-transform: uppercase; z-index: 0; letter-spacing: 4px; }`
        : ""
    }
    .header { display: flex; justify-content: space-between; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 14px; position: relative; z-index: 1; }
    .doc-badge { display: inline-block; background: #0f172a; color: #fff; font-weight: 700; font-size: 12px; padding: 3px 10px; border-radius: 4px; text-transform: uppercase; margin-bottom: 4px; }
    .grid-2 { display: flex; gap: 12px; margin-bottom: 14px; position: relative; z-index: 1; }
    .card { flex: 1; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px 10px; font-size: 10.5px; background: #f8fafc; }
    table.data-table { width: 100%; border-collapse: collapse; margin-bottom: 14px; position: relative; z-index: 1; }
    table.data-table th { background: #0f172a; color: #fff; font-size: 10px; font-weight: 600; padding: 6px 8px; border: 1px solid #0f172a; text-transform: uppercase; }
    table.data-table td { padding: 6px 8px; border: 1px solid #cbd5e1; font-size: 10.5px; }
    .totals { display: flex; justify-content: flex-end; margin-bottom: 16px; position: relative; z-index: 1; }
    .totals-box { width: 260px; border: 1px solid #cbd5e1; border-radius: 6px; overflow: hidden; }
    .totals-row { display: flex; justify-content: space-between; padding: 5px 8px; border-bottom: 1px solid #e2e8f0; font-size: 11px; }
    .totals-row.grand { background: #0f172a; color: #fff; font-weight: 700; font-size: 12px; border-bottom: none; }
    .signature-block { display: flex; justify-content: space-between; margin-top: 28px; padding-top: 14px; border-top: 1px solid #cbd5e1; position: relative; z-index: 1; }
    @media print {
      body { padding: 0; background: none; }
      .doc-container { border: none; padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="doc-container">
    ${watermark ? `<div class="watermark">${escapeHtml(watermark)}</div>` : ""}

    <!-- Top Corporate Header -->
    <div class="header">
      <div>
        <div style="font-size: 18px; font-weight: 800; color: #0f172a;">${escapeHtml(companyName)}</div>
        <div style="color: #64748b; font-size: 10px; margin-top: 2px;">${escapeHtml(companyAddress)}</div>
        <div style="color: #475569; font-size: 10px; font-weight: 600;">GSTIN: ${escapeHtml(companyGstin)}</div>
      </div>
      <div style="text-align: right;">
        <div class="doc-badge">${escapeHtml(title)}</div>
        <div style="font-size: 12px; font-weight: 700; color: #0f172a;">#${escapeHtml(docNum)}</div>
        <div style="color: #64748b; font-size: 10px;">Date: ${escapeHtml(date)}</div>
      </div>
    </div>

    <!-- Party Details if provided -->
    ${
      options.partyName
        ? `<div class="grid-2">
      <div class="card">
        <div style="font-weight: 700; color: #475569; margin-bottom: 2px; text-transform: uppercase; font-size: 9.5px;">Issued / Billed To:</div>
        <div style="font-weight: 700; font-size: 11px;">${escapeHtml(options.partyName)}</div>
        ${options.partyAddress ? `<div style="color: #64748b;">${escapeHtml(options.partyAddress)}</div>` : ""}
        ${options.partyGstin ? `<div style="color: #475569; font-weight: 600;">GSTIN: ${escapeHtml(options.partyGstin)}</div>` : ""}
      </div>
    </div>`
        : ""
    }

    <!-- Summary Fields Grid -->
    ${
      options.summaryFields && Object.keys(options.summaryFields).length > 0
        ? `<div class="grid-2" style="flex-wrap: wrap;">
      ${Object.entries(options.summaryFields)
        .map(
          ([k, v]) => `  <div class="card" style="min-width: 170px;">
        <div style="font-size: 9.5px; color: #64748b; text-transform: uppercase;">${escapeHtml(k)}</div>
        <div style="font-size: 11px; font-weight: 600; color: #0f172a;">${escapeHtml(v)}</div>
      </div>`
        )
        .join("")}
    </div>`
        : ""
    }

    <!-- Line Items Table -->
    ${
      options.lineItems && options.lineItems.length > 0
        ? `<table class="data-table">
      <thead>
        <tr>
          <th style="width: 35px; text-align: center;">#</th>
          <th>Description</th>
          <th style="width: 70px; text-align: center;">HSN/SAC</th>
          <th style="width: 50px; text-align: right;">Qty</th>
          <th style="width: 80px; text-align: right;">Rate</th>
          <th style="width: 60px; text-align: right;">Tax %</th>
          <th style="width: 90px; text-align: right;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${options.lineItems
          .map(
            (item, idx) => `<tr>
          <td style="text-align: center;">${idx + 1}</td>
          <td style="font-weight: 600;">${escapeHtml(item.description)}</td>
          <td style="text-align: center; font-family: monospace;">${escapeHtml(item.hsnCode || "-")}</td>
          <td style="text-align: right;">${item.quantity}</td>
          <td style="text-align: right;">₹${item.unitPrice.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
          <td style="text-align: right;">${item.taxRate || 0}%</td>
          <td style="text-align: right; font-weight: 700;">₹${item.lineTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
        </tr>`
          )
          .join("")}
      </tbody>
    </table>

    <div class="totals">
      <div class="totals-box">
        <div class="totals-row"><span>Subtotal:</span><span>₹${(options.subTotal || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span></div>
        <div class="totals-row"><span>Total Tax:</span><span>₹${(options.taxAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span></div>
        <div class="totals-row grand"><span>Grand Total:</span><span>₹${(options.grandTotal || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span></div>
      </div>
    </div>`
        : ""
    }

    <!-- Notes & Conditions -->
    ${
      options.notes
        ? `<div style="margin-top: 8px; font-size: 10px; color: #64748b;">
      <strong>Terms & Conditions:</strong> ${escapeHtml(options.notes)}
    </div>`
        : ""
    }

    <!-- Authorized Signatures -->
    ${
      options.includeSignatureBlock !== false
        ? `<div class="signature-block">
      <div>
        <div style="height: 35px;"></div>
        <div style="border-top: 1px dashed #94a3b8; width: 160px; padding-top: 4px; color: #64748b; font-size: 10px;">Recipient Signature</div>
      </div>
      <div style="text-align: right;">
        <div style="font-size: 10px; font-weight: 600; color: #475569;">For ${escapeHtml(companyName)}</div>
        <div style="height: 25px;"></div>
        <div style="border-top: 1px dashed #94a3b8; width: 160px; margin-left: auto; padding-top: 4px; color: #64748b; font-size: 10px;">Authorized Signatory</div>
      </div>
    </div>`
        : ""
    }
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 250);
    };
  </script>
</body>
</html>`;

  popup.document.write(html);
  popup.document.close();
}

export interface PrintReportOptions {
  title?: string;
  reportNumber?: string;
  date?: string;
  columns: Array<{ key: string; label: string }>;
  rows: Array<Record<string, any>>;
  companyName?: string;
  companyAddress?: string;
  companyGstin?: string;
  filterSummary?: string;
}

export function printTabularReport(options: PrintReportOptions): void {
  const companyName = options.companyName || "UAB INDIA ENTERPRISES PRIVATE LIMITED";
  const companyAddress =
    options.companyAddress ||
    "Plot 42, Tech Horizon Park, Electronic City, Bengaluru, Karnataka - 560100";
  const companyGstin = options.companyGstin || "29AABCU9603R1ZM";
  const title = options.title || "Data Report";
  const reportNum = options.reportNumber || `REP-${Date.now()}`;
  const date = options.date || new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

  const popup = window.open("", "_blank", "noopener,noreferrer,width=1100,height=850");
  if (!popup) return;

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(title)} - ${escapeHtml(reportNum)}</title>
  <style>
    @page { size: A4 landscape; margin: 10mm; }
    * { box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #0f172a; margin: 0; padding: 14px; font-size: 10.5px; background: #fff; line-height: 1.35; }
    .report-container { width: 100%; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; border-bottom: 2px solid #0f172a; padding-bottom: 8px; margin-bottom: 12px; }
    .doc-badge { display: inline-block; background: #0f172a; color: #fff; font-weight: 700; font-size: 11px; padding: 2px 8px; border-radius: 4px; text-transform: uppercase; margin-bottom: 4px; }
    .filter-bar { background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 4px; padding: 4px 8px; margin-bottom: 10px; font-size: 10px; color: #475569; }
    table.data-table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
    table.data-table th { background: #0f172a; color: #fff; font-size: 9.5px; font-weight: 600; padding: 5px 6px; border: 1px solid #0f172a; text-transform: uppercase; text-align: left; }
    table.data-table td { padding: 5px 6px; border: 1px solid #cbd5e1; font-size: 10px; }
    table.data-table tbody tr:nth-child(even) { background: #f8fafc; }
    .footer { display: flex; justify-content: space-between; font-size: 9.5px; color: #64748b; border-top: 1px solid #cbd5e1; padding-top: 8px; margin-top: 10px; }
    @media print {
      body { padding: 0; background: none; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="report-container">
    <div class="header">
      <div>
        <div style="font-size: 16px; font-weight: 800; color: #0f172a;">${escapeHtml(companyName)}</div>
        <div style="color: #64748b; font-size: 9.5px;">${escapeHtml(companyAddress)} &middot; GSTIN: ${escapeHtml(companyGstin)}</div>
      </div>
      <div style="text-align: right;">
        <div class="doc-badge">${escapeHtml(title)}</div>
        <div style="font-size: 11px; font-weight: 700; color: #0f172a;">#${escapeHtml(reportNum)}</div>
        <div style="color: #64748b; font-size: 9.5px;">Generated: ${escapeHtml(date)}</div>
      </div>
    </div>

    ${
      options.filterSummary
        ? `<div class="filter-bar"><strong>Active Filter Criteria:</strong> ${escapeHtml(options.filterSummary)}</div>`
        : ""
    }

    <table class="data-table">
      <thead>
        <tr>
          <th style="width: 30px; text-align: center;">#</th>
          ${options.columns.map((col) => `<th>${escapeHtml(col.label)}</th>`).join("")}
        </tr>
      </thead>
      <tbody>
        ${options.rows.length === 0 ? `<tr><td colspan="${options.columns.length + 1}" style="text-align: center; color: #94a3b8; padding: 20px;">No records match the current view criteria.</td></tr>` : ""}
        ${options.rows
          .map(
            (row, idx) => `<tr>
          <td style="text-align: center; color: #64748b; font-size: 9px;">${idx + 1}</td>
          ${options.columns
            .map((col) => {
              const val = row[col.key];
              return `<td>${escapeHtml(val != null ? String(val) : "-")}</td>`;
            })
            .join("")}
        </tr>`
          )
          .join("")}
      </tbody>
    </table>

    <div class="footer">
      <div>Total Records: <strong>${options.rows.length}</strong></div>
      <div>Confidential &middot; Internal ERP Report &middot; Generated by UAB India Platform</div>
    </div>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 250);
    };
  </script>
</body>
</html>`;

  popup.document.write(html);
  popup.document.close();
}

