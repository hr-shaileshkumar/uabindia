using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace UabIndia.Application.Interfaces
{
    public class FleetVehicleDto
    {
        public Guid Id { get; set; }
        public string VehicleNumber { get; set; } = string.Empty;
        public string Make { get; set; } = string.Empty;
        public string Model { get; set; } = string.Empty;
        public int Year { get; set; }
        public string? Vin { get; set; }
        public Guid? AssetId { get; set; }
        public string Status { get; set; } = "Active";
        public string FuelType { get; set; } = "Diesel";
        public decimal CurrentOdometer { get; set; }
        public Guid? AssignedDriverId { get; set; }
        public string? AssignedDriverName { get; set; }
        public DateTime? InsuranceExpiryDate { get; set; }
        public DateTime? NextServiceDate { get; set; }
        public DateTime CreatedAt { get; set; }
        public int MaintenanceCount { get; set; }
        public decimal TotalFuelCost { get; set; }
    }

    public class CreateVehicleRequest
    {
        public string VehicleNumber { get; set; } = string.Empty;
        public string Make { get; set; } = string.Empty;
        public string Model { get; set; } = string.Empty;
        public int Year { get; set; } = DateTime.UtcNow.Year;
        public string? Vin { get; set; }
        public Guid? AssetId { get; set; }
        public string Status { get; set; } = "Active";
        public string FuelType { get; set; } = "Diesel";
        public decimal CurrentOdometer { get; set; }
        public Guid? AssignedDriverId { get; set; }
        public string? AssignedDriverName { get; set; }
        public DateTime? InsuranceExpiryDate { get; set; }
        public DateTime? NextServiceDate { get; set; }
    }

    public class UpdateVehicleRequest
    {
        public string? VehicleNumber { get; set; }
        public string? Make { get; set; }
        public string? Model { get; set; }
        public int? Year { get; set; }
        public string? Vin { get; set; }
        public string? Status { get; set; }
        public string? FuelType { get; set; }
        public decimal? CurrentOdometer { get; set; }
        public Guid? AssignedDriverId { get; set; }
        public string? AssignedDriverName { get; set; }
        public DateTime? InsuranceExpiryDate { get; set; }
        public DateTime? NextServiceDate { get; set; }
    }

    public class FleetMaintenanceDto
    {
        public Guid Id { get; set; }
        public Guid VehicleId { get; set; }
        public string VehicleNumber { get; set; } = string.Empty;
        public DateTime ServiceDate { get; set; }
        public string ServiceType { get; set; } = "Routine";
        public decimal Odometer { get; set; }
        public decimal Cost { get; set; }
        public string? VendorName { get; set; }
        public string? Notes { get; set; }
        public string Status { get; set; } = "Completed";
        public DateTime CreatedAt { get; set; }
    }

    public class CreateMaintenanceRequest
    {
        public Guid VehicleId { get; set; }
        public DateTime ServiceDate { get; set; } = DateTime.UtcNow;
        public string ServiceType { get; set; } = "Routine";
        public decimal Odometer { get; set; }
        public decimal Cost { get; set; }
        public string? VendorName { get; set; }
        public string? Notes { get; set; }
        public string Status { get; set; } = "Completed";
    }

    public class FleetFuelLogDto
    {
        public Guid Id { get; set; }
        public Guid VehicleId { get; set; }
        public string VehicleNumber { get; set; } = string.Empty;
        public DateTime LogDate { get; set; }
        public decimal Odometer { get; set; }
        public decimal Liters { get; set; }
        public decimal TotalCost { get; set; }
        public string? FuelStation { get; set; }
        public string? ReceiptNumber { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class CreateFuelLogRequest
    {
        public Guid VehicleId { get; set; }
        public DateTime LogDate { get; set; } = DateTime.UtcNow;
        public decimal Odometer { get; set; }
        public decimal Liters { get; set; }
        public decimal TotalCost { get; set; }
        public string? FuelStation { get; set; }
        public string? ReceiptNumber { get; set; }
    }

    public class FleetKpisDto
    {
        public int TotalVehicles { get; set; }
        public int ActiveVehicles { get; set; }
        public int InMaintenance { get; set; }
        public decimal TotalFuelCostMonth { get; set; }
        public decimal TotalMaintenanceCostMonth { get; set; }
    }

    public interface IFleetService
    {
        Task<IReadOnlyList<FleetVehicleDto>> GetVehiclesAsync(Guid tenantId, string? status = null, CancellationToken ct = default);
        Task<FleetVehicleDto?> GetVehicleByIdAsync(Guid tenantId, Guid id, CancellationToken ct = default);
        Task<FleetVehicleDto> CreateVehicleAsync(Guid tenantId, CreateVehicleRequest req, CancellationToken ct = default);
        Task<FleetVehicleDto?> UpdateVehicleAsync(Guid tenantId, Guid id, UpdateVehicleRequest req, CancellationToken ct = default);
        Task<bool> DeleteVehicleAsync(Guid tenantId, Guid id, CancellationToken ct = default);
        Task<IReadOnlyList<FleetMaintenanceDto>> GetMaintenancesAsync(Guid tenantId, Guid? vehicleId = null, CancellationToken ct = default);
        Task<FleetMaintenanceDto> CreateMaintenanceAsync(Guid tenantId, CreateMaintenanceRequest req, CancellationToken ct = default);
        Task<IReadOnlyList<FleetFuelLogDto>> GetFuelLogsAsync(Guid tenantId, Guid? vehicleId = null, CancellationToken ct = default);
        Task<FleetFuelLogDto> CreateFuelLogAsync(Guid tenantId, CreateFuelLogRequest req, CancellationToken ct = default);
        Task<FleetKpisDto> GetFleetKpisAsync(Guid tenantId, CancellationToken ct = default);
    }
}
