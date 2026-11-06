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
    [Route("api/v1/quality")]
    [Authorize]
    public class QualityManagementController : ControllerBase
    {
        private readonly ApplicationDbContext _db;

        public QualityManagementController(ApplicationDbContext db)
        {
            _db = db;
        }

        // ==================== INSPECTION LOTS ====================

        [HttpGet("inspection-lots")]
        public async Task<IActionResult> GetInspectionLots([FromQuery] string? status = null, [FromQuery] string? sourceType = null)
        {
            var query = _db.QualityInspectionLots.AsNoTracking()
                .Include(q => q.Item)
                .Include(q => q.Parameters)
                .Where(q => !q.IsDeleted);

            if (!string.IsNullOrWhiteSpace(status))
                query = query.Where(q => q.InspectionStatus == status);

            if (!string.IsNullOrWhiteSpace(sourceType))
                query = query.Where(q => q.SourceType == sourceType);

            var lots = await query.OrderByDescending(q => q.InspectionDate).Take(100).Select(q => new
            {
                q.Id,
                q.LotNumber,
                q.SourceType,
                q.ReferenceNumber,
                ItemCode = q.Item != null ? q.Item.ItemCode : "-",
                ItemName = q.Item != null ? q.Item.ItemName : "Unspecified Component",
                q.BatchNumber,
                q.QuantityToInspect,
                q.SampleQuantity,
                q.PassedQuantity,
                q.RejectedQuantity,
                q.InspectionStatus,
                q.InspectorName,
                q.InspectionDate,
                q.Remarks,
                ParameterCount = q.Parameters.Count
            }).ToListAsync();

            return Ok(new { success = true, items = lots });
        }

        public class CreateInspectionLotRequest
        {
            public string SourceType { get; set; } = "GRN";
            public string ReferenceNumber { get; set; } = string.Empty;
            public Guid ItemId { get; set; }
            public string? BatchNumber { get; set; }
            public decimal QuantityToInspect { get; set; }
            public decimal SampleQuantity { get; set; } = 5;
            public List<InspectionParamInput>? Parameters { get; set; }
        }

        public class InspectionParamInput
        {
            public string ParameterName { get; set; } = string.Empty;
            public string Specification { get; set; } = string.Empty;
            public decimal? MinVal { get; set; }
            public decimal? MaxVal { get; set; }
            public string Uom { get; set; } = "mm";
        }

        [HttpPost("inspection-lots")]
        public async Task<IActionResult> CreateInspectionLot([FromBody] CreateInspectionLotRequest req)
        {
            var lot = new QualityInspectionLot
            {
                LotNumber = $"QC-{DateTime.UtcNow:yyyyMMdd}-{new Random().Next(1000, 9999)}",
                SourceType = req.SourceType,
                ReferenceNumber = req.ReferenceNumber,
                ItemId = req.ItemId,
                BatchNumber = req.BatchNumber,
                QuantityToInspect = req.QuantityToInspect,
                SampleQuantity = req.SampleQuantity,
                InspectionStatus = "Pending",
                InspectionDate = DateTime.UtcNow
            };

            if (req.Parameters != null)
            {
                foreach (var p in req.Parameters)
                {
                    lot.Parameters.Add(new QualityInspectionParameter
                    {
                        ParameterName = p.ParameterName,
                        StandardSpecification = p.Specification,
                        MinAcceptable = p.MinVal,
                        MaxAcceptable = p.MaxVal,
                        UnitOfMeasure = p.Uom,
                        Result = "Pending"
                    });
                }
            }

            _db.QualityInspectionLots.Add(lot);
            await _db.SaveChangesAsync();

            return Ok(new { success = true, message = "Inspection lot created.", lotId = lot.Id, lotNumber = lot.LotNumber });
        }

        public class RecordInspectionDecisionRequest
        {
            public decimal PassedQty { get; set; }
            public decimal RejectedQty { get; set; }
            public string Decision { get; set; } = "Passed"; // Passed, Rejected, ConditionallyPassed
            public string InspectorName { get; set; } = "Quality Officer";
            public string? Remarks { get; set; }
        }

        [HttpPost("inspection-lots/{id:guid}/record-decision")]
        public async Task<IActionResult> RecordDecision(Guid id, [FromBody] RecordInspectionDecisionRequest req)
        {
            var lot = await _db.QualityInspectionLots.Include(q => q.Parameters).FirstOrDefaultAsync(q => q.Id == id);
            if (lot == null) return NotFound(new { success = false, message = "Lot not found." });

            lot.PassedQuantity = req.PassedQty;
            lot.RejectedQuantity = req.RejectedQty;
            lot.InspectionStatus = req.Decision;
            lot.InspectorName = req.InspectorName;
            lot.Remarks = req.Remarks;
            lot.CertificateOfAnalysisUrl = $"/reports/coa/{lot.LotNumber}.pdf";

            await _db.SaveChangesAsync();

            return Ok(new { success = true, message = $"QC Decision recorded as {req.Decision}." });
        }

        // ==================== NON-CONFORMANCE REPORTS (NCR) & CAPA ====================

        [HttpGet("ncr")]
        public async Task<IActionResult> GetNcrs()
        {
            var ncrs = await _db.NonConformanceReports.AsNoTracking()
                .Include(n => n.QualityInspectionLot)
                .Where(n => !n.IsDeleted)
                .OrderByDescending(n => n.CreatedAt)
                .Select(n => new
                {
                    n.Id,
                    n.NcrNumber,
                    LotNumber = n.QualityInspectionLot != null ? n.QualityInspectionLot.LotNumber : "-",
                    n.Severity,
                    n.DefectCategory,
                    n.DefectDescription,
                    n.RootCause,
                    n.CorrectiveAction,
                    n.PreventiveAction,
                    n.Disposition,
                    n.Status,
                    n.TargetClosureDate
                }).ToListAsync();

            return Ok(new { success = true, items = ncrs });
        }
    }
}

