using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using UabIndia.Core.Services;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Api.Modules.Finance.Controllers
{
    [ApiController]
    [Route("api/v1/tax")]
    [Route("api/v1/finance/gst")]
    [Authorize]
    public class TaxController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly ITaxCalculationEngine _taxEngine;

        public TaxController(ApplicationDbContext db, ITaxCalculationEngine taxEngine)
        {
            _db = db;
            _taxEngine = taxEngine;
        }

        [HttpGet]
        [HttpGet("/api/v1/finance/gst")]
        [HttpGet("/api/v1/tax/gst")]
        public async Task<IActionResult> GetGstOverview([FromQuery] int? year, [FromQuery] int? month)
        {
            var y = year ?? DateTime.UtcNow.Year;
            var m = month ?? DateTime.UtcNow.Month;
            var start = new DateTime(y, m, 1, 0, 0, 0, DateTimeKind.Utc);
            var end = start.AddMonths(1);
            var invoices = await _db.SalesInvoices.AsNoTracking()
                .Include(i => i.Customer)
                .Where(i => !i.IsDeleted && i.InvoiceDate >= start && i.InvoiceDate < end && i.Status != "Cancelled")
                .ToListAsync();

            var rows = invoices.Select(i => new
            {
                id = i.Id,
                invoiceNumber = i.InvoiceNumber,
                customerName = i.Customer?.CustomerName ?? "Cash Sale",
                gstin = i.Customer?.GSTNumber ?? "-",
                invoiceDate = i.InvoiceDate,
                taxableAmount = i.SubTotal,
                cgst = i.CgstAmount,
                sgst = i.SgstAmount,
                igst = i.IgstAmount,
                totalTax = i.TaxAmount,
                totalAmount = i.TotalAmount,
                status = i.Status
            }).ToList();

            return Ok(new
            {
                success = true,
                data = rows,
                items = rows,
                total = rows.Count,
                period = $"{y:0000}-{m:00}",
                totalTaxable = invoices.Sum(i => i.SubTotal),
                totalTax = invoices.Sum(i => i.TaxAmount)
            });
        }

        public class GstCalcRequest
        {
            public decimal TaxableAmount { get; set; }
            public decimal TaxRate { get; set; } = 18;
            public string? FromState { get; set; }
            public string? ToState { get; set; }
        }

        [HttpPost("calculate")]
        public IActionResult CalculateGeneric([FromBody] TaxCalculationRequest req)
        {
            var result = _taxEngine.CalculateTax(req);
            return Ok(new { success = true, data = result });
        }

        [HttpPost("gst/calculate")]
        public IActionResult CalculateGst([FromBody] GstCalcRequest req)
        {
            var taxReq = new TaxCalculationRequest
            {
                CountryCode = "IND",
                TaxableAmount = req.TaxableAmount,
                DefaultRate = req.TaxRate,
                FromSubdivision = req.FromState,
                ToSubdivision = req.ToState
            };
            var result = _taxEngine.CalculateTax(taxReq);
            var cgst = result.TaxComponents.GetValueOrDefault("CGST", 0);
            var sgst = result.TaxComponents.GetValueOrDefault("SGST", 0);
            var igst = result.TaxComponents.GetValueOrDefault("IGST", 0);

            return Ok(new
            {
                interState = result.IsInterStateOrCrossBorder,
                cgst,
                sgst,
                igst,
                totalTax = result.TotalTaxAmount,
                invoiceTotal = result.TotalInvoiceAmount
            });
        }

        [HttpGet("gst/gstr1")]
        public async Task<IActionResult> Gstr1([FromQuery] int? year = null, [FromQuery] int? month = null)
        {
            var y = year ?? DateTime.UtcNow.Year;
            var m = month ?? DateTime.UtcNow.Month;
            var start = new DateTime(y, m, 1, 0, 0, 0, DateTimeKind.Utc);
            var end = start.AddMonths(1);
            var invoices = await _db.SalesInvoices.AsNoTracking()
                .Include(i => i.Customer)
                .Include(i => i.Items)
                .ThenInclude(it => it.Item)
                .Where(i => !i.IsDeleted && i.InvoiceDate >= start && i.InvoiceDate < end && i.Status != "Cancelled")
                .ToListAsync();

            var b2b = invoices.Where(i => !string.IsNullOrWhiteSpace(i.Customer?.GSTNumber) || i.TotalAmount > 250000).ToList();
            var b2c = invoices.Except(b2b).ToList();

            var hsnMap = invoices.SelectMany(i => i.Items ?? new List<SalesInvoiceItem>())
                .GroupBy(it => !string.IsNullOrWhiteSpace(it.Item?.HSNCode) ? it.Item.HSNCode : "998313")
                .Select(g => new
                {
                    hsnCode = g.Key,
                    description = g.First().Description ?? g.First().Item?.ItemName ?? "General Goods/Services",
                    totalQuantity = g.Sum(x => x.Quantity),
                    taxableValue = g.Sum(x => x.UnitPrice * x.Quantity - x.DiscountAmount),
                    cgst = g.Sum(x => x.TaxAmount / 2),
                    sgst = g.Sum(x => x.TaxAmount / 2),
                    igst = 0m,
                    totalTax = g.Sum(x => x.TaxAmount),
                    totalValue = g.Sum(x => x.TotalAmount)
                }).ToList();

            return Ok(new
            {
                period = $"{y:0000}-{m:00}",
                invoiceCount = invoices.Count,
                taxable = invoices.Sum(i => i.SubTotal),
                cgst = invoices.Sum(i => i.CgstAmount),
                sgst = invoices.Sum(i => i.SgstAmount),
                igst = invoices.Sum(i => i.IgstAmount),
                totalTax = invoices.Sum(i => i.TaxAmount),
                invoiceValue = invoices.Sum(i => i.TotalAmount),
                b2bCount = b2b.Count,
                b2bTaxable = b2b.Sum(i => i.SubTotal),
                b2bTax = b2b.Sum(i => i.TaxAmount),
                b2cCount = b2c.Count,
                b2cTaxable = b2c.Sum(i => i.SubTotal),
                b2cTax = b2c.Sum(i => i.TaxAmount),
                hsnSummary = hsnMap,
                invoices = invoices.Select(i => new
                {
                    i.InvoiceNumber,
                    i.InvoiceDate,
                    i.SubTotal,
                    i.CgstAmount,
                    i.SgstAmount,
                    i.IgstAmount,
                    i.TaxAmount,
                    i.TotalAmount,
                    i.IsInterState,
                    i.PlaceOfSupply,
                    billingGstin = i.Customer?.GSTNumber,
                    isB2B = !string.IsNullOrWhiteSpace(i.Customer?.GSTNumber)
                })
            });
        }

        [HttpGet("gst/gstr3b")]
        public async Task<IActionResult> Gstr3b([FromQuery] int? year = null, [FromQuery] int? month = null)
        {
            var y = year ?? DateTime.UtcNow.Year;
            var m = month ?? DateTime.UtcNow.Month;
            var start = new DateTime(y, m, 1, 0, 0, 0, DateTimeKind.Utc);
            var end = start.AddMonths(1);

            var sales = await _db.SalesInvoices.AsNoTracking()
                .Where(i => !i.IsDeleted && i.InvoiceDate >= start && i.InvoiceDate < end && i.Status != "Cancelled")
                .ToListAsync();

            var purchases = await _db.PurchaseInvoices.AsNoTracking()
                .Where(p => !p.IsDeleted && p.InvoiceDate >= start && p.InvoiceDate < end && p.Status != "Cancelled")
                .ToListAsync();

            var outwardTaxable = sales.Sum(i => i.SubTotal);
            var outwardCgst = sales.Sum(i => i.CgstAmount);
            var outwardSgst = sales.Sum(i => i.SgstAmount);
            var outwardIgst = sales.Sum(i => i.IgstAmount);
            var outwardTax = sales.Sum(i => i.TaxAmount);

            var itcTaxable = purchases.Sum(p => p.SubTotal);
            var itcTax = purchases.Sum(p => p.TaxAmount);
            var itcCgst = itcTax / 2;
            var itcSgst = itcTax / 2;
            var itcIgst = 0m;

            var netCgst = Math.Max(0, outwardCgst - itcCgst);
            var netSgst = Math.Max(0, outwardSgst - itcSgst);
            var netIgst = Math.Max(0, outwardIgst - itcIgst);
            var netTaxPayable = netCgst + netSgst + netIgst;

            return Ok(new
            {
                period = $"{y:0000}-{m:00}",
                outwardSupplies = new
                {
                    taxableValue = outwardTaxable,
                    cgst = outwardCgst,
                    sgst = outwardSgst,
                    igst = outwardIgst,
                    totalTax = outwardTax
                },
                eligibleItc = new
                {
                    taxableValue = itcTaxable,
                    cgst = itcCgst,
                    sgst = itcSgst,
                    igst = itcIgst,
                    totalTax = itcTax
                },
                netTaxPayable = new
                {
                    cgst = netCgst,
                    sgst = netSgst,
                    igst = netIgst,
                    total = netTaxPayable
                }
            });
        }

        [HttpGet("gst/summary")]
        public async Task<IActionResult> Summary()
        {
            var invoices = await _db.SalesInvoices.AsNoTracking().Where(i => !i.IsDeleted && i.Status != "Cancelled").ToListAsync();
            return Ok(new
            {
                invoiceCount = invoices.Count,
                outputCgst = invoices.Sum(i => i.CgstAmount),
                outputSgst = invoices.Sum(i => i.SgstAmount),
                outputIgst = invoices.Sum(i => i.IgstAmount),
                outputTax = invoices.Sum(i => i.TaxAmount)
            });
        }
    }
}
