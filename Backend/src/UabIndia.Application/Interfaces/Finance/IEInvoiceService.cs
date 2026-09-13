using System;
using System.Threading.Tasks;
using UabIndia.Core.Entities;

namespace UabIndia.Application.Interfaces
{
    public class EInvoiceResult
    {
        public bool Success { get; set; }
        public string? Irn { get; set; }
        public string? AckNo { get; set; }
        public DateTime? AckDate { get; set; }
        public string? SignedQrCode { get; set; }
        public string? SignedInvoicePayload { get; set; }
        public string? ErrorMessage { get; set; }
    }

    public class EWayBillRequest
    {
        public Guid InvoiceId { get; set; }
        public string TransporterId { get; set; } = string.Empty;
        public string TransporterName { get; set; } = string.Empty;
        public string VehicleNumber { get; set; } = string.Empty;
        public int DistanceKm { get; set; } = 150;
        public string SupplyType { get; set; } = "Outward";
        public string SubSupplyType { get; set; } = "Supply";
    }

    public class EWayBillResult
    {
        public bool Success { get; set; }
        public string? EWayBillNumber { get; set; }
        public DateTime? GeneratedDate { get; set; }
        public DateTime? ValidUntil { get; set; }
        public string? VehicleNumber { get; set; }
        public string? TransporterId { get; set; }
        public int DistanceKm { get; set; }
        public string? ErrorMessage { get; set; }
    }

    public interface IEInvoiceService
    {
        Task<EInvoiceResult> GenerateEInvoiceAsync(SalesInvoice invoice, Guid tenantId);
        Task<EWayBillResult> GenerateEWayBillAsync(EWayBillRequest req, Guid tenantId);
        string ComputeIrn(string supplierGstin, string docType, string docNum, int financialYear);
        string GenerateSignedQrData(SalesInvoice invoice, string irn);
        string GeneratePeppolBis3Xml(SalesInvoice invoice, string supplierVat, string customerVat);
        string GenerateZatcaPhase2Qr(string sellerName, string vatNumber, DateTime timestamp, decimal totalAmount, decimal vatAmount);
    }
}
