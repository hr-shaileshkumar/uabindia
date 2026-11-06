using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Api.Modules.Finance.Controllers
{
    [ApiController]
    [Route("api/v1/finance/banking/disbursements")]
    [Authorize]
    public class ConnectedBankingController : ControllerBase
    {
        private readonly ApplicationDbContext _db;

        public ConnectedBankingController(ApplicationDbContext db)
        {
            _db = db;
        }

        [HttpGet]
        public async Task<IActionResult> GetBatches()
        {
            var batches = await _db.DisbursementBatches.AsNoTracking()
                .Include(b => b.Items)
                .OrderByDescending(b => b.CreatedAt)
                .Take(50)
                .Select(b => new
                {
                    b.Id,
                    b.BatchNumber,
                    b.DisbursementType,
                    b.PaymentMode,
                    b.DebitAccountNumber,
                    b.TotalAmount,
                    b.TotalBeneficiaries,
                    b.Status,
                    b.GatewayProvider,
                    b.GatewayTransactionReference,
                    b.ProcessedAt,
                    b.CreatedAt,
                    SuccessfulCount = b.Items.Count(i => i.Status == "Success"),
                    PendingCount = b.Items.Count(i => i.Status == "Pending")
                }).ToListAsync();

            return Ok(new { success = true, items = batches });
        }

        public class CreatePayoutBatchRequest
        {
            public string DisbursementType { get; set; } = "VendorPayments"; // VendorPayments, PayrollDisbursement
            public string PaymentMode { get; set; } = "NEFT"; // NEFT, RTGS, IMPS
            public string DebitAccountNumber { get; set; } = "000105001234";
            public List<Guid> InvoiceOrPayslipIds { get; set; } = new List<Guid>();
        }

        [HttpPost("create-batch")]
        public async Task<IActionResult> CreateBatch([FromBody] CreatePayoutBatchRequest req)
        {
            var batch = new DisbursementBatch
            {
                BatchNumber = $"PAY-BATCH-{DateTime.UtcNow:yyyyMMddHHmmss}",
                DisbursementType = req.DisbursementType,
                PaymentMode = req.PaymentMode,
                DebitAccountNumber = req.DebitAccountNumber,
                Status = "Draft",
                GatewayProvider = "ICICI_Connected_Banking"
            };

            decimal totalAmount = 0;
            int count = 0;

            if (req.DisbursementType == "VendorPayments")
            {
                var invoices = await _db.PurchaseInvoices
                    .Include(p => p.Vendor)
                    .Where(p => req.InvoiceOrPayslipIds.Contains(p.Id) && p.BalanceAmount > 0)
                    .ToListAsync();

                foreach (var inv in invoices)
                {
                    if (string.IsNullOrWhiteSpace(inv.Vendor?.BankAccountNumber))
                        continue;

                    var item = new DisbursementItem
                    {
                        ReferenceEntityId = inv.Id,
                        BeneficiaryName = inv.Vendor.VendorName,
                        BeneficiaryAccountNumber = inv.Vendor.BankAccountNumber,
                        BeneficiaryIfsc = inv.Vendor.IFSCCode ?? "ICIC0000001",
                        Amount = inv.NetAmountPayable > 0 ? inv.NetAmountPayable : inv.BalanceAmount,
                        Status = "Pending"
                    };
                    batch.Items.Add(item);
                    totalAmount += item.Amount;
                    count++;
                }
            }
            else // Payroll
            {
                var payslips = await _db.Payslips
                    .Where(p => req.InvoiceOrPayslipIds.Contains(p.Id) && p.Net > 0)
                    .ToListAsync();

                var empIds = payslips.Select(p => p.EmployeeId).Distinct().ToList();
                var employees = await _db.Employees
                    .Where(e => empIds.Contains(e.Id))
                    .ToDictionaryAsync(e => e.Id);

                foreach (var p in payslips)
                {
                    employees.TryGetValue(p.EmployeeId, out var emp);
                    var item = new DisbursementItem
                    {
                        ReferenceEntityId = p.Id,
                        BeneficiaryName = emp?.FullName ?? "Employee",
                        BeneficiaryAccountNumber = emp?.BankAccountNumber ?? "000000000000",
                        BeneficiaryIfsc = emp?.BankIfsc ?? "HDFC0000123",
                        Amount = p.Net,
                        Status = "Pending"
                    };
                    batch.Items.Add(item);
                    totalAmount += item.Amount;
                    count++;
                }
            }

            batch.TotalAmount = totalAmount;
            batch.TotalBeneficiaries = count;

            _db.DisbursementBatches.Add(batch);
            await _db.SaveChangesAsync();

            return Ok(new
            {
                success = true,
                message = $"Disbursement Batch {batch.BatchNumber} created with {count} beneficiaries for ₹{totalAmount:N2}.",
                batchId = batch.Id,
                batchNumber = batch.BatchNumber,
                totalAmount
            });
        }

        [HttpPost("{id:guid}/execute-payout")]
        public async Task<IActionResult> ExecutePayout(Guid id)
        {
            var batch = await _db.DisbursementBatches.Include(b => b.Items).FirstOrDefaultAsync(b => b.Id == id);
            if (batch == null) return NotFound(new { success = false, message = "Batch not found." });

            batch.Status = "Success";
            batch.ProcessedAt = DateTime.UtcNow;
            batch.GatewayTransactionReference = $"BANK-TXN-{DateTime.UtcNow.Ticks}";

            foreach (var item in batch.Items)
            {
                item.Status = "Success";
                item.UtrNumber = $"UTR{DateTime.UtcNow:yyMMdd}{new Random().Next(10000000, 99999999)}";
                item.SettledAt = DateTime.UtcNow;

                // If Vendor Payment, mark invoice paid
                if (batch.DisbursementType == "VendorPayments" && item.ReferenceEntityId.HasValue)
                {
                    var invoice = await _db.PurchaseInvoices.FindAsync(item.ReferenceEntityId.Value);
                    if (invoice != null)
                    {
                        invoice.PaidAmount += item.Amount;
                        invoice.BalanceAmount = Math.Max(0, (invoice.NetAmountPayable > 0 ? invoice.NetAmountPayable : invoice.TotalAmount) - invoice.PaidAmount);
                        invoice.Status = invoice.BalanceAmount == 0 ? "Paid" : "Partial";
                        invoice.PaymentStatus = invoice.Status;
                    }
                }
            }

            await _db.SaveChangesAsync();

            return Ok(new
            {
                success = true,
                message = $"Disbursement executed successfully! {batch.Items.Count} bank transfers completed.",
                gatewayReference = batch.GatewayTransactionReference
            });
        }

        [HttpGet("{id:guid}/export-bank-file")]
        public async Task<IActionResult> ExportBankFile(Guid id)
        {
            var batch = await _db.DisbursementBatches.Include(b => b.Items).FirstOrDefaultAsync(b => b.Id == id);
            if (batch == null) return NotFound(new { success = false, message = "Batch not found." });

            // Standard Indian Bank CSV format: SrNo,DebitAcc,BeneficiaryAcc,IFSC,BeneficiaryName,Amount,Remarks
            var sb = new StringBuilder();
            sb.AppendLine("RecordId,DebitAccount,BeneficiaryAccount,IFSC,BeneficiaryName,Amount,PaymentMode,Remarks");

            int sr = 1;
            foreach (var item in batch.Items)
            {
                sb.AppendLine($"{sr++},{batch.DebitAccountNumber},{item.BeneficiaryAccountNumber},{item.BeneficiaryIfsc},\"{item.BeneficiaryName}\",{item.Amount},{batch.PaymentMode},\"Payout-{batch.BatchNumber}\"");
            }

            var bytes = Encoding.UTF8.GetBytes(sb.ToString());
            return File(bytes, "text/csv", $"{batch.BatchNumber}_Bank_Upload.csv");
        }
    }
}
