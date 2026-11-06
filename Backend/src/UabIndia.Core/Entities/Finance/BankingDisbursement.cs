using System;
using System.Collections.Generic;

namespace UabIndia.Core.Entities
{
    // Automated Direct Banking Disbursements (ICICI, HDFC, RazorpayX, NEFT/RTGS batch file)
    public class DisbursementBatch : BaseEntity
    {
        public Guid? CompanyId { get; set; }
        public string BatchNumber { get; set; } = string.Empty;
        public string DisbursementType { get; set; } = "VendorPayments"; // VendorPayments, PayrollDisbursement, ExpenseReimbursements
        public string PaymentMode { get; set; } = "NEFT"; // NEFT, RTGS, IMPS, UPI
        public string DebitAccountNumber { get; set; } = string.Empty;
        public decimal TotalAmount { get; set; }
        public int TotalBeneficiaries { get; set; }
        public string Status { get; set; } = "Draft"; // Draft, Approved, Processing, ProcessedPartially, Success, Failed
        public string? GatewayProvider { get; set; } // OpenBanking_ICICI, RazorpayX, StandardBankTextFile
        public string? GatewayTransactionReference { get; set; }
        public DateTime? ProcessedAt { get; set; }
        public string? Notes { get; set; }

        public ICollection<DisbursementItem> Items { get; set; } = new List<DisbursementItem>();
    }

    public class DisbursementItem : BaseEntity
    {
        public Guid DisbursementBatchId { get; set; }
        public DisbursementBatch? DisbursementBatch { get; set; }
        public Guid? ReferenceEntityId { get; set; } // PurchaseInvoiceId or PayslipId
        public string BeneficiaryName { get; set; } = string.Empty;
        public string BeneficiaryAccountNumber { get; set; } = string.Empty;
        public string BeneficiaryIfsc { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public string Status { get; set; } = "Pending"; // Pending, Initiated, Success, Failed, Reversed
        public string? UtrNumber { get; set; } // Unique Transaction Reference from Bank
        public string? FailureReason { get; set; }
        public DateTime? SettledAt { get; set; }
    }
}

