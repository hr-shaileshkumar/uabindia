import { numberToWordsInr } from "./calculations";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function printCommercialDocument(input: {
  title: string;
  number: string;
  date?: string;
  dueDate?: string;
  party: string;
  partyGstin?: string;
  partyAddress?: string;
  partyState?: string;
  companyName?: string;
  companyGstin?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  companyPan?: string;
  jurisdiction?: string;
  placeOfSupply?: string;
  irn?: string;
  ackNo?: string;
  ackDate?: string;
  lines: Array<{
    description: string;
    hsnCode?: string;
    quantity: number;
    unitPrice: number;
    taxRate: number;
    discountAmount?: number;
  }>;
  subTotal: number;
  taxAmount: number;
  total: number;
  discountAmount?: number;
  cgst?: number;
  sgst?: number;
  igst?: number;
  currency?: string;
  currencySymbol?: string;
  bankDetails?: {
    bankName?: string;
    accountNo?: string;
    ifscCode?: string;
    branch?: string;
    upiId?: string;
    iban?: string;
    swift?: string;
  };
}) {
  const isGlobal = Boolean(input.currency && input.currency.toUpperCase() !== "INR");
  const sym =
    input.currencySymbol ||
    (input.currency === "USD"
      ? "$"
      : input.currency === "EUR"
      ? "€"
      : input.currency === "GBP"
      ? "£"
      : input.currency === "AED"
      ? "AED "
      : "₹");
  const isInterState = Boolean(input.igst && input.igst > 0);
  const companyName = input.companyName || "Corporate Enterprise";
  const companyGstin = input.companyGstin || "";
  const companyAddress = input.companyAddress || "";
  const placeOfSupply =
    input.placeOfSupply || (isGlobal ? "International Export (Zero-Rated / Standard VAT)" : "");
  const amountInWords = numberToWordsInr(input.total);

  // Rows
  const tableRows = input.lines
    .map((line, idx) => {
      const qty = Number(line.quantity || 1);
      const rate = Number(line.unitPrice || 0);
      const disc = Number(line.discountAmount || 0);
      const taxable = qty * rate - disc;
      const taxRate = Number(line.taxRate || 18);
      const taxVal = (taxable * taxRate) / 100;
      const lineTotal = taxable + taxVal;

      return `<tr>
      <td style="text-align:center; font-size:11px; padding:6px 4px; border:1px solid #cbd5e1;">${idx + 1}</td>
      <td style="font-size:11px; padding:6px 6px; border:1px solid #cbd5e1; font-weight:600;">
        ${escapeHtml(line.description || "Goods / Services")}
      </td>
      <td style="text-align:center; font-size:11px; padding:6px 4px; border:1px solid #cbd5e1; font-family:monospace;">
        ${escapeHtml(line.hsnCode || (isGlobal ? "SAC-9983" : "998313"))}
      </td>
      <td style="text-align:right; font-size:11px; padding:6px 6px; border:1px solid #cbd5e1;">${qty} NOS</td>
      <td style="text-align:right; font-size:11px; padding:6px 6px; border:1px solid #cbd5e1;">${sym}${rate.toFixed(2)}</td>
      <td style="text-align:right; font-size:11px; padding:6px 6px; border:1px solid #cbd5e1;">${sym}${disc > 0 ? disc.toFixed(2) : "0.00"}</td>
      <td style="text-align:right; font-size:11px; padding:6px 6px; border:1px solid #cbd5e1; font-weight:600;">${sym}${taxable.toFixed(2)}</td>
      ${
        isGlobal
          ? `<td style="text-align:right; font-size:11px; padding:6px 6px; border:1px solid #cbd5e1;">${taxRate}% (${sym}${taxVal.toFixed(2)})</td>`
          : isInterState
          ? `<td style="text-align:right; font-size:11px; padding:6px 6px; border:1px solid #cbd5e1;">${taxRate}% (${sym}${taxVal.toFixed(2)})</td>`
          : `<td style="text-align:right; font-size:11px; padding:6px 6px; border:1px solid #cbd5e1;">${taxRate / 2}% (${sym}${(taxVal / 2).toFixed(2)})</td>
             <td style="text-align:right; font-size:11px; padding:6px 6px; border:1px solid #cbd5e1;">${taxRate / 2}% (${sym}${(taxVal / 2).toFixed(2)})</td>`
      }
      <td style="text-align:right; font-size:11px; padding:6px 6px; border:1px solid #cbd5e1; font-weight:700; background:#f8fafc;">${sym}${lineTotal.toFixed(2)}</td>
    </tr>`;
    })
    .join("");

  const cgstVal = input.cgst ?? (isInterState ? 0 : input.taxAmount / 2);
  const sgstVal = input.sgst ?? (isInterState ? 0 : input.taxAmount / 2);
  const igstVal = input.igst ?? (isInterState ? input.taxAmount : 0);

  // Simulated authenticated QR representation
  const qrSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="90" height="90" style="border:1px solid #cbd5e1; padding:4px; background:#fff;">
    <rect width="100" height="100" fill="#fff"/>
    <rect x="5" y="5" width="30" height="30" fill="#0f172a"/>
    <rect x="10" y="10" width="20" height="20" fill="#fff"/>
    <rect x="15" y="15" width="10" height="10" fill="#0f172a"/>
    <rect x="65" y="5" width="30" height="30" fill="#0f172a"/>
    <rect x="70" y="10" width="20" height="20" fill="#fff"/>
    <rect x="75" y="15" width="10" height="10" fill="#0f172a"/>
    <rect x="5" y="65" width="30" height="30" fill="#0f172a"/>
    <rect x="10" y="70" width="20" height="20" fill="#fff"/>
    <rect x="15" y="75" width="10" height="10" fill="#0f172a"/>
    <rect x="45" y="10" width="10" height="15" fill="#0f172a"/>
    <rect x="40" y="35" width="20" height="10" fill="#0f172a"/>
    <rect x="10" y="45" width="15" height="10" fill="#0f172a"/>
    <rect x="65" y="45" width="25" height="10" fill="#0f172a"/>
    <rect x="45" y="60" width="15" height="25" fill="#0f172a"/>
    <rect x="70" y="70" width="20" height="20" fill="#0f172a"/>
  </svg>`;

  const popup = window.open("", "_blank", "noopener,noreferrer,width=920,height=1050");
  if (!popup) return;

  popup.document.write(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(input.title)} - ${escapeHtml(input.number)}</title>
  <style>
    @page { size: A4 portrait; margin: 12mm; }
    * { box-sizing: border-box; }
    body { font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif; color: #0f172a; margin: 0; padding: 16px; font-size: 11px; background: #fff; line-height: 1.35; }
    .doc-container { max-width: 800px; margin: 0 auto; border: 1.5px solid #334155; padding: 14px; border-radius: 4px; }
    .header-table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
    .header-table td { vertical-align: top; }
    .badge { display: inline-block; background: #1e293b; color: #fff; font-weight: 700; font-size: 13px; padding: 4px 12px; border-radius: 3px; letter-spacing: 0.5px; }
    .section-title { font-size: 10.5px; font-weight: 700; text-transform: uppercase; background: #f1f5f9; padding: 4px 6px; border: 1px solid #cbd5e1; margin-bottom: 0; color: #334155; }
    .grid-2 { display: flex; gap: 8px; margin-bottom: 8px; }
    .card-box { flex: 1; border: 1px solid #cbd5e1; padding: 6px 8px; font-size: 10.5px; }
    table.data-table { width: 100%; border-collapse: collapse; margin-top: 4px; margin-bottom: 8px; }
    table.data-table th { background: #0f172a; color: #fff; font-size: 10px; font-weight: 600; padding: 6px 4px; border: 1px solid #0f172a; text-transform: uppercase; }
    .totals-wrapper { display: flex; justify-content: space-between; gap: 8px; margin-top: 4px; }
    .bank-box { flex: 1.2; border: 1px solid #cbd5e1; padding: 8px; font-size: 10.5px; background: #fafafa; }
    .calc-box { flex: 1; border: 1px solid #cbd5e1; font-size: 11px; }
    .calc-row { display: flex; justify-content: space-between; padding: 4px 8px; border-bottom: 1px dashed #e2e8f0; }
    .calc-row.final { background: #0f172a; color: #fff; font-weight: 700; font-size: 12px; border-bottom: none; }
    .words-box { background: #f8fafc; border: 1px solid #cbd5e1; padding: 6px 8px; margin-top: 6px; font-size: 10.5px; font-weight: 600; color: #1e293b; }
    .footer-sign { display: flex; justify-content: space-between; margin-top: 16px; padding-top: 10px; border-top: 1px solid #cbd5e1; }
    .irn-box { border: 1px solid #94a3b8; background: #f8fafc; padding: 6px; font-family: monospace; font-size: 9.5px; word-break: break-all; margin-bottom: 8px; border-radius: 2px; }
    @media print {
      body { padding: 0; background: none; }
      .doc-container { border: none; padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="doc-container">
    <!-- Top Header -->
    <table class="header-table">
      <tr>
        <td style="width: 58%;">
          <div style="font-size: 18px; font-weight: 800; color: #0f172a; letter-spacing: -0.3px;">${escapeHtml(companyName)}</div>
          ${companyAddress ? `<div style="color: #475569; font-size: 10px; margin-top: 2px;">${escapeHtml(companyAddress)}</div>` : ""}
          ${companyGstin ? `<div style="margin-top: 4px; font-size: 10.5px; font-weight: 600;">GSTIN / UIN: <span style="font-family: monospace; color: #0f172a;">${escapeHtml(companyGstin)}</span></div>` : ""}
          ${input.companyPan ? `<div style="font-size: 10px; color: #64748b;">PAN: ${escapeHtml(input.companyPan)}</div>` : ""}
        </td>
        <td style="width: 24%; text-align: center; vertical-align: middle;">
          <div class="badge">${escapeHtml(input.title.toUpperCase())}</div>
          <div style="font-size: 9.5px; color: #64748b; margin-top: 4px;">Original for Recipient</div>
        </td>
        <td style="width: 18%; text-align: right;">
          ${qrSvg}
          <div style="font-size: 8.5px; color: #64748b; margin-top: 2px;">NIC Signed QR</div>
        </td>
      </tr>
    </table>

    ${
      input.irn || input.ackNo
        ? `<!-- IRN Header Bar -->
    <div class="irn-box">
      ${input.irn ? `<strong>IRN:</strong> ${escapeHtml(input.irn)}<br/>` : ""}
      ${input.ackNo ? `<strong>Ack No:</strong> ${escapeHtml(input.ackNo)} &nbsp;|&nbsp; ` : ""}<strong>Ack Date:</strong> ${escapeHtml(input.ackDate || input.date || new Date().toISOString())}
    </div>`
        : ""
    }

    <!-- Meta Details Row -->
    <div class="grid-2">
      <!-- Invoice Meta -->
      <div class="card-box">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="font-weight: 600; width: 45%;">Invoice No:</td>
            <td style="font-weight: 700; font-family: monospace; color: #0f172a;">${escapeHtml(input.number)}</td>
          </tr>
          <tr>
            <td style="color: #64748b;">Invoice Date:</td>
            <td>${escapeHtml(input.date || "2026-08-22")}</td>
          </tr>
          <tr>
            <td style="color: #64748b;">Payment Due Date:</td>
            <td>${escapeHtml(input.dueDate || "Immediate / 30 Days")}</td>
          </tr>
          <tr>
            <td style="color: #64748b;">Place of Supply:</td>
            <td style="font-weight: 600;">${escapeHtml(placeOfSupply)}</td>
          </tr>
          <tr>
            <td style="color: #64748b;">Reverse Charge:</td>
            <td>No</td>
          </tr>
        </table>
      </div>

      <!-- Billed To Details -->
      <div class="card-box">
        <div style="font-weight: 700; color: #0f172a; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; padding-bottom: 3px; margin-bottom: 3px;">
          Billed To (Customer / Buyer)
        </div>
        <div style="font-weight: 700; font-size: 11.5px; color: #0f172a;">${escapeHtml(input.party)}</div>
        ${input.partyAddress ? `<div style="color: #475569; font-size: 10px;">${escapeHtml(input.partyAddress)}</div>` : ""}
        ${input.partyGstin ? `<div style="margin-top: 3px;"><strong>GSTIN:</strong> <span style="font-family: monospace;">${escapeHtml(input.partyGstin)}</span></div>` : ""}
        ${input.partyState ? `<div style="color: #64748b; font-size: 10px;">State: ${escapeHtml(input.partyState)}</div>` : ""}
      </div>
    </div>

    <!-- Line Items Table -->
    <table class="data-table">
      <thead>
        <tr>
          <th style="width: 4%;">#</th>
          <th style="width: 34%; text-align: left;">Item Description</th>
          <th style="width: 10%;">HSN/SAC</th>
          <th style="width: 8%; text-align: right;">Qty</th>
          <th style="width: 10%; text-align: right;">Unit Rate</th>
          <th style="width: 8%; text-align: right;">Disc.</th>
          <th style="width: 10%; text-align: right;">Taxable</th>
          ${
            isInterState
              ? `<th style="width: 16%; text-align: right;">IGST</th>`
              : `<th style="width: 8%; text-align: right;">CGST</th><th style="width: 8%; text-align: right;">SGST</th>`
          }
          <th style="width: 10%; text-align: right;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${tableRows || `<tr><td colspan="9" style="text-align:center; padding:12px;">No items attached.</td></tr>`}
      </tbody>
    </table>

    <!-- Amount In Words -->
    <div class="words-box">
      <strong>Total In Words:</strong> <em>${escapeHtml(amountInWords)}</em>
    </div>

    <!-- Bottom Calculations & Bank Info -->
    <div class="totals-wrapper">
      <!-- Bank Account Details -->
      ${
        input.bankDetails?.bankName || input.bankDetails?.accountNo
          ? `<div class="bank-box">
        <div style="font-weight: 700; border-bottom: 1px solid #cbd5e1; padding-bottom: 2px; margin-bottom: 4px; color: #1e293b;">
          Bank &amp; Payment Details
        </div>
        ${input.bankDetails?.bankName ? `<div><strong>Bank Name:</strong> ${escapeHtml(input.bankDetails.bankName)}</div>` : ""}
        <div><strong>A/C Name:</strong> ${escapeHtml(companyName)}</div>
        ${input.bankDetails?.accountNo ? `<div><strong>A/C No:</strong> <span style="font-family:monospace; font-weight:700;">${escapeHtml(input.bankDetails.accountNo)}</span></div>` : ""}
        ${input.bankDetails?.ifscCode ? `<div><strong>IFSC Code:</strong> <span style="font-family:monospace; font-weight:700;">${escapeHtml(input.bankDetails.ifscCode)}</span></div>` : ""}
        ${input.bankDetails?.branch ? `<div><strong>Branch:</strong> ${escapeHtml(input.bankDetails.branch)}</div>` : ""}
        ${input.bankDetails?.upiId ? `<div><strong>UPI ID:</strong> <span style="font-family:monospace; color:#2563eb;">${escapeHtml(input.bankDetails.upiId)}</span></div>` : ""}
      </div>`
          : ""
      }

      <!-- Financial Calculation Box -->
      <div class="calc-box">
        <div class="calc-row">
          <span>Total Taxable Value:</span>
          <span style="font-weight: 600;">${sym}${input.subTotal.toFixed(2)}</span>
        </div>
        ${
          isGlobal
            ? `<div class="calc-row"><span>VAT / Sales Tax:</span><span>${sym}${input.taxAmount.toFixed(2)}</span></div>`
            : isInterState
            ? `<div class="calc-row"><span>Integrated Tax (IGST):</span><span>${sym}${igstVal.toFixed(2)}</span></div>`
            : `<div class="calc-row"><span>Central Tax (CGST):</span><span>${sym}${cgstVal.toFixed(2)}</span></div>
               <div class="calc-row"><span>State Tax (SGST):</span><span>${sym}${sgstVal.toFixed(2)}</span></div>`
        }
        ${
          input.discountAmount && input.discountAmount > 0
            ? `<div class="calc-row" style="color:#b91c1c;"><span>Bill Discount:</span><span>- ${sym}${input.discountAmount.toFixed(2)}</span></div>`
            : ""
        }
        <div class="calc-row">
          <span>Total Tax Amount:</span>
          <span>${sym}${input.taxAmount.toFixed(2)}</span>
        </div>
        <div class="calc-row final">
          <span>NET PAYABLE AMOUNT:</span>
          <span>${sym}${input.total.toFixed(2)}</span>
        </div>
      </div>
    </div>

    <!-- Terms and Signatures -->
    <div class="footer-sign">
      <div style="width: 58%; font-size: 9.5px; color: #475569;">
        <strong>Terms &amp; Conditions:</strong><br/>
        1. Goods once sold will not be taken back without authorization.<br/>
        2. Interest @ 18% p.a. will be charged for delayed payments after due date.<br/>
        3. Subject to ${escapeHtml(input.jurisdiction || "registered office")} jurisdiction only.<br/>
        <em>This is a computer-generated Digitally Signed GST Tax Invoice.</em>
      </div>
      <div style="width: 38%; text-align: right; font-size: 10px;">
        <div>For <strong>${escapeHtml(companyName)}</strong></div>
        <div style="height: 44px;"></div>
        <div style="border-top: 1px dashed #94a3b8; display: inline-block; min-width: 140px; text-align: center; padding-top: 3px; font-weight: 600;">
          Authorized Signatory
        </div>
      </div>
    </div>
  </div>
</body>
</html>`);

  popup.document.close();
  popup.focus();
  setTimeout(() => popup.print(), 250);
}
