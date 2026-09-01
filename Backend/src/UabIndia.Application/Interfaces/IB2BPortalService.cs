using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace UabIndia.Application.Interfaces
{
    public class PortalInvoiceSummaryDto
    {
        public Guid InvoiceId { get; set; }
        public string InvoiceNumber { get; set; } = string.Empty;
        public DateTime InvoiceDate { get; set; }
        public DateTime DueDate { get; set; }
        public decimal TotalAmount { get; set; }
        public decimal PaidAmount { get; set; }
        public decimal OutstandingBalance { get; set; }
        public string Status { get; set; } = "Unpaid"; // Paid, PartiallyPaid, Unpaid, Overdue
        public string CurrencyCode { get; set; } = "USD";
    }

    public class PortalQuotationSummaryDto
    {
        public Guid QuotationId { get; set; }
        public string QuotationNumber { get; set; } = string.Empty;
        public DateTime QuotationDate { get; set; }
        public DateTime ValidUntil { get; set; }
        public decimal TotalAmount { get; set; }
        public string Status { get; set; } = "Sent"; // Sent, Accepted, Declined
        public string CurrencyCode { get; set; } = "USD";
        public string? AcceptedByName { get; set; }
    }

    public class PortalLedgerStatementDto
    {
        public DateTime Date { get; set; }
        public string VoucherType { get; set; } = string.Empty;
        public string ReferenceNumber { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public decimal Debit { get; set; }
        public decimal Credit { get; set; }
        public decimal RunningBalance { get; set; }
    }

    public class B2BPortalOverviewDto
    {
        public Guid PartnerId { get; set; }
        public string PartnerName { get; set; } = string.Empty;
        public string PartnerType { get; set; } = "Customer"; // Customer or Vendor
        public string CurrencyCode { get; set; } = "USD";
        public decimal TotalOutstandingBalance { get; set; }
        public decimal OverdueAmount { get; set; }
        public decimal UnallocatedCredits { get; set; }
        public decimal CreditLimit { get; set; }
        public List<PortalInvoiceSummaryDto> Invoices { get; set; } = new();
        public List<PortalQuotationSummaryDto> Quotations { get; set; } = new();
        public List<PortalLedgerStatementDto> LedgerTransactions { get; set; } = new();
    }

    public class AcceptQuotationRequest
    {
        public Guid QuotationId { get; set; }
        public string DigitalSignatureName { get; set; } = string.Empty;
        public string? ConfirmationNotes { get; set; }
    }

    public interface IB2BPortalService
    {
        Task<B2BPortalOverviewDto> GetPartnerPortalOverviewAsync(
            Guid tenantId,
            Guid partnerId,
            string partnerType = "Customer",
            CancellationToken ct = default);

        Task<bool> AcceptQuotationAsync(
            Guid tenantId,
            AcceptQuotationRequest req,
            CancellationToken ct = default);
    }
}
