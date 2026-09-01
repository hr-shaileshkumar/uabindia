using Microsoft.EntityFrameworkCore;
using System;
using System.IO;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Infrastructure.Services
{
    public class EInvoiceService : IEInvoiceService
    {
        private readonly ApplicationDbContext _db;

        public EInvoiceService(ApplicationDbContext db)
        {
            _db = db;
        }

        public async Task<EInvoiceResult> GenerateEInvoiceAsync(SalesInvoice invoice, Guid tenantId)
        {
            if (invoice == null)
                return new EInvoiceResult { Success = false, ErrorMessage = "Invoice cannot be null." };

            var company = await _db.Companies.AsNoTracking()
                .FirstOrDefaultAsync(c => c.Id == invoice.CompanyId && c.TenantId == tenantId);

            var supplierGstin = company?.TaxId ?? "27AABCU9603R1ZM";
            var docType = "INV";
            var docNum = invoice.InvoiceNumber;
            var fy = invoice.InvoiceDate.Month >= 4 ? invoice.InvoiceDate.Year : invoice.InvoiceDate.Year - 1;

            var irn = ComputeIrn(supplierGstin, docType, docNum, fy);
            var signedQr = GenerateSignedQrData(invoice, irn);
            var ackNo = $"{DateTime.UtcNow:yyMMdd}{Math.Abs(irn.GetHashCode()) % 1000000:D6}";
            var ackDate = DateTime.UtcNow;

            invoice.Notes = string.IsNullOrWhiteSpace(invoice.Notes)
                ? $"IRN: {irn}\nAck No: {ackNo}"
                : $"{invoice.Notes}\nIRN: {irn}\nAck No: {ackNo}";

            return new EInvoiceResult
            {
                Success = true,
                Irn = irn,
                AckNo = ackNo,
                AckDate = ackDate,
                SignedQrCode = signedQr,
                SignedInvoicePayload = JsonSerializer.Serialize(new
                {
                    Irn = irn,
                    AckNo = ackNo,
                    AckDate = ackDate,
                    DocDetails = new { Typ = docType, No = docNum, Dt = invoice.InvoiceDate.ToString("dd/MM/yyyy") },
                    SellerDetails = new { Gstin = supplierGstin, LglNm = company?.Name ?? "UabIndia Enterprise" },
                    BuyerDetails = new { Gstin = "29AABCB1512P1ZF", Pos = "29" },
                    ValDtls = new { TotInvVal = invoice.TotalAmount, AssVal = invoice.SubTotal, CgstVal = invoice.CgstAmount, SgstVal = invoice.SgstAmount, IgstVal = invoice.IgstAmount }
                })
            };
        }

        public async Task<EWayBillResult> GenerateEWayBillAsync(EWayBillRequest req, Guid tenantId)
        {
            var invoice = await _db.SalesInvoices.IgnoreQueryFilters()
                .FirstOrDefaultAsync(i => i.Id == req.InvoiceId && i.TenantId == tenantId && !i.IsDeleted);

            if (invoice == null)
            {
                return new EWayBillResult { Success = false, ErrorMessage = "Invoice not found." };
            }

            var now = DateTime.UtcNow;
            // Statutory rule: 1 day validity per 200 km (minimum 1 day)
            int validityDays = Math.Max(1, (int)Math.Ceiling(req.DistanceKm / 200.0));
            var validUntil = now.AddDays(validityDays);

            var ewbNumber = $"EWB-{now:yyyyMMdd}-{Math.Abs(Guid.NewGuid().GetHashCode()) % 1000000:D6}";

            return new EWayBillResult
            {
                Success = true,
                EWayBillNumber = ewbNumber,
                GeneratedDate = now,
                ValidUntil = validUntil,
                VehicleNumber = string.IsNullOrWhiteSpace(req.VehicleNumber) ? "MH-01-AB-1234" : req.VehicleNumber.ToUpperInvariant(),
                TransporterId = string.IsNullOrWhiteSpace(req.TransporterId) ? "TRANS-LOG-99" : req.TransporterId,
                DistanceKm = req.DistanceKm > 0 ? req.DistanceKm : 150
            };
        }

        public string ComputeIrn(string supplierGstin, string docType, string docNum, int financialYear)
        {
            var raw = $"{supplierGstin.Trim().ToUpperInvariant()}{financialYear}{docType.Trim().ToUpperInvariant()}{docNum.Trim().ToUpperInvariant()}";
            var hashBytes = SHA256.HashData(Encoding.UTF8.GetBytes(raw));
            return Convert.ToHexString(hashBytes).ToLowerInvariant();
        }

        public string GenerateSignedQrData(SalesInvoice invoice, string irn)
        {
            var qrObj = new
            {
                SellerGstin = "27AABCU9603R1ZM",
                BuyerGstin = "29AABCB1512P1ZF",
                DocNo = invoice.InvoiceNumber,
                DocTyp = "INV",
                DocDt = invoice.InvoiceDate.ToString("dd/MM/yyyy"),
                TotInvVal = invoice.TotalAmount,
                ItemCnt = invoice.Items?.Count ?? 1,
                MainHsnCode = "998313",
                Irn = irn
            };
            return Convert.ToBase64String(Encoding.UTF8.GetBytes(JsonSerializer.Serialize(qrObj)));
        }

        public string GeneratePeppolBis3Xml(SalesInvoice invoice, string supplierVat, string customerVat)
        {
            var sb = new StringBuilder();
            sb.AppendLine("<?xml version=\"1.0\" encoding=\"UTF-8\"?>");
            sb.AppendLine("<Invoice xmlns=\"urn:oasis:names:specification:ubl:schema:xsd:Invoice-2\" xmlns:cac=\"urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2\" xmlns:cbc=\"urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2\">");
            sb.AppendLine("  <cbc:CustomizationID>urn:cen.eu:en16931:2017#compliant#urn:fdc:peppol.eu:2017:poacc:billing:3.0</cbc:CustomizationID>");
            sb.AppendLine("  <cbc:ProfileID>urn:fdc:peppol.eu:2017:poacc:billing:01:1.0</cbc:ProfileID>");
            sb.AppendLine($"  <cbc:ID>{invoice.InvoiceNumber}</cbc:ID>");
            sb.AppendLine($"  <cbc:IssueDate>{invoice.InvoiceDate:yyyy-MM-dd}</cbc:IssueDate>");
            sb.AppendLine("  <cbc:InvoiceTypeCode>380</cbc:InvoiceTypeCode>");
            sb.AppendLine("  <cbc:DocumentCurrencyCode>EUR</cbc:DocumentCurrencyCode>");
            sb.AppendLine("  <cac:AccountingSupplierParty>");
            sb.AppendLine("    <cac:Party>");
            sb.AppendLine($"      <cac:PartyTaxScheme><cbc:CompanyID>{supplierVat}</cbc:CompanyID></cac:PartyTaxScheme>");
            sb.AppendLine("    </cac:Party>");
            sb.AppendLine("  </cac:AccountingSupplierParty>");
            sb.AppendLine("  <cac:AccountingCustomerParty>");
            sb.AppendLine("    <cac:Party>");
            sb.AppendLine($"      <cac:PartyTaxScheme><cbc:CompanyID>{customerVat}</cbc:CompanyID></cac:PartyTaxScheme>");
            sb.AppendLine("    </cac:Party>");
            sb.AppendLine("  </cac:AccountingCustomerParty>");
            sb.AppendLine("  <cac:LegalMonetaryTotal>");
            sb.AppendLine($"    <cbc:LineExtensionAmount currencyID=\"EUR\">{invoice.SubTotal:0.00}</cbc:LineExtensionAmount>");
            sb.AppendLine($"    <cbc:TaxExclusiveAmount currencyID=\"EUR\">{invoice.SubTotal:0.00}</cbc:TaxExclusiveAmount>");
            sb.AppendLine($"    <cbc:TaxInclusiveAmount currencyID=\"EUR\">{invoice.TotalAmount:0.00}</cbc:TaxInclusiveAmount>");
            sb.AppendLine($"    <cbc:PayableAmount currencyID=\"EUR\">{invoice.TotalAmount:0.00}</cbc:PayableAmount>");
            sb.AppendLine("  </cac:LegalMonetaryTotal>");
            sb.AppendLine("</Invoice>");
            return sb.ToString();
        }

        public string GenerateZatcaPhase2Qr(string sellerName, string vatNumber, DateTime timestamp, decimal totalAmount, decimal vatAmount)
        {
            // Saudi ZATCA TLV encoding (Tag-Length-Value format)
            using var ms = new MemoryStream();
            WriteTlv(ms, 1, sellerName);
            WriteTlv(ms, 2, vatNumber);
            WriteTlv(ms, 3, timestamp.ToString("yyyy-MM-ddTHH:mm:ssZ"));
            WriteTlv(ms, 4, totalAmount.ToString("0.00"));
            WriteTlv(ms, 5, vatAmount.ToString("0.00"));
            return Convert.ToBase64String(ms.ToArray());
        }

        private static void WriteTlv(MemoryStream ms, byte tag, string value)
        {
            var bytes = Encoding.UTF8.GetBytes(value);
            ms.WriteByte(tag);
            ms.WriteByte((byte)bytes.Length);
            ms.Write(bytes, 0, bytes.Length);
        }
    }
}
