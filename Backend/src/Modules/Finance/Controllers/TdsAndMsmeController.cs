using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Api.Modules.Finance.Controllers
{
    [ApiController]
    [Route("api/v1/finance/tds")]
    [Authorize]
    public class TdsAndMsmeController : ControllerBase
    {
        private readonly ApplicationDbContext _db;

        public TdsAndMsmeController(ApplicationDbContext db)
        {
            _db = db;
        }

        // ==================== INDIAN TDS (Tax Deducted at Source) ====================

        [HttpGet("summary")]
        public async Task<IActionResult> GetTdsSummary([FromQuery] int? financialYear, [FromQuery] int? quarter)
        {
            var fy = financialYear ?? DateTime.UtcNow.Year;
            var q = quarter ?? ((DateTime.UtcNow.Month - 1) / 3 + 1);

            var invoices = await _db.PurchaseInvoices.AsNoTracking()
                .Include(p => p.Vendor)
                .Where(p => !p.IsDeleted && p.TdsAmount > 0)
                .ToListAsync();

            var groupedBySection = invoices
                .GroupBy(i => i.TdsSection ?? "194C")
                .Select(g => new
                {
                    Section = g.Key,
                    SectionDescription = GetSectionDescription(g.Key),
                    TotalInvoices = g.Count(),
                    GrossTaxableAmount = g.Sum(x => x.SubTotal),
                    TotalTdsDeducted = g.Sum(x => x.TdsAmount),
                    NetPayable = g.Sum(x => x.NetAmountPayable),
                    Vendors = g.Select(x => new
                    {
                        VendorName = x.Vendor?.VendorName ?? "Unknown",
                        Pan = x.Vendor?.PANNumber ?? "-",
                        InvoiceNumber = x.InvoiceNumber,
                        InvoiceDate = x.InvoiceDate,
                        GrossAmount = x.SubTotal,
                        TdsRate = x.TdsRate,
                        TdsAmount = x.TdsAmount
                    }).Take(10).ToList()
                })
                .ToList();

            return Ok(new
            {
                success = true,
                financialYear = $"{fy}-{fy + 1}",
                quarter = $"Q{q}",
                totalTdsDeducted = invoices.Sum(x => x.TdsAmount),
                sections = groupedBySection,
                form26QReadyCount = invoices.Count(x => !string.IsNullOrEmpty(x.Vendor?.PANNumber))
            });
        }

        public class ApplyTdsRequest
        {
            public Guid PurchaseInvoiceId { get; set; }
            public string Section { get; set; } = "194C"; // 194C (Contractor 1% or 2%), 194J (Professional 10%), 194Q (Goods 0.1%), 194H (Commission 5%)
            public decimal Rate { get; set; } = 2.0m;
        }

        [HttpPost("apply")]
        public async Task<IActionResult> ApplyTds([FromBody] ApplyTdsRequest req)
        {
            var invoice = await _db.PurchaseInvoices
                .Include(p => p.Vendor)
                .FirstOrDefaultAsync(p => p.Id == req.PurchaseInvoiceId && !p.IsDeleted);

            if (invoice == null)
            {
                return NotFound(new { success = false, message = "Purchase Invoice not found." });
            }

            var tdsAmount = Math.Round(invoice.SubTotal * (req.Rate / 100m), 2);
            invoice.TdsSection = req.Section;
            invoice.TdsRate = req.Rate;
            invoice.TdsAmount = tdsAmount;
            invoice.NetAmountPayable = invoice.TotalAmount - tdsAmount;
            invoice.BalanceAmount = invoice.NetAmountPayable - invoice.PaidAmount;

            await _db.SaveChangesAsync();

            return Ok(new
            {
                success = true,
                message = $"TDS under Section {req.Section} @ {req.Rate}% successfully calculated.",
                invoiceId = invoice.Id,
                tdsAmount,
                netAmountPayable = invoice.NetAmountPayable
            });
        }

        // ==================== INDIAN MSME 45-DAY COMPLIANCE (Section 43B(h)) ====================

        [HttpGet("/api/v1/finance/msme/compliance-calendar")]
        public async Task<IActionResult> GetMsmeCalendar()
        {
            var now = DateTime.UtcNow;

            var msmeInvoices = await _db.PurchaseInvoices.AsNoTracking()
                .Include(p => p.Vendor)
                .Where(p => !p.IsDeleted && p.Vendor.IsMsmeRegistered && p.BalanceAmount > 0)
                .ToListAsync();

            var records = msmeInvoices.Select(inv =>
            {
                var daysAllowed = inv.Vendor.MsmePaymentTermsDays > 0 ? inv.Vendor.MsmePaymentTermsDays : 45;
                var dueDate = inv.MsmeDueDate ?? inv.InvoiceDate.AddDays(daysAllowed);
                var daysRemaining = (int)Math.Ceiling((dueDate - now).TotalDays);

                string riskLevel;
                if (daysRemaining < 0)
                    riskLevel = "Disallowed_43Bh"; // Overdue! Income tax disallowance kicks in
                else if (daysRemaining <= 10)
                    riskLevel = "Critical";
                else if (daysRemaining <= 25)
                    riskLevel = "Warning";
                else
                    riskLevel = "Safe";

                return new
                {
                    invoiceId = inv.Id,
                    invoiceNumber = inv.InvoiceNumber,
                    vendorName = inv.Vendor.VendorName,
                    udyamRegNo = inv.Vendor.MsmeUdyamRegistrationNumber ?? "-",
                    category = inv.Vendor.MsmeCategory ?? "Micro",
                    invoiceDate = inv.InvoiceDate,
                    dueDate,
                    daysRemaining,
                    balanceAmount = inv.BalanceAmount,
                    riskLevel
                };
            }).OrderBy(x => x.daysRemaining).ToList();

            var totalAtRisk = records.Where(r => r.riskLevel == "Disallowed_43Bh").Sum(r => r.balanceAmount);
            var totalCritical = records.Where(r => r.riskLevel == "Critical").Sum(r => r.balanceAmount);

            return Ok(new
            {
                success = true,
                summary = new
                {
                    totalActiveMsmeInvoices = records.Count,
                    totalPendingAmount = records.Sum(r => r.balanceAmount),
                    totalDisallowedAmount = totalAtRisk,
                    totalCriticalAmount = totalCritical
                },
                items = records
            });
        }

        private static string GetSectionDescription(string section)
        {
            return section switch
            {
                "194C" => "Payments to Contractors & Sub-contractors (1% / 2%)",
                "194J" => "Fees for Professional or Technical Services (10% / 2%)",
                "194Q" => "Purchase of Goods exceeding Rs 50 Lakhs (0.1%)",
                "194H" => "Commission or Brokerage (5%)",
                "194I" => "Rent for Land, Building, or Furniture (10%)",
                _ => "Other Statutory TDS Section"
            };
        }
    }
}

