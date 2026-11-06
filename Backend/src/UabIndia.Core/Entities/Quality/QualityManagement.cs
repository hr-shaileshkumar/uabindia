using System;
using System.Collections.Generic;

namespace UabIndia.Core.Entities
{
    // Inward, In-Process, and Pre-Dispatch Quality Inspection Lots
    public class QualityInspectionLot : BaseEntity
    {
        public Guid? CompanyId { get; set; }
        public Guid? ProjectId { get; set; }
        public string LotNumber { get; set; } = string.Empty;
        public string SourceType { get; set; } = "GRN"; // GRN (Inward), WorkOrder (In-Process), SalesReturn, PreDispatch
        public Guid? ReferenceId { get; set; }
        public string? ReferenceNumber { get; set; } // PO, GRN, Work Order No.
        public Guid ItemId { get; set; }
        public Item? Item { get; set; }
        public string? BatchNumber { get; set; }
        public decimal QuantityToInspect { get; set; }
        public decimal SampleQuantity { get; set; }
        public decimal PassedQuantity { get; set; }
        public decimal RejectedQuantity { get; set; }
        public string InspectionStatus { get; set; } = "Pending"; // Pending, InInspection, Passed, Rejected, ConditionallyPassed
        public string? InspectorName { get; set; }
        public DateTime InspectionDate { get; set; } = DateTime.UtcNow;
        public string? Remarks { get; set; }
        public string? CertificateOfAnalysisUrl { get; set; }

        public ICollection<QualityInspectionParameter> Parameters { get; set; } = new List<QualityInspectionParameter>();
        public ICollection<NonConformanceReport> NonConformanceReports { get; set; } = new List<NonConformanceReport>();
    }

    public class QualityInspectionParameter : BaseEntity
    {
        public Guid QualityInspectionLotId { get; set; }
        public QualityInspectionLot? QualityInspectionLot { get; set; }
        public string ParameterName { get; set; } = string.Empty; // e.g. "Tensile Strength", "Viscosity", "Dimension Outer Diameter"
        public string StandardSpecification { get; set; } = string.Empty; // e.g. "50mm +/- 0.05mm"
        public decimal? MinAcceptable { get; set; }
        public decimal? MaxAcceptable { get; set; }
        public decimal? ActualMeasurement { get; set; }
        public string UnitOfMeasure { get; set; } = "mm";
        public string Result { get; set; } = "Pass"; // Pass, Fail
        public string? Notes { get; set; }
    }

    // Non-Conformance Report (NCR) & CAPA (Corrective and Preventive Actions)
    public class NonConformanceReport : BaseEntity
    {
        public Guid? CompanyId { get; set; }
        public string NcrNumber { get; set; } = string.Empty;
        public Guid QualityInspectionLotId { get; set; }
        public QualityInspectionLot? QualityInspectionLot { get; set; }
        public string Severity { get; set; } = "Major"; // Minor, Major, Critical
        public string DefectCategory { get; set; } = "Dimensional"; // Dimensional, Chemical, Packaging, Functional
        public string DefectDescription { get; set; } = string.Empty;
        public string? RootCause { get; set; }
        public string? CorrectiveAction { get; set; }
        public string? PreventiveAction { get; set; }
        public string Disposition { get; set; } = "ReturnToVendor"; // Rework, Scrap, ReturnToVendor, ConcessionUseAsIs
        public string Status { get; set; } = "Open"; // Open, InReview, Implemented, Closed
        public DateTime? TargetClosureDate { get; set; }
        public DateTime? ClosedAt { get; set; }
        public string? ClosedBy { get; set; }
    }
}

