using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Api.Modules.Manufacturing.Controllers
{
    [ApiController]
    [Route("api/v1/manufacturing/subcontracting")]
    [Authorize]
    public class SubcontractingController : ControllerBase
    {
        private readonly ApplicationDbContext _db;

        public SubcontractingController(ApplicationDbContext db)
        {
            _db = db;
        }

        [HttpGet]
        public async Task<IActionResult> GetOrders([FromQuery] string? status = null)
        {
            var query = _db.SubcontractOrders.AsNoTracking()
                .Include(s => s.Vendor)
                .Include(s => s.IssuedItems).ThenInclude(i => i.RawMaterialItem)
                .Include(s => s.ReceivedItems).ThenInclude(r => r.ProcessedItem)
                .Where(s => !s.IsDeleted);

            if (!string.IsNullOrWhiteSpace(status))
                query = query.Where(s => s.Status == status);

            var orders = await query.OrderByDescending(s => s.ChallanDate).Select(s => new
            {
                s.Id,
                s.OrderNumber,
                s.DeliveryChallanNumber,
                s.ChallanDate,
                JobWorkerName = s.Vendor != null ? s.Vendor.VendorName : "Unknown Job Worker",
                JobWorkerGstin = s.Vendor != null ? s.Vendor.GSTNumber : "-",
                s.ProcessDescription,
                s.ExpectedReturnDate,
                DaysUntilOverdue = (int)Math.Ceiling((s.ExpectedReturnDate - DateTime.UtcNow).TotalDays),
                s.TotalRawMaterialValue,
                s.AgreedServiceRate,
                s.ServiceTaxAmount,
                s.TotalServiceAmount,
                s.Status,
                IssuedItemsCount = s.IssuedItems.Count,
                ReceivedItemsCount = s.ReceivedItems.Count
            }).ToListAsync();

            return Ok(new { success = true, items = orders });
        }

        public class IssueChallanRequest
        {
            public Guid VendorId { get; set; }
            public string ProcessDescription { get; set; } = string.Empty;
            public decimal AgreedServiceRate { get; set; }
            public decimal ServiceGstRate { get; set; } = 18;
            public List<ChallanRawMaterialItem> Materials { get; set; } = new List<ChallanRawMaterialItem>();
        }

        public class ChallanRawMaterialItem
        {
            public Guid ItemId { get; set; }
            public decimal Quantity { get; set; }
            public string Uom { get; set; } = "Nos";
            public decimal EstimatedUnitValue { get; set; }
            public string? BatchNumber { get; set; }
        }

        [HttpPost("issue-challan")]
        public async Task<IActionResult> IssueDeliveryChallan([FromBody] IssueChallanRequest req)
        {
            var vendor = await _db.Vendors.FindAsync(req.VendorId);
            if (vendor == null) return NotFound(new { success = false, message = "Job Worker (Vendor) not found." });

            var totalMatValue = req.Materials.Sum(m => m.Quantity * m.EstimatedUnitValue);
            var serviceTax = Math.Round(req.AgreedServiceRate * (req.ServiceGstRate / 100m), 2);

            var order = new SubcontractOrder
            {
                OrderNumber = $"SCO-{DateTime.UtcNow:yyyyMMdd}-{new Random().Next(100, 999)}",
                DeliveryChallanNumber = $"CHL-RULE55-{DateTime.UtcNow:yyyyMMdd}-{new Random().Next(1000, 9999)}",
                ChallanDate = DateTime.UtcNow,
                VendorId = req.VendorId,
                ProcessDescription = req.ProcessDescription,
                ExpectedReturnDate = DateTime.UtcNow.AddDays(180), // GST 180 days tracking
                TotalRawMaterialValue = totalMatValue,
                AgreedServiceRate = req.AgreedServiceRate,
                ServiceTaxAmount = serviceTax,
                TotalServiceAmount = req.AgreedServiceRate + serviceTax,
                Status = "ChallanIssued"
            };

            foreach (var m in req.Materials)
            {
                order.IssuedItems.Add(new SubcontractItemIssued
                {
                    RawMaterialItemId = m.ItemId,
                    Quantity = m.Quantity,
                    UnitOfMeasure = m.Uom,
                    EstimatedUnitValue = m.EstimatedUnitValue,
                    TotalValue = m.Quantity * m.EstimatedUnitValue,
                    BatchNumber = m.BatchNumber
                });

                // Deduct stock movement for Out to Job Worker
                _db.StockMovements.Add(new StockMovement
                {
                    MovementNumber = $"MOV-JW-{DateTime.UtcNow:yyyyMMddHHmmss}",
                    MovementDate = DateTime.UtcNow,
                    MovementType = "Out",
                    ItemId = m.ItemId,
                    Quantity = m.Quantity,
                    UnitPrice = m.EstimatedUnitValue,
                    TotalValue = m.Quantity * m.EstimatedUnitValue,
                    ReferenceType = "JobWorkChallan",
                    ReferenceNumber = order.DeliveryChallanNumber,
                    BatchNumber = m.BatchNumber,
                    Remarks = $"Sent for {req.ProcessDescription} to {vendor.VendorName} under GST Rule 55."
                });
            }

            _db.SubcontractOrders.Add(order);
            await _db.SaveChangesAsync();

            return Ok(new
            {
                success = true,
                message = "GST Rule 55 Job Work Delivery Challan issued successfully.",
                challanNumber = order.DeliveryChallanNumber,
                orderId = order.Id
            });
        }
    }
}

