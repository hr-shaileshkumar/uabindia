using System;
using System.Collections.Generic;
using System.Globalization;
using System.Net;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace UabIndia.Api.Modules.Administration.Controllers
{
    [ApiController]
    [Route("api/v1/document-templates")]
    [Authorize]
    public class DocumentTemplatesController : ControllerBase
    {
        public class DocumentTemplateInfoDto
        {
            public string Key { get; set; } = string.Empty;
            public string Name { get; set; } = string.Empty;
            public string Category { get; set; } = "Commercial"; // Commercial | HRMS | General
            public string Description { get; set; } = string.Empty;
            public string PageOrientation { get; set; } = "Portrait";
        }

        public class RenderDocumentRequest
        {
            public string TemplateKey { get; set; } = "general";
            public string Title { get; set; } = "Official Document";
            public string DocumentNumber { get; set; } = string.Empty;
            public string? Date { get; set; }
            public string? WatermarkText { get; set; }
            public string? CompanyName { get; set; }
            public string? CompanyAddress { get; set; }
            public string? CompanyGstin { get; set; }
            public string? LogoUrl { get; set; }
            public string? BrandColor { get; set; } = "#0f172a";
            public string? AccentColor { get; set; } = "#2563eb";
            public string? HeaderLayout { get; set; } = "modern-split";
            public string? PartyName { get; set; }
            public string? PartyAddress { get; set; }
            public string? PartyGstin { get; set; }
            public List<RenderLineItemDto> LineItems { get; set; } = new();
            public Dictionary<string, string> SummaryFields { get; set; } = new();
            public decimal SubTotal { get; set; }
            public decimal TaxAmount { get; set; }
            public decimal GrandTotal { get; set; }
            public string Currency { get; set; } = "INR";
            public string? Notes { get; set; }
            public bool IncludeSignatureBlock { get; set; } = true;
        }

        public class RenderLineItemDto
        {
            public string Description { get; set; } = string.Empty;
            public string? HsnCode { get; set; }
            public decimal Quantity { get; set; } = 1;
            public decimal UnitPrice { get; set; }
            public decimal TaxRate { get; set; }
            public decimal LineTotal { get; set; }
        }

        [HttpGet]
        public IActionResult GetTemplates()
        {
            var templates = new List<DocumentTemplateInfoDto>
            {
                new()
                {
                    Key = "tax_invoice",
                    Name = "GST Tax Invoice",
                    Category = "Commercial",
                    Description = "Official GST-compliant tax invoice template with HSN codes, split CGST/SGST/IGST and bank details.",
                    PageOrientation = "Portrait"
                },
                new()
                {
                    Key = "purchase_order",
                    Name = "Procurement Purchase Order",
                    Category = "Commercial",
                    Description = "Standard enterprise purchase order with billing/shipping addresses and line items.",
                    PageOrientation = "Portrait"
                },
                new()
                {
                    Key = "employee_dossier",
                    Name = "Employee Master Dossier",
                    Category = "HRMS",
                    Description = "Comprehensive employee profile with department, designation, joining date, and statutory details.",
                    PageOrientation = "Portrait"
                },
                new()
                {
                    Key = "general",
                    Name = "Enterprise Standard Document",
                    Category = "General",
                    Description = "Universal corporate letterhead and field grid template for any entity.",
                    PageOrientation = "Portrait"
                }
            };

            return Ok(new { data = templates });
        }

        [HttpPost("render")]
        public IActionResult RenderDocument([FromBody] RenderDocumentRequest request)
        {
            if (request == null) return BadRequest("Request body cannot be null.");

            var html = GenerateDocumentHtml(request);
            return Content(html, "text/html", Encoding.UTF8);
        }

        [HttpPost("render-pdf")]
        [HttpGet("render-pdf")]
        public IActionResult RenderPdf([FromBody] RenderDocumentRequest? request)
        {
            var req = request ?? new RenderDocumentRequest();
            var pdfBytes = GenerateSimplePdf(req);
            var filename = $"{(string.IsNullOrWhiteSpace(req.DocumentNumber) ? "document" : req.DocumentNumber)}_{DateTime.UtcNow:yyyyMMdd}.pdf";
            return File(pdfBytes, "application/pdf", filename);
        }

        private static string GenerateDocumentHtml(RenderDocumentRequest req)
        {
            var company = WebUtility.HtmlEncode(string.IsNullOrWhiteSpace(req.CompanyName) ? "Corporate Enterprise" : req.CompanyName);
            var companyAddress = WebUtility.HtmlEncode(req.CompanyAddress ?? "");
            var companyGstin = WebUtility.HtmlEncode(req.CompanyGstin ?? "");
            var logoUrl = WebUtility.HtmlEncode(req.LogoUrl ?? "");
            var brandColor = !string.IsNullOrWhiteSpace(req.BrandColor) && System.Text.RegularExpressions.Regex.IsMatch(req.BrandColor, "^#[0-9a-fA-F]{3,8}$") ? req.BrandColor : "#0f172a";
            var accentColor = !string.IsNullOrWhiteSpace(req.AccentColor) && System.Text.RegularExpressions.Regex.IsMatch(req.AccentColor, "^#[0-9a-fA-F]{3,8}$") ? req.AccentColor : "#2563eb";
            var title = WebUtility.HtmlEncode(req.Title);
            var docNum = WebUtility.HtmlEncode(req.DocumentNumber);
            var date = WebUtility.HtmlEncode(req.Date ?? DateTime.UtcNow.ToString("dd MMM yyyy", CultureInfo.InvariantCulture));
            var party = WebUtility.HtmlEncode(req.PartyName ?? "N/A");
            var partyAddress = WebUtility.HtmlEncode(req.PartyAddress ?? "");
            var partyGstin = WebUtility.HtmlEncode(req.PartyGstin ?? "");
            var watermark = WebUtility.HtmlEncode(req.WatermarkText ?? "");

            var sb = new StringBuilder();
            sb.Append("<!doctype html>\n<html lang=\"en\">\n<head>\n");
            sb.Append("<meta charset=\"utf-8\">\n");
            sb.Append($"<title>{title} - {docNum}</title>\n");
            sb.Append("<style>\n");
            sb.Append("@page { size: A4 portrait; margin: 12mm; }\n");
            sb.Append("* { box-sizing: border-box; }\n");
            sb.Append($":root {{ --brand-primary: {brandColor}; --brand-accent: {accentColor}; }}\n");
            sb.Append("body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #0f172a; margin: 0; padding: 16px; font-size: 11px; background: #fff; line-height: 1.4; }\n");
            sb.Append(".doc-container { max-width: 820px; margin: 0 auto; border: 1px solid #cbd5e1; padding: 18px; position: relative; }\n");
            if (!string.IsNullOrWhiteSpace(watermark))
            {
                sb.Append(".watermark { position: absolute; top: 40%; left: 15%; transform: rotate(-35deg); font-size: 72px; font-weight: 800; color: rgba(148, 163, 184, 0.12); pointer-events: none; text-transform: uppercase; z-index: 0; letter-spacing: 4px; }\n");
            }
            sb.Append(".header { display: flex; justify-content: space-between; border-bottom: 2px solid var(--brand-primary); padding-bottom: 12px; margin-bottom: 14px; position: relative; z-index: 1; }\n");
            sb.Append(".doc-badge { display: inline-block; background: var(--brand-primary); color: #fff; font-weight: 700; font-size: 12px; padding: 3px 10px; border-radius: 4px; text-transform: uppercase; margin-bottom: 4px; }\n");
            sb.Append(".grid-2 { display: flex; gap: 12px; margin-bottom: 14px; position: relative; z-index: 1; }\n");
            sb.Append(".card { flex: 1; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px 10px; font-size: 10.5px; background: #f8fafc; }\n");
            sb.Append("table.data-table { width: 100%; border-collapse: collapse; margin-bottom: 14px; position: relative; z-index: 1; }\n");
            sb.Append("table.data-table th { background: var(--brand-primary); color: #fff; font-size: 10px; font-weight: 600; padding: 6px 8px; border: 1px solid var(--brand-primary); text-transform: uppercase; }\n");
            sb.Append("table.data-table td { padding: 6px 8px; border: 1px solid #cbd5e1; font-size: 10.5px; }\n");
            sb.Append(".totals { display: flex; justify-content: flex-end; margin-bottom: 16px; position: relative; z-index: 1; }\n");
            sb.Append(".totals-box { width: 260px; border: 1px solid #cbd5e1; border-radius: 6px; overflow: hidden; }\n");
            sb.Append(".totals-row { display: flex; justify-content: space-between; padding: 5px 8px; border-bottom: 1px solid #e2e8f0; font-size: 11px; }\n");
            sb.Append(".totals-row.grand { background: var(--brand-primary); color: #fff; font-weight: 700; font-size: 12px; border-bottom: none; }\n");
            sb.Append(".signature-block { display: flex; justify-content: space-between; margin-top: 24px; padding-top: 14px; border-top: 1px solid #cbd5e1; position: relative; z-index: 1; }\n");
            sb.Append("@media print {\n");
            sb.Append("  body { padding: 0; background: none; }\n");
            sb.Append("  .doc-container { border: none; padding: 0; }\n");
            sb.Append("  .no-print { display: none; }\n");
            sb.Append("}\n");
            sb.Append("</style>\n</head>\n<body>\n");

            sb.Append("<div class=\"doc-container\">\n");

            if (!string.IsNullOrWhiteSpace(watermark))
            {
                sb.Append($"<div class=\"watermark\">{watermark}</div>\n");
            }

            // Header
            sb.Append("<div class=\"header\">\n");
            sb.Append("  <div>\n");
            sb.Append($"    <div style=\"font-size: 18px; font-weight: 800; color: #0f172a;\">{company}</div>\n");
            if (!string.IsNullOrWhiteSpace(companyAddress))
                sb.Append($"    <div style=\"color: #64748b; font-size: 10px; margin-top: 2px;\">{companyAddress}</div>\n");
            if (!string.IsNullOrWhiteSpace(companyGstin))
                sb.Append($"    <div style=\"color: #475569; font-size: 10px; font-weight: 600;\">GSTIN: {companyGstin}</div>\n");
            sb.Append("  </div>\n");
            sb.Append("  <div style=\"text-align: right;\">\n");
            sb.Append($"    <div class=\"doc-badge\">{title}</div>\n");
            sb.Append($"    <div style=\"font-size: 12px; font-weight: 700; color: #0f172a;\">#{docNum}</div>\n");
            sb.Append($"    <div style=\"color: #64748b; font-size: 10px;\">Date: {date}</div>\n");
            sb.Append("  </div>\n");
            sb.Append("</div>\n");

            // Party card if present
            if (!string.IsNullOrWhiteSpace(req.PartyName))
            {
                sb.Append("<div class=\"grid-2\">\n");
                sb.Append("  <div class=\"card\">\n");
                sb.Append("    <div style=\"font-weight: 700; color: #475569; margin-bottom: 2px; text-transform: uppercase; font-size: 9.5px;\">Billed / Issued To:</div>\n");
                sb.Append($"    <div style=\"font-weight: 700; font-size: 11px;\">{party}</div>\n");
                if (!string.IsNullOrWhiteSpace(partyAddress)) sb.Append($"    <div style=\"color: #64748b;\">{partyAddress}</div>\n");
                if (!string.IsNullOrWhiteSpace(partyGstin)) sb.Append($"    <div style=\"color: #475569; font-weight: 600;\">GSTIN: {partyGstin}</div>\n");
                sb.Append("  </div>\n");
                sb.Append("</div>\n");
            }

            // Summary fields if present
            if (req.SummaryFields != null && req.SummaryFields.Count > 0)
            {
                sb.Append("<div class=\"grid-2\" style=\"flex-wrap: wrap;\">\n");
                foreach (var kv in req.SummaryFields)
                {
                    sb.Append("  <div class=\"card\" style=\"min-width: 180px;\">\n");
                    sb.Append($"    <div style=\"font-size: 9.5px; color: #64748b; text-transform: uppercase;\">{WebUtility.HtmlEncode(kv.Key)}</div>\n");
                    sb.Append($"    <div style=\"font-size: 11px; font-weight: 600; color: #0f172a;\">{WebUtility.HtmlEncode(kv.Value)}</div>\n");
                    sb.Append("  </div>\n");
                }
                sb.Append("</div>\n");
            }

            // Line items table if present
            if (req.LineItems != null && req.LineItems.Count > 0)
            {
                sb.Append("<table class=\"data-table\">\n");
                sb.Append("  <thead>\n");
                sb.Append("    <tr>\n");
                sb.Append("      <th style=\"width: 35px; text-align: center;\">#</th>\n");
                sb.Append("      <th>Description</th>\n");
                sb.Append("      <th style=\"width: 70px; text-align: center;\">HSN/SAC</th>\n");
                sb.Append("      <th style=\"width: 50px; text-align: right;\">Qty</th>\n");
                sb.Append("      <th style=\"width: 80px; text-align: right;\">Rate</th>\n");
                sb.Append("      <th style=\"width: 60px; text-align: right;\">Tax %</th>\n");
                sb.Append("      <th style=\"width: 90px; text-align: right;\">Amount</th>\n");
                sb.Append("    </tr>\n");
                sb.Append("  </thead>\n");
                sb.Append("  <tbody>\n");

                int idx = 1;
                foreach (var item in req.LineItems)
                {
                    var hsn = item.HsnCode ?? "-";
                    var desc = WebUtility.HtmlEncode(item.Description);
                    sb.Append("    <tr>\n");
                    sb.Append($"      <td style=\"text-align: center;\">{idx++}</td>\n");
                    sb.Append($"      <td style=\"font-weight: 600;\">{desc}</td>\n");
                    sb.Append($"      <td style=\"text-align: center; font-family: monospace;\">{WebUtility.HtmlEncode(hsn)}</td>\n");
                    sb.Append($"      <td style=\"text-align: right;\">{item.Quantity.ToString(CultureInfo.InvariantCulture)}</td>\n");
                    sb.Append($"      <td style=\"text-align: right;\">₹{item.UnitPrice.ToString("N2", CultureInfo.InvariantCulture)}</td>\n");
                    sb.Append($"      <td style=\"text-align: right;\">{item.TaxRate.ToString(CultureInfo.InvariantCulture)}%</td>\n");
                    sb.Append($"      <td style=\"text-align: right; font-weight: 700;\">₹{item.LineTotal.ToString("N2", CultureInfo.InvariantCulture)}</td>\n");
                    sb.Append("    </tr>\n");
                }

                sb.Append("  </tbody>\n");
                sb.Append("</table>\n");

                // Totals box
                sb.Append("<div class=\"totals\">\n");
                sb.Append("  <div class=\"totals-box\">\n");
                sb.Append($"    <div class=\"totals-row\"><span>Subtotal:</span><span>₹{req.SubTotal.ToString("N2", CultureInfo.InvariantCulture)}</span></div>\n");
                sb.Append($"    <div class=\"totals-row\"><span>Total Tax:</span><span>₹{req.TaxAmount.ToString("N2", CultureInfo.InvariantCulture)}</span></div>\n");
                sb.Append($"    <div class=\"totals-row grand\"><span>Grand Total:</span><span>₹{req.GrandTotal.ToString("N2", CultureInfo.InvariantCulture)}</span></div>\n");
                sb.Append("  </div>\n");
                sb.Append("</div>\n");
            }

            // Notes
            if (!string.IsNullOrWhiteSpace(req.Notes))
            {
                sb.Append("<div style=\"margin-top: 8px; font-size: 10px; color: #64748b;\">\n");
                sb.Append($"  <strong>Notes & Conditions:</strong> {WebUtility.HtmlEncode(req.Notes)}\n");
                sb.Append("</div>\n");
            }

            // Signature block
            if (req.IncludeSignatureBlock)
            {
                sb.Append("<div class=\"signature-block\">\n");
                sb.Append("  <div>\n");
                sb.Append("    <div style=\"height: 35px;\"></div>\n");
                sb.Append("    <div style=\"border-top: 1px dashed #94a3b8; width: 160px; padding-top: 4px; color: #64748b; font-size: 10px;\">Customer / Recipient Signature</div>\n");
                sb.Append("  </div>\n");
                sb.Append("  <div style=\"text-align: right;\">\n");
                sb.Append($"    <div style=\"font-size: 10px; font-weight: 600; color: #475569;\">For {company}</div>\n");
                sb.Append("    <div style=\"height: 25px;\"></div>\n");
                sb.Append("    <div style=\"border-top: 1px dashed #94a3b8; width: 160px; margin-left: auto; padding-top: 4px; color: #64748b; font-size: 10px;\">Authorized Signatory</div>\n");
                sb.Append("  </div>\n");
                sb.Append("</div>\n");
            }

            sb.Append("</div>\n"); // doc-container
            sb.Append("<script>\nwindow.onload = function() { window.print(); };\n</script>\n");
            sb.Append("</body>\n</html>");

            return sb.ToString();
        }

        private static byte[] GenerateSimplePdf(RenderDocumentRequest req)
        {
            var sb = new StringBuilder();
            var docNum = string.IsNullOrWhiteSpace(req.DocumentNumber) ? "DOC-001" : req.DocumentNumber;
            var title = string.IsNullOrWhiteSpace(req.Title) ? "Official Document" : req.Title;
            var company = string.IsNullOrWhiteSpace(req.CompanyName) ? "Corporate Enterprise" : req.CompanyName;
            var party = string.IsNullOrWhiteSpace(req.PartyName) ? "Recipient" : req.PartyName;
            var total = req.GrandTotal.ToString("N2", CultureInfo.InvariantCulture);

            var streamContent = new StringBuilder();
            streamContent.AppendLine("BT");
            streamContent.AppendLine("/F1 18 Tf");
            streamContent.AppendLine("50 780 Td");
            streamContent.AppendLine($"({EscapePdf(company)}) Tj");
            streamContent.AppendLine("ET");

            streamContent.AppendLine("BT");
            streamContent.AppendLine("/F1 14 Tf");
            streamContent.AppendLine("50 750 Td");
            streamContent.AppendLine($"({EscapePdf(title)} - {EscapePdf(docNum)}) Tj");
            streamContent.AppendLine("ET");

            streamContent.AppendLine("BT");
            streamContent.AppendLine("/F1 10 Tf");
            streamContent.AppendLine("50 720 Td");
            streamContent.AppendLine($"({EscapePdf($"Date: {req.Date ?? DateTime.UtcNow.ToString("dd MMM yyyy", CultureInfo.InvariantCulture)}")}) Tj");
            streamContent.AppendLine("0 -16 Td");
            streamContent.AppendLine($"({EscapePdf($"Recipient: {party}")}) Tj");
            streamContent.AppendLine("0 -20 Td");
            streamContent.AppendLine($"({EscapePdf($"Total Amount: {req.Currency} {total}")}) Tj");

            if (req.LineItems != null && req.LineItems.Count > 0)
            {
                streamContent.AppendLine("0 -25 Td");
                streamContent.AppendLine("(Line Items:) Tj");
                foreach (var item in req.LineItems)
                {
                    streamContent.AppendLine("0 -14 Td");
                    streamContent.AppendLine($"({EscapePdf($" - {item.Description}: Qty {item.Quantity} @ {item.UnitPrice:N2} = {item.LineTotal:N2}")}) Tj");
                }
            }

            streamContent.AppendLine("ET");

            var streamBytes = Encoding.ASCII.GetBytes(streamContent.ToString());
            var streamLen = streamBytes.Length;

            var objects = new List<string>
            {
                "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
                "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
                "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n",
                $"4 0 obj\n<< /Length {streamLen} >>\nstream\n{streamContent}endstream\nendobj\n",
                "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n"
            };

            sb.Append("%PDF-1.4\n");
            var offsets = new List<int>();
            int currentOffset = Encoding.ASCII.GetByteCount(sb.ToString());

            foreach (var obj in objects)
            {
                offsets.Add(currentOffset);
                sb.Append(obj);
                currentOffset += Encoding.ASCII.GetByteCount(obj);
            }

            int xrefOffset = currentOffset;
            sb.Append($"xref\n0 {objects.Count + 1}\n");
            sb.Append("0000000000 65535 f \n");
            foreach (var off in offsets)
            {
                sb.Append($"{off:D10} 00000 n \n");
            }

            sb.Append("trailer\n");
            sb.Append($"<< /Size {objects.Count + 1} /Root 1 0 R >>\n");
            sb.Append($"startxref\n{xrefOffset}\n%%EOF\n");

            return Encoding.ASCII.GetBytes(sb.ToString());
        }

        private static string EscapePdf(string text)
        {
            return text.Replace("\\", "\\\\").Replace("(", "\\(").Replace(")", "\\)");
        }
    }
}
