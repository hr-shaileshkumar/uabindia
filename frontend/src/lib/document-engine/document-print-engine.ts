// ─── Universal Enterprise Document Print Engine ──────────────────────────────
import { getRowFieldValue } from "@/lib/workspace/list-view";

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
  logoUrl?: string;
  brandColor?: string;
  accentColor?: string;
  headerLayout?: "modern-split" | "centered-banner" | "classic-left" | "minimal-ribbon" | string;
  signatoryName?: string;
  signatoryDesignation?: string;
  stampUrl?: string;
  projectName?: string;
  projectSiteAddress?: string;
  projectClientLogoUrl?: string;
  projectSignatoryName?: string;
  projectSignatoryTitle?: string;
  partyLabel?: string;
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
  const companyName = options.companyName || "Enterprise Organization";
  const companyAddress = options.companyAddress || "";
  const companyGstin = options.companyGstin || "";
  const logoUrl = options.logoUrl || "";
  const siteAddress = options.projectSiteAddress || "";
  const clientLogoUrl = options.projectClientLogoUrl || "";
  const brandColor = options.brandColor && /^#[0-9a-fA-F]{3,8}$/.test(options.brandColor) ? options.brandColor : "#0f172a";
  const accentColor = options.accentColor && /^#[0-9a-fA-F]{3,8}$/.test(options.accentColor) ? options.accentColor : "#2563eb";
  const headerLayout = options.headerLayout || "modern-split";
  const title = options.title || "Official Document";
  const docNum = options.documentNumber || `DOC-${Date.now()}`;
  const date = options.date || new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  const watermark = options.watermarkText || "";
  const partyLabel = options.partyLabel || (options.lineItems && options.lineItems.length > 0 ? "Issued / Billed To:" : "Record Details:");
  const signatoryName = options.projectSignatoryName || options.signatoryName || "Authorized Signatory";
  const signatoryTitle = options.projectSignatoryTitle || options.signatoryDesignation || "Head of People & Operations";
  const stampUrl = options.stampUrl || "";

  const popup = window.open("", "_blank", "width=920,height=1050,resizable=yes,scrollbars=yes");
  if (!popup) return;

  const renderHeader = () => {
    if (headerLayout === "centered-banner") {
      return `
        <div style="text-align: center; margin-bottom: 12px; position: relative; z-index: 1;">
          <div style="display: flex; justify-content: center; align-items: center; gap: 14px; margin-bottom: 6px;">
            ${logoUrl ? `<img src="${escapeHtml(logoUrl)}" alt="Logo" style="max-height: 52px; max-width: 160px; object-fit: contain;" />` : ""}
            ${clientLogoUrl ? `<img src="${escapeHtml(clientLogoUrl)}" alt="Client Logo" style="max-height: 44px; max-width: 140px; object-fit: contain; border-left: 1px solid #cbd5e1; padding-left: 12px;" />` : ""}
          </div>
          <div style="font-size: 20px; font-weight: 800; color: var(--brand-primary); letter-spacing: -0.02em;">${escapeHtml(companyName)}</div>
          ${siteAddress ? `<div style="color: #0f172a; font-weight: 600; font-size: 10px; margin-top: 2px;">Site Office: ${escapeHtml(siteAddress)}</div>` : ""}
          ${companyAddress ? `<div style="color: #64748b; font-size: 10px; margin-top: 2px;">${siteAddress ? "Regd Office: " : ""}${escapeHtml(companyAddress)}</div>` : ""}
          ${companyGstin ? `<div style="color: #475569; font-size: 10px; font-weight: 600; margin-top: 1px;">GSTIN: ${escapeHtml(companyGstin)}</div>` : ""}
          <div style="height: 3px; background: linear-gradient(90deg, var(--brand-primary), var(--brand-accent), var(--brand-primary)); margin: 10px auto; width: 100%; border-radius: 2px;"></div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 6px;">
            <div style="color: #64748b; font-size: 10px;">Date: <strong>${escapeHtml(date)}</strong></div>
            <div class="doc-badge">${escapeHtml(title)}</div>
            <div style="font-size: 11.5px; font-weight: 700; color: var(--brand-primary);">#${escapeHtml(docNum)}</div>
          </div>
        </div>
      `;
    }

    if (headerLayout === "classic-left") {
      return `
        <div style="border-top: 3px solid var(--brand-primary); border-bottom: 1px solid var(--brand-accent); padding: 10px 0; margin-bottom: 14px; display: flex; justify-content: space-between; position: relative; z-index: 1;">
          <div>
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 4px;">
              ${logoUrl ? `<img src="${escapeHtml(logoUrl)}" alt="Logo" style="max-height: 42px; max-width: 120px; object-fit: contain;" />` : ""}
              ${clientLogoUrl ? `<img src="${escapeHtml(clientLogoUrl)}" alt="Client Logo" style="max-height: 38px; max-width: 110px; object-fit: contain; border-left: 1px solid #cbd5e1; padding-left: 10px;" />` : ""}
            </div>
            <div style="font-size: 18px; font-weight: 800; color: var(--brand-primary);">${escapeHtml(companyName)}</div>
            ${siteAddress ? `<div style="color: #0f172a; font-weight: 600; font-size: 10px; margin-top: 2px;">Site Office: ${escapeHtml(siteAddress)}</div>` : ""}
            ${companyAddress ? `<div style="color: #64748b; font-size: 10px; margin-top: 2px;">${siteAddress ? "Regd Office: " : ""}${escapeHtml(companyAddress)}</div>` : ""}
            ${companyGstin ? `<div style="color: #475569; font-size: 10px; font-weight: 600;">GSTIN: ${escapeHtml(companyGstin)}</div>` : ""}
          </div>
          <div style="text-align: right;">
            <div class="doc-badge">${escapeHtml(title)}</div>
            <div style="font-size: 12px; font-weight: 700; color: var(--brand-primary);">#${escapeHtml(docNum)}</div>
            <div style="color: #64748b; font-size: 10px; margin-top: 2px;">Date: ${escapeHtml(date)}</div>
          </div>
        </div>
      `;
    }

    if (headerLayout === "minimal-ribbon") {
      return `
        <div style="border-top: 4px solid var(--brand-primary); padding-top: 8px; margin-bottom: 14px; position: relative; z-index: 1;">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">
            <div style="display: flex; align-items: center; gap: 10px;">
              ${logoUrl ? `<img src="${escapeHtml(logoUrl)}" alt="Logo" style="max-height: 36px; max-width: 100px; object-fit: contain;" />` : ""}
              ${clientLogoUrl ? `<img src="${escapeHtml(clientLogoUrl)}" alt="Client Logo" style="max-height: 32px; max-width: 90px; object-fit: contain; border-left: 1px solid #cbd5e1; padding-left: 8px;" />` : ""}
              <div>
                <div style="font-size: 16px; font-weight: 800; color: var(--brand-primary);">${escapeHtml(companyName)}</div>
                ${companyGstin ? `<span style="color: #64748b; font-size: 9.5px;">GSTIN: ${escapeHtml(companyGstin)}</span>` : ""}
              </div>
            </div>
            <div style="text-align: right;">
              <div class="doc-badge">${escapeHtml(title)}</div>
              <div style="font-size: 11px; font-weight: 700; color: var(--brand-primary);">#${escapeHtml(docNum)} | ${escapeHtml(date)}</div>
            </div>
          </div>
          ${siteAddress ? `<div style="color: #0f172a; font-weight: 600; font-size: 9.5px; padding-top: 4px;">Site Office: ${escapeHtml(siteAddress)}</div>` : ""}
          ${companyAddress ? `<div style="color: #64748b; font-size: 9.5px; padding-top: 2px;">${siteAddress ? "Regd Office: " : ""}${escapeHtml(companyAddress)}</div>` : ""}
        </div>
      `;
    }

    // Default "modern-split"
    return `
      <div class="header">
        <div style="display: flex; align-items: center; gap: 14px;">
          ${logoUrl ? `<img src="${escapeHtml(logoUrl)}" alt="Logo" style="max-height: 48px; max-width: 130px; object-fit: contain;" />` : ""}
          ${clientLogoUrl ? `<img src="${escapeHtml(clientLogoUrl)}" alt="Client Logo" style="max-height: 42px; max-width: 110px; object-fit: contain; border-left: 1px solid #cbd5e1; padding-left: 12px;" />` : ""}
          <div>
            <div style="font-size: 18px; font-weight: 800; color: var(--brand-primary);">${escapeHtml(companyName)}</div>
            ${siteAddress ? `<div style="color: #0f172a; font-weight: 600; font-size: 10px; margin-top: 2px;">Site Office: ${escapeHtml(siteAddress)}</div>` : ""}
            ${companyAddress ? `<div style="color: #64748b; font-size: 10px; margin-top: 2px;">${siteAddress ? "Regd Office: " : ""}${escapeHtml(companyAddress)}</div>` : ""}
            ${companyGstin ? `<div style="color: #475569; font-size: 10px; font-weight: 600;">GSTIN: ${escapeHtml(companyGstin)}</div>` : ""}
          </div>
        </div>
        <div style="text-align: right;">
          <div class="doc-badge">${escapeHtml(title)}</div>
          <div style="font-size: 12px; font-weight: 700; color: var(--brand-primary);">#${escapeHtml(docNum)}</div>
          <div style="color: #64748b; font-size: 10px;">Date: ${escapeHtml(date)}</div>
        </div>
      </div>
    `;
  };

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(title)} - ${escapeHtml(docNum)}</title>
  <style>
    @page { size: A4 portrait; margin: 12mm; }
    * { box-sizing: border-box; }
    :root {
      --brand-primary: ${escapeHtml(brandColor)};
      --brand-accent: ${escapeHtml(accentColor)};
    }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #0f172a; margin: 0; padding: 16px; font-size: 11px; background: #fff; line-height: 1.4; }
    .doc-container { max-width: 820px; margin: 0 auto; border: 1px solid #cbd5e1; padding: 20px; position: relative; border-radius: 4px; }
    ${
      watermark
        ? `.watermark { position: absolute; top: 40%; left: 12%; transform: rotate(-35deg); font-size: 68px; font-weight: 800; color: rgba(148, 163, 184, 0.12); pointer-events: none; text-transform: uppercase; z-index: 0; letter-spacing: 4px; }`
        : ""
    }
    .header { display: flex; justify-content: space-between; border-bottom: 2px solid var(--brand-primary); padding-bottom: 12px; margin-bottom: 14px; position: relative; z-index: 1; }
    .doc-badge { display: inline-block; background: var(--brand-primary); color: #fff; font-weight: 700; font-size: 12px; padding: 3px 10px; border-radius: 4px; text-transform: uppercase; margin-bottom: 4px; }
    .grid-2 { display: flex; gap: 12px; margin-bottom: 14px; position: relative; z-index: 1; }
    .card { flex: 1; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px 10px; font-size: 10.5px; background: #f8fafc; }
    table.data-table { width: 100%; border-collapse: collapse; margin-bottom: 14px; position: relative; z-index: 1; }
    table.data-table th { background: var(--brand-primary); color: #fff; font-size: 10px; font-weight: 600; padding: 6px 8px; border: 1px solid var(--brand-primary); text-transform: uppercase; }
    table.data-table td { padding: 6px 8px; border: 1px solid #cbd5e1; font-size: 10.5px; }
    .totals { display: flex; justify-content: flex-end; margin-bottom: 16px; position: relative; z-index: 1; }
    .totals-box { width: 260px; border: 1px solid #cbd5e1; border-radius: 6px; overflow: hidden; }
    .totals-row { display: flex; justify-content: space-between; padding: 5px 8px; border-bottom: 1px solid #e2e8f0; font-size: 11px; }
    .totals-row.grand { background: var(--brand-primary); color: #fff; font-weight: 700; font-size: 12px; border-bottom: none; }
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

    <!-- Top Corporate Header / Letterhead -->
    ${renderHeader()}

    <!-- Party Details if provided -->
    ${
      options.partyName
        ? `<div class="grid-2">
      <div class="card">
        <div style="font-weight: 700; color: #475569; margin-bottom: 2px; text-transform: uppercase; font-size: 9.5px;">${escapeHtml(partyLabel)}</div>
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
        <div style="font-size: 11px; font-weight: 600; color: var(--brand-primary);">${escapeHtml(v)}</div>
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
      options.includeSignatureBlock === true
        ? `<div class="signature-block">
      <div>
        <div style="height: 35px;"></div>
        <div style="border-top: 1px dashed #94a3b8; width: 160px; padding-top: 4px; color: #64748b; font-size: 10px;">Recipient Signature</div>
      </div>
      <div style="text-align: right;">
        <div style="font-size: 10px; font-weight: 600; color: #475569;">For ${escapeHtml(companyName)}</div>
        <div style="min-height: 32px; display: flex; align-items: flex-end; justify-content: flex-end;">
          ${stampUrl ? `<img src="${escapeHtml(stampUrl)}" alt="Stamp" style="max-height: 44px; max-width: 90px; object-fit: contain; margin-bottom: -10px;" />` : ""}
        </div>
        <div style="border-top: 1px dashed #94a3b8; width: 170px; margin-left: auto; padding-top: 4px; color: #64748b; font-size: 10px;">
          <strong style="color: #0f172a; display: block;">${escapeHtml(signatoryName)}</strong>
          <span>${escapeHtml(signatoryTitle)}</span>
        </div>
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

  if (typeof popup.document.open === "function") {
    popup.document.open();
  }
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
  logoUrl?: string;
  brandColor?: string;
  accentColor?: string;
  filterSummary?: string;
}

export function printTabularReport(options: PrintReportOptions): void {
  const companyName = options.companyName || "Enterprise Organization";
  const companyAddress = options.companyAddress || "";
  const companyGstin = options.companyGstin || "";
  const logoUrl = options.logoUrl || "";
  const brandColor = options.brandColor && /^#[0-9a-fA-F]{3,8}$/.test(options.brandColor) ? options.brandColor : "#0f172a";
  const accentColor = options.accentColor && /^#[0-9a-fA-F]{3,8}$/.test(options.accentColor) ? options.accentColor : "#2563eb";
  const title = options.title || "Data Report";
  const reportNum = options.reportNumber || `REP-${Date.now()}`;
  const date = options.date || new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

  const popup = window.open("", "_blank", "width=1100,height=850,resizable=yes,scrollbars=yes");
  if (!popup) return;

  const headerMeta = [
    companyAddress ? escapeHtml(companyAddress) : "",
    companyGstin ? `GSTIN: ${escapeHtml(companyGstin)}` : "",
  ].filter(Boolean).join(" &middot; ");

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(title)} - ${escapeHtml(reportNum)}</title>
  <style>
    @page { size: A4 landscape; margin: 10mm; }
    * { box-sizing: border-box; }
    :root {
      --brand-primary: ${escapeHtml(brandColor)};
      --brand-accent: ${escapeHtml(accentColor)};
    }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #0f172a; margin: 0; padding: 14px; font-size: 10.5px; background: #fff; line-height: 1.35; }
    .report-container { width: 100%; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; border-bottom: 2px solid var(--brand-primary); padding-bottom: 8px; margin-bottom: 12px; }
    .doc-badge { display: inline-block; background: var(--brand-primary); color: #fff; font-weight: 700; font-size: 11px; padding: 2px 8px; border-radius: 4px; text-transform: uppercase; margin-bottom: 4px; }
    .filter-bar { background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 4px; padding: 4px 8px; margin-bottom: 10px; font-size: 10px; color: #475569; }
    table.data-table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
    table.data-table th { background: var(--brand-primary); color: #fff; font-size: 9.5px; font-weight: 600; padding: 5px 6px; border: 1px solid var(--brand-primary); text-transform: uppercase; text-align: left; }
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
      <div style="display: flex; align-items: center; gap: 12px;">
        ${logoUrl ? `<img src="${escapeHtml(logoUrl)}" alt="Logo" style="max-height: 38px; max-width: 110px; object-fit: contain;" />` : ""}
        <div>
          <div style="font-size: 16px; font-weight: 800; color: var(--brand-primary);">${escapeHtml(companyName)}</div>
          ${headerMeta ? `<div style="color: #64748b; font-size: 9.5px;">${headerMeta}</div>` : ""}
        </div>
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
              const val = getRowFieldValue(row, col.key);
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
      <div>Confidential &middot; Internal ERP Report &middot; ${escapeHtml(companyName)}</div>
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

  if (typeof popup.document.open === "function") {
    popup.document.open();
  }
  popup.document.write(html);
  popup.document.close();
}

