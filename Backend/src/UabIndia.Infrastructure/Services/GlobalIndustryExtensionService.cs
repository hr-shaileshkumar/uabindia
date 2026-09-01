using System;
using System.Collections.Generic;
using System.Linq;
using UabIndia.Application.Interfaces;

namespace UabIndia.Infrastructure.Services
{
    public class GlobalIndustryExtensionService : IIndustryExtensionService
    {
        private static readonly Dictionary<string, IndustryExtensionManifest> Manifests = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Generic"] = new IndustryExtensionManifest
            {
                Code = "Generic",
                Name = "Standard Enterprise ERP",
                Icon = "Briefcase",
                Description = "Universal corporate ERP for trading, IT, technology, holding companies, and consulting.",
                ExtendedModules = new List<string> { "HRMS", "Payroll", "Finance", "Procurement", "Inventory", "Projects", "CRM", "Assets", "Helpdesk" },
                CustomEntityNames = new List<string> { "BusinessUnits", "CostCenters", "LegalEntities" }
            },
            ["Healthcare"] = new IndustryExtensionManifest
            {
                Code = "Healthcare",
                Name = "Healthcare & Hospital Management",
                Icon = "HeartPulse",
                Description = "Hospital administration, clinical inventory, patient billing, medical equipment assets.",
                ExtendedModules = new List<string> { "HRMS", "Payroll", "Finance", "Procurement", "Pharmacy Inventory", "Clinical Assets", "Doctor Scheduling" },
                CustomEntityNames = new List<string> { "Patients", "Prescriptions", "MedicalBeds", "Wards" }
            },
            ["Manufacturing"] = new IndustryExtensionManifest
            {
                Code = "Manufacturing",
                Name = "Manufacturing & Production Operations",
                Icon = "Factory",
                Description = "Bill of Materials (BOM), shop floor control, work orders, quality inspection, batch tracking.",
                ExtendedModules = new List<string> { "HRMS", "Payroll", "Finance", "Procurement", "Work Orders", "Bill of Materials", "Batch Inventory", "Quality Assurance" },
                CustomEntityNames = new List<string> { "BillOfMaterials", "WorkOrders", "Machines", "ShiftSchedules" }
            },
            ["Construction"] = new IndustryExtensionManifest
            {
                Code = "Construction",
                Name = "Construction & Infrastructure Projects",
                Icon = "HardHat",
                Description = "Job costing, contractor subcontractor management, heavy plant machinery, project milestone billing.",
                ExtendedModules = new List<string> { "HRMS", "Payroll", "Finance", "Procurement", "Site Inventory", "Subcontracts", "Plant Machinery" },
                CustomEntityNames = new List<string> { "WorkSites", "Subcontractors", "DailyProgressReports", "MaterialRequisitions" }
            },
            ["Retail"] = new IndustryExtensionManifest
            {
                Code = "Retail",
                Name = "Retail & Multi-Store Point of Sale",
                Icon = "Store",
                Description = "Multi-outlet POS, barcodes, promotional discount matrices, loyalty club management.",
                ExtendedModules = new List<string> { "HRMS", "Payroll", "Finance", "Procurement", "Store Inventory", "Point of Sale", "Loyalty Programs" },
                CustomEntityNames = new List<string> { "Outlets", "Barcodes", "PriceLists", "CashRegisters" }
            },
            ["Logistics"] = new IndustryExtensionManifest
            {
                Code = "Logistics",
                Name = "Logistics, Fleet & Supply Chain Distribution",
                Icon = "Truck",
                Description = "Fleet tracking, freight forwarding, consignment lifecycle, driver allocation.",
                ExtendedModules = new List<string> { "HRMS", "Payroll", "Finance", "Procurement", "Fleet Tracking", "Waybills", "Consignments" },
                CustomEntityNames = new List<string> { "Vehicles", "Drivers", "Routes", "Waybills" }
            },
            ["Veterinary"] = new IndustryExtensionManifest
            {
                Code = "Veterinary",
                Name = "Veterinary Services & Animal Husbandry Extension",
                Icon = "Activity",
                Description = "Veterinary clinical logs, mobile veterinary dispensaries (MVU), vaccination drives, camp telemetry.",
                ExtendedModules = new List<string> { "HRMS", "Payroll", "Finance", "Procurement", "Veterinary Clinics", "Mobile Treatment Units", "Vaccination Drives" },
                CustomEntityNames = new List<string> { "AnimalPatients", "VaccineDrives", "MobileDispensaries", "CaseHistories" }
            }
        };

        public IReadOnlyList<IndustryExtensionManifest> GetSupportedIndustries()
        {
            return Manifests.Values.ToList();
        }

        public IndustryExtensionManifest GetIndustryManifest(string code)
        {
            if (string.IsNullOrWhiteSpace(code)) return Manifests["Generic"];
            return Manifests.TryGetValue(code, out var manifest) ? manifest : Manifests["Generic"];
        }
    }
}
