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
    public class FieldServiceDispatchService : IFieldServiceDispatchService
    {
        private readonly ApplicationDbContext _db;
        private readonly IDocumentSequenceService _sequenceService;

        public FieldServiceDispatchService(ApplicationDbContext db, IDocumentSequenceService sequenceService)
        {
            _db = db;
            _sequenceService = sequenceService;
        }

        public async Task<IReadOnlyList<ServiceTicketDto>> GetServiceTicketsAsync(
            Guid tenantId,
            string? status = null,
            CancellationToken ct = default)
        {
            await EnsureSeededTicketsAsync(tenantId, ct);

            var query = _db.FieldServiceTickets
                .Where(t => t.TenantId == tenantId && !t.IsDeleted);

            if (!string.IsNullOrWhiteSpace(status))
            {
                query = query.Where(t => t.Status == status);
            }

            var tickets = await query.OrderByDescending(t => t.ScheduledDate).ToListAsync(ct);
            return tickets.Select(MapToDto).ToList();
        }

        public async Task<ServiceTicketDto> CreateServiceTicketAsync(
            Guid tenantId,
            ServiceTicketDto dto,
            CancellationToken ct = default)
        {
            var ticketNumber = await _sequenceService.GetNextSequenceNumberAsync(tenantId, "ServiceTicket", "SRV", ct);

            var ticket = new FieldServiceTicket
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                TicketNumber = ticketNumber,
                CustomerId = dto.CustomerId,
                CustomerName = dto.CustomerName,
                ServiceAddress = dto.ServiceAddress,
                Priority = !string.IsNullOrWhiteSpace(dto.Priority) ? dto.Priority : "High",
                Status = "Dispatched",
                ScheduledDate = dto.ScheduledDate != default ? dto.ScheduledDate : DateTime.UtcNow.AddDays(1),
                AssignedTechnicianName = dto.AssignedTechnicianName,
                AssignedTechnicianPhone = dto.AssignedTechnicianPhone,
                IssueDescription = dto.IssueDescription,
                CreatedAt = DateTime.UtcNow
            };

            _db.FieldServiceTickets.Add(ticket);
            await _db.SaveChangesAsync(ct);

            return MapToDto(ticket);
        }

        public async Task<ServiceTicketDto?> DispatchTechnicianAsync(
            Guid tenantId,
            DispatchTechnicianRequest req,
            CancellationToken ct = default)
        {
            var ticket = await _db.FieldServiceTickets
                .FirstOrDefaultAsync(t => t.Id == req.TicketId && t.TenantId == tenantId && !t.IsDeleted, ct);

            if (ticket == null) return null;

            ticket.AssignedTechnicianName = req.TechnicianName;
            ticket.AssignedTechnicianPhone = req.TechnicianPhone;
            ticket.ScheduledDate = req.ScheduledDate;
            ticket.Status = "EnRoute";
            ticket.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync(ct);
            return MapToDto(ticket);
        }

        public async Task<ServiceTicketDto?> CompleteServiceTicketAsync(
            Guid tenantId,
            CompleteServiceTicketRequest req,
            CancellationToken ct = default)
        {
            var ticket = await _db.FieldServiceTickets
                .FirstOrDefaultAsync(t => t.Id == req.TicketId && t.TenantId == tenantId && !t.IsDeleted, ct);

            if (ticket == null) return null;

            ticket.ResolutionNotes = req.ResolutionNotes;
            ticket.CustomerSignatureName = req.CustomerSignatureName;
            ticket.CompletedAt = DateTime.UtcNow;
            ticket.Status = "Completed";
            ticket.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync(ct);
            return MapToDto(ticket);
        }

        private async Task EnsureSeededTicketsAsync(Guid tenantId, CancellationToken ct)
        {
            var exists = await _db.FieldServiceTickets.AnyAsync(t => t.TenantId == tenantId && !t.IsDeleted, ct);
            if (exists) return;

            var t1 = new FieldServiceTicket
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                TicketNumber = "SRV-2026-0034",
                CustomerName = "Apex Global Logistics Hub A",
                ServiceAddress = "Industrial Park 4, Logistics Blvd, Gateway 2, Mumbai",
                Priority = "Critical",
                Status = "InProgress",
                ScheduledDate = DateTime.UtcNow,
                AssignedTechnicianName = "Vikram Sharma",
                AssignedTechnicianPhone = "+91 98201 44512",
                IssueDescription = "Hydraulic pressure loss on conveyor line 3. High vibration warning.",
                CreatedAt = DateTime.UtcNow.AddDays(-1)
            };

            var t2 = new FieldServiceTicket
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                TicketNumber = "SRV-2026-0029",
                CustomerName = "Precision Tooling Assembly Plant",
                ServiceAddress = "Sector 18, Phase II Industrial Area, Bengaluru",
                Priority = "Medium",
                Status = "Completed",
                ScheduledDate = DateTime.UtcNow.AddDays(-2),
                AssignedTechnicianName = "Marcus Vance",
                AssignedTechnicianPhone = "+91 97110 88231",
                IssueDescription = "Quarterly preventive maintenance and thermal imaging audit on motor stators.",
                ResolutionNotes = "Cleaned filter assemblies, calibrated rotor alignment, and renewed insulation bushings.",
                CustomerSignatureName = "Rajesh Mehta (Plant Operations Head)",
                CompletedAt = DateTime.UtcNow.AddDays(-2),
                CreatedAt = DateTime.UtcNow.AddDays(-3)
            };

            _db.FieldServiceTickets.AddRange(t1, t2);
            await _db.SaveChangesAsync(ct);
        }

        private static ServiceTicketDto MapToDto(FieldServiceTicket t)
        {
            return new ServiceTicketDto
            {
                Id = t.Id,
                TicketNumber = t.TicketNumber,
                CustomerId = t.CustomerId,
                CustomerName = t.CustomerName,
                ServiceAddress = t.ServiceAddress,
                Priority = t.Priority,
                Status = t.Status,
                ScheduledDate = t.ScheduledDate,
                AssignedTechnicianName = t.AssignedTechnicianName,
                AssignedTechnicianPhone = t.AssignedTechnicianPhone,
                IssueDescription = t.IssueDescription,
                ResolutionNotes = t.ResolutionNotes,
                CustomerSignatureName = t.CustomerSignatureName,
                CompletedAt = t.CompletedAt,
                PartsUsed = new List<ServicePartLineDto>()
            };
        }
    }
}
