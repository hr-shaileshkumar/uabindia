using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using UabIndia.Application.Interfaces;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Infrastructure.Services
{
    public class FieldServiceDispatchService : IFieldServiceDispatchService
    {
        private readonly ApplicationDbContext _db;
        private readonly IDocumentSequenceService _sequenceService;

        // In-memory thread-safe state container for field service work order dispatches (isolated per tenant)
        private static readonly ConcurrentDictionary<Guid, List<ServiceTicketDto>> _tenantTickets = new();

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
            EnsureSeededTickets(tenantId);

            if (_tenantTickets.TryGetValue(tenantId, out var tickets))
            {
                var query = tickets.AsEnumerable();
                if (!string.IsNullOrWhiteSpace(status))
                {
                    query = query.Where(t => t.Status.Equals(status, StringComparison.OrdinalIgnoreCase));
                }
                return await Task.FromResult(query.OrderByDescending(t => t.ScheduledDate).ToList());
            }

            return await Task.FromResult(new List<ServiceTicketDto>());
        }

        public async Task<ServiceTicketDto> CreateServiceTicketAsync(
            Guid tenantId,
            ServiceTicketDto dto,
            CancellationToken ct = default)
        {
            EnsureSeededTickets(tenantId);

            var ticketNumber = await _sequenceService.GetNextSequenceNumberAsync(tenantId, "ServiceTicket", "SRV", ct);
            dto.Id = Guid.NewGuid();
            dto.TicketNumber = ticketNumber;
            dto.Status = "Dispatched";

            var tickets = _tenantTickets.GetOrAdd(tenantId, _ => new List<ServiceTicketDto>());
            tickets.Insert(0, dto);

            return await Task.FromResult(dto);
        }

        public async Task<ServiceTicketDto?> DispatchTechnicianAsync(
            Guid tenantId,
            DispatchTechnicianRequest req,
            CancellationToken ct = default)
        {
            EnsureSeededTickets(tenantId);

            if (_tenantTickets.TryGetValue(tenantId, out var tickets))
            {
                var ticket = tickets.FirstOrDefault(t => t.Id == req.TicketId);
                if (ticket != null)
                {
                    ticket.AssignedTechnicianName = req.TechnicianName;
                    ticket.AssignedTechnicianPhone = req.TechnicianPhone;
                    ticket.ScheduledDate = req.ScheduledDate;
                    ticket.Status = "EnRoute";
                    return await Task.FromResult(ticket);
                }
            }

            return await Task.FromResult<ServiceTicketDto?>(null);
        }

        public async Task<ServiceTicketDto?> CompleteServiceTicketAsync(
            Guid tenantId,
            CompleteServiceTicketRequest req,
            CancellationToken ct = default)
        {
            EnsureSeededTickets(tenantId);

            if (_tenantTickets.TryGetValue(tenantId, out var tickets))
            {
                var ticket = tickets.FirstOrDefault(t => t.Id == req.TicketId);
                if (ticket != null)
                {
                    ticket.ResolutionNotes = req.ResolutionNotes;
                    ticket.CustomerSignatureName = req.CustomerSignatureName;
                    ticket.CompletedAt = DateTime.UtcNow;
                    ticket.Status = "Completed";
                    ticket.PartsUsed = req.PartsUsed ?? new List<ServicePartLineDto>();
                    return await Task.FromResult(ticket);
                }
            }

            return await Task.FromResult<ServiceTicketDto?>(null);
        }

        private static void EnsureSeededTickets(Guid tenantId)
        {
            _tenantTickets.GetOrAdd(tenantId, tid => new List<ServiceTicketDto>
            {
                new()
                {
                    Id = Guid.Parse("88888888-8888-8888-8888-888888888801"),
                    TicketNumber = "SRV-2026-0034",
                    CustomerId = Guid.Parse("00000000-0000-0000-0000-000000000001"),
                    CustomerName = "Apex Global Logistics Hub A",
                    ServiceAddress = "Industrial Park 4, Logistics Blvd, Gateway 2",
                    Priority = "Critical",
                    Status = "InProgress",
                    ScheduledDate = DateTime.UtcNow,
                    AssignedTechnicianName = "Vikram Sharma",
                    AssignedTechnicianPhone = "+91 98201 44512",
                    IssueDescription = "Hydraulic pressure loss on conveyor line 3. High vibration warning.",
                    PartsUsed = new List<ServicePartLineDto>
                    {
                        new()
                        {
                            ItemId = Guid.Parse("00000000-0000-0000-0000-000000000002"),
                            ItemCode = "SKU-PMP-200",
                            ItemName = "High-Pressure Hydraulic Pump 250 Bar",
                            QuantityUsed = 1,
                            UnitCost = 450m,
                            TotalCost = 450m
                        }
                    }
                },
                new()
                {
                    Id = Guid.Parse("88888888-8888-8888-8888-888888888802"),
                    TicketNumber = "SRV-2026-0029",
                    CustomerId = Guid.Parse("00000000-0000-0000-0000-000000000002"),
                    CustomerName = "Precision Tooling Assembly Plant",
                    ServiceAddress = "Sector 18, Phase II Industrial Area",
                    Priority = "Medium",
                    Status = "Completed",
                    ScheduledDate = DateTime.UtcNow.AddDays(-2),
                    AssignedTechnicianName = "Marcus Vance",
                    AssignedTechnicianPhone = "+91 97110 88231",
                    IssueDescription = "Quarterly preventive maintenance and thermal imaging audit on motor stators.",
                    ResolutionNotes = "Cleaned filter assemblies, calibrated rotor alignment, and renewed insulation bushings.",
                    CustomerSignatureName = "Rajesh Mehta (Plant Operations Head)",
                    CompletedAt = DateTime.UtcNow.AddDays(-2)
                }
            });
        }
    }
}
