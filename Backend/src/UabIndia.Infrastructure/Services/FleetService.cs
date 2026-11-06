using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Infrastructure.Services
{
    public class FleetService : IFleetService
    {
        private readonly ApplicationDbContext _db;

        public FleetService(ApplicationDbContext db)
        {
            _db = db;
        }

        public async Task<IReadOnlyList<FleetVehicleDto>> GetVehiclesAsync(Guid tenantId, string? status = null, CancellationToken ct = default)
        {
            await EnsureSeededSampleVehiclesAsync(tenantId, ct);

            var query = _db.FleetVehicles
                .Include(v => v.Maintenances)
                .Include(v => v.FuelLogs)
                .Where(v => v.TenantId == tenantId && !v.IsDeleted);

            if (!string.IsNullOrWhiteSpace(status))
            {
                query = query.Where(v => v.Status == status);
            }

            var entities = await query.OrderByDescending(v => v.CreatedAt).ToListAsync(ct);
            return entities.Select(MapToVehicleDto).ToList();
        }

        public async Task<FleetVehicleDto?> GetVehicleByIdAsync(Guid tenantId, Guid id, CancellationToken ct = default)
        {
            var vehicle = await _db.FleetVehicles
                .Include(v => v.Maintenances)
                .Include(v => v.FuelLogs)
                .FirstOrDefaultAsync(v => v.Id == id && v.TenantId == tenantId && !v.IsDeleted, ct);

            return vehicle != null ? MapToVehicleDto(vehicle) : null;
        }

        public async Task<FleetVehicleDto> CreateVehicleAsync(Guid tenantId, CreateVehicleRequest req, CancellationToken ct = default)
        {
            var vehicle = new FleetVehicle
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                VehicleNumber = req.VehicleNumber.Trim().ToUpperInvariant(),
                Make = req.Make,
                Model = req.Model,
                Year = req.Year > 1900 ? req.Year : DateTime.UtcNow.Year,
                Vin = req.Vin,
                AssetId = req.AssetId,
                Status = !string.IsNullOrWhiteSpace(req.Status) ? req.Status : "Active",
                FuelType = !string.IsNullOrWhiteSpace(req.FuelType) ? req.FuelType : "Diesel",
                CurrentOdometer = req.CurrentOdometer,
                AssignedDriverId = req.AssignedDriverId,
                AssignedDriverName = req.AssignedDriverName,
                InsuranceExpiryDate = req.InsuranceExpiryDate,
                NextServiceDate = req.NextServiceDate,
                CreatedAt = DateTime.UtcNow
            };

            _db.FleetVehicles.Add(vehicle);
            await _db.SaveChangesAsync(ct);

            return MapToVehicleDto(vehicle);
        }

        public async Task<FleetVehicleDto?> UpdateVehicleAsync(Guid tenantId, Guid id, UpdateVehicleRequest req, CancellationToken ct = default)
        {
            var vehicle = await _db.FleetVehicles
                .Include(v => v.Maintenances)
                .Include(v => v.FuelLogs)
                .FirstOrDefaultAsync(v => v.Id == id && v.TenantId == tenantId && !v.IsDeleted, ct);

            if (vehicle == null) return null;

            if (!string.IsNullOrWhiteSpace(req.VehicleNumber)) vehicle.VehicleNumber = req.VehicleNumber.Trim().ToUpperInvariant();
            if (!string.IsNullOrWhiteSpace(req.Make)) vehicle.Make = req.Make;
            if (!string.IsNullOrWhiteSpace(req.Model)) vehicle.Model = req.Model;
            if (req.Year.HasValue && req.Year.Value > 1900) vehicle.Year = req.Year.Value;
            if (req.Vin != null) vehicle.Vin = req.Vin;
            if (!string.IsNullOrWhiteSpace(req.Status)) vehicle.Status = req.Status;
            if (!string.IsNullOrWhiteSpace(req.FuelType)) vehicle.FuelType = req.FuelType;
            if (req.CurrentOdometer.HasValue) vehicle.CurrentOdometer = req.CurrentOdometer.Value;
            if (req.AssignedDriverId.HasValue) vehicle.AssignedDriverId = req.AssignedDriverId.Value;
            if (req.AssignedDriverName != null) vehicle.AssignedDriverName = req.AssignedDriverName;
            if (req.InsuranceExpiryDate.HasValue) vehicle.InsuranceExpiryDate = req.InsuranceExpiryDate.Value;
            if (req.NextServiceDate.HasValue) vehicle.NextServiceDate = req.NextServiceDate.Value;

            vehicle.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);

            return MapToVehicleDto(vehicle);
        }

        public async Task<bool> DeleteVehicleAsync(Guid tenantId, Guid id, CancellationToken ct = default)
        {
            var vehicle = await _db.FleetVehicles
                .FirstOrDefaultAsync(v => v.Id == id && v.TenantId == tenantId && !v.IsDeleted, ct);

            if (vehicle == null) return false;

            vehicle.IsDeleted = true;
            vehicle.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);

            return true;
        }

        public async Task<IReadOnlyList<FleetMaintenanceDto>> GetMaintenancesAsync(Guid tenantId, Guid? vehicleId = null, CancellationToken ct = default)
        {
            var query = _db.FleetMaintenances
                .Include(m => m.Vehicle)
                .Where(m => m.TenantId == tenantId && !m.IsDeleted);

            if (vehicleId.HasValue && vehicleId.Value != Guid.Empty)
            {
                query = query.Where(m => m.VehicleId == vehicleId.Value);
            }

            var list = await query.OrderByDescending(m => m.ServiceDate).ToListAsync(ct);
            return list.Select(m => new FleetMaintenanceDto
            {
                Id = m.Id,
                VehicleId = m.VehicleId,
                VehicleNumber = m.Vehicle?.VehicleNumber ?? "N/A",
                ServiceDate = m.ServiceDate,
                ServiceType = m.ServiceType,
                Odometer = m.Odometer,
                Cost = m.Cost,
                VendorName = m.VendorName,
                Notes = m.Notes,
                Status = m.Status,
                CreatedAt = m.CreatedAt
            }).ToList();
        }

        public async Task<FleetMaintenanceDto> CreateMaintenanceAsync(Guid tenantId, CreateMaintenanceRequest req, CancellationToken ct = default)
        {
            var vehicle = await _db.FleetVehicles.FirstOrDefaultAsync(v => v.Id == req.VehicleId && v.TenantId == tenantId, ct);

            var maintenance = new FleetMaintenance
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                VehicleId = req.VehicleId,
                ServiceDate = req.ServiceDate,
                ServiceType = req.ServiceType,
                Odometer = req.Odometer,
                Cost = req.Cost,
                VendorName = req.VendorName,
                Notes = req.Notes,
                Status = req.Status,
                CreatedAt = DateTime.UtcNow
            };

            _db.FleetMaintenances.Add(maintenance);

            if (vehicle != null && req.Odometer > vehicle.CurrentOdometer)
            {
                vehicle.CurrentOdometer = req.Odometer;
                vehicle.UpdatedAt = DateTime.UtcNow;
            }

            await _db.SaveChangesAsync(ct);

            return new FleetMaintenanceDto
            {
                Id = maintenance.Id,
                VehicleId = maintenance.VehicleId,
                VehicleNumber = vehicle?.VehicleNumber ?? "N/A",
                ServiceDate = maintenance.ServiceDate,
                ServiceType = maintenance.ServiceType,
                Odometer = maintenance.Odometer,
                Cost = maintenance.Cost,
                VendorName = maintenance.VendorName,
                Notes = maintenance.Notes,
                Status = maintenance.Status,
                CreatedAt = maintenance.CreatedAt
            };
        }

        public async Task<IReadOnlyList<FleetFuelLogDto>> GetFuelLogsAsync(Guid tenantId, Guid? vehicleId = null, CancellationToken ct = default)
        {
            var query = _db.FleetFuelLogs
                .Include(f => f.Vehicle)
                .Where(f => f.TenantId == tenantId && !f.IsDeleted);

            if (vehicleId.HasValue && vehicleId.Value != Guid.Empty)
            {
                query = query.Where(f => f.VehicleId == vehicleId.Value);
            }

            var list = await query.OrderByDescending(f => f.LogDate).ToListAsync(ct);
            return list.Select(f => new FleetFuelLogDto
            {
                Id = f.Id,
                VehicleId = f.VehicleId,
                VehicleNumber = f.Vehicle?.VehicleNumber ?? "N/A",
                LogDate = f.LogDate,
                Odometer = f.Odometer,
                Liters = f.Liters,
                TotalCost = f.TotalCost,
                FuelStation = f.FuelStation,
                ReceiptNumber = f.ReceiptNumber,
                CreatedAt = f.CreatedAt
            }).ToList();
        }

        public async Task<FleetFuelLogDto> CreateFuelLogAsync(Guid tenantId, CreateFuelLogRequest req, CancellationToken ct = default)
        {
            var vehicle = await _db.FleetVehicles.FirstOrDefaultAsync(v => v.Id == req.VehicleId && v.TenantId == tenantId, ct);

            var log = new FleetFuelLog
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                VehicleId = req.VehicleId,
                LogDate = req.LogDate,
                Odometer = req.Odometer,
                Liters = req.Liters,
                TotalCost = req.TotalCost,
                FuelStation = req.FuelStation,
                ReceiptNumber = req.ReceiptNumber,
                CreatedAt = DateTime.UtcNow
            };

            _db.FleetFuelLogs.Add(log);

            if (vehicle != null && req.Odometer > vehicle.CurrentOdometer)
            {
                vehicle.CurrentOdometer = req.Odometer;
                vehicle.UpdatedAt = DateTime.UtcNow;
            }

            await _db.SaveChangesAsync(ct);

            return new FleetFuelLogDto
            {
                Id = log.Id,
                VehicleId = log.VehicleId,
                VehicleNumber = vehicle?.VehicleNumber ?? "N/A",
                LogDate = log.LogDate,
                Odometer = log.Odometer,
                Liters = log.Liters,
                TotalCost = log.TotalCost,
                FuelStation = log.FuelStation,
                ReceiptNumber = log.ReceiptNumber,
                CreatedAt = log.CreatedAt
            };
        }

        public async Task<FleetKpisDto> GetFleetKpisAsync(Guid tenantId, CancellationToken ct = default)
        {
            await EnsureSeededSampleVehiclesAsync(tenantId, ct);

            var vehicles = await _db.FleetVehicles
                .Where(v => v.TenantId == tenantId && !v.IsDeleted)
                .ToListAsync(ct);

            var monthStart = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1);

            var fuelCostMonth = await _db.FleetFuelLogs
                .Where(f => f.TenantId == tenantId && !f.IsDeleted && f.LogDate >= monthStart)
                .SumAsync(f => f.TotalCost, ct);

            var maintCostMonth = await _db.FleetMaintenances
                .Where(m => m.TenantId == tenantId && !m.IsDeleted && m.ServiceDate >= monthStart)
                .SumAsync(m => m.Cost, ct);

            return new FleetKpisDto
            {
                TotalVehicles = vehicles.Count,
                ActiveVehicles = vehicles.Count(v => v.Status == "Active"),
                InMaintenance = vehicles.Count(v => v.Status == "InMaintenance"),
                TotalFuelCostMonth = fuelCostMonth,
                TotalMaintenanceCostMonth = maintCostMonth
            };
        }

        private async Task EnsureSeededSampleVehiclesAsync(Guid tenantId, CancellationToken ct)
        {
            var exists = await _db.FleetVehicles.AnyAsync(v => v.TenantId == tenantId && !v.IsDeleted, ct);
            if (exists) return;

            var v1 = new FleetVehicle
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                VehicleNumber = "DL-01-AX-9942",
                Make = "Tata Motors",
                Model = "Prima 4928.S (Heavy Haulage)",
                Year = 2024,
                Vin = "MAT612948N012847",
                Status = "Active",
                FuelType = "Diesel",
                CurrentOdometer = 42850m,
                AssignedDriverName = "Rajesh Sharma",
                InsuranceExpiryDate = DateTime.UtcNow.AddMonths(8),
                NextServiceDate = DateTime.UtcNow.AddDays(25),
                CreatedAt = DateTime.UtcNow.AddMonths(-6)
            };

            var v2 = new FleetVehicle
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                VehicleNumber = "MH-04-EK-3120",
                Make = "Mahindra",
                Model = "Bolero Maxi Truck Plus",
                Year = 2025,
                Vin = "MA1MB8940P991823",
                Status = "Active",
                FuelType = "Diesel",
                CurrentOdometer = 18400m,
                AssignedDriverName = "Sunil Verma",
                InsuranceExpiryDate = DateTime.UtcNow.AddMonths(11),
                NextServiceDate = DateTime.UtcNow.AddDays(45),
                CreatedAt = DateTime.UtcNow.AddMonths(-4)
            };

            var v3 = new FleetVehicle
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                VehicleNumber = "KA-05-MQ-7801",
                Make = "Eicher",
                Model = "Pro 3019 Container",
                Year = 2023,
                Vin = "ME4PR03019M772189",
                Status = "InMaintenance",
                FuelType = "Diesel",
                CurrentOdometer = 68900m,
                AssignedDriverName = "Vikas Gowda",
                InsuranceExpiryDate = DateTime.UtcNow.AddMonths(4),
                NextServiceDate = DateTime.UtcNow.AddDays(-2),
                CreatedAt = DateTime.UtcNow.AddMonths(-8)
            };

            _db.FleetVehicles.AddRange(v1, v2, v3);

            _db.FleetMaintenances.Add(new FleetMaintenance
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                VehicleId = v3.Id,
                ServiceDate = DateTime.UtcNow.AddDays(-2),
                ServiceType = "Major",
                Odometer = 68900m,
                Cost = 14500m,
                VendorName = "Eicher Authorized Commercial Hub",
                Notes = "Brake pad replacement and hydraulic fluid flush.",
                Status = "InProgress",
                CreatedAt = DateTime.UtcNow.AddDays(-2)
            });

            _db.FleetFuelLogs.Add(new FleetFuelLog
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                VehicleId = v1.Id,
                LogDate = DateTime.UtcNow.AddDays(-3),
                Odometer = 42500m,
                Liters = 120m,
                TotalCost = 10800m,
                FuelStation = "Indian Oil Highway Hub #4",
                ReceiptNumber = "IOC-882910",
                CreatedAt = DateTime.UtcNow.AddDays(-3)
            });

            await _db.SaveChangesAsync(ct);
        }

        private static FleetVehicleDto MapToVehicleDto(FleetVehicle v)
        {
            return new FleetVehicleDto
            {
                Id = v.Id,
                VehicleNumber = v.VehicleNumber,
                Make = v.Make,
                Model = v.Model,
                Year = v.Year,
                Vin = v.Vin,
                AssetId = v.AssetId,
                Status = v.Status,
                FuelType = v.FuelType,
                CurrentOdometer = v.CurrentOdometer,
                AssignedDriverId = v.AssignedDriverId,
                AssignedDriverName = v.AssignedDriverName,
                InsuranceExpiryDate = v.InsuranceExpiryDate,
                NextServiceDate = v.NextServiceDate,
                CreatedAt = v.CreatedAt,
                MaintenanceCount = v.Maintenances?.Count ?? 0,
                TotalFuelCost = v.FuelLogs?.Sum(f => f.TotalCost) ?? 0
            };
        }
    }
}
