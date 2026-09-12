using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Api.Modules.Administration.Controllers
{
    [ApiController]
    [Route("api/v1/ai")]
    [Authorize]
    public class AiAgentsController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;

        public AiAgentsController(ApplicationDbContext db, ITenantAccessor tenantAccessor)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
        }

        [HttpGet("agents")]
        [Authorize(Policy = "Module:platform")]
        public async Task<IActionResult> ListAgents([FromQuery] int page = 1, [FromQuery] int limit = 50, [FromQuery] string? category = null)
        {
            if (page < 1) page = 1;
            if (limit < 1) limit = 50;
            if (limit > 100) limit = 100;

            var tenantId = _tenantAccessor.GetTenantId();
            var query = _db.AiAgents.AsNoTracking().Where(a => a.TenantId == tenantId);

            if (!string.IsNullOrWhiteSpace(category))
            {
                query = query.Where(a => a.Category == category);
            }

            var total = await query.CountAsync();
            var agents = await query
                .OrderBy(a => a.Name)
                .Skip((page - 1) * limit)
                .Take(limit)
                .Select(a => new
                {
                    a.Id,
                    a.AgentKey,
                    a.Name,
                    a.Description,
                    a.Provider,
                    a.ModelName,
                    a.Category,
                    a.IsEnabled,
                    a.CreatedAt,
                    a.UpdatedAt
                })
                .ToListAsync();

            return Ok(new { success = true, data = agents, total, page, limit });
        }

        [HttpPost("agents")]
        [Authorize(Policy = "Module:platform")]
        [Authorize(Policy = "AdminOnly")]
        public async Task<IActionResult> UpsertAgent([FromBody] UpsertAiAgentDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.AgentKey) || string.IsNullOrWhiteSpace(dto.Name))
            {
                return BadRequest(new { success = false, error = "Agent key and name are required." });
            }

            var tenantId = _tenantAccessor.GetTenantId();
            var existing = await _db.AiAgents.FirstOrDefaultAsync(
                a => a.TenantId == tenantId && a.AgentKey == dto.AgentKey && !a.IsDeleted);

            if (existing == null)
            {
                existing = new AiAgent
                {
                    TenantId = tenantId,
                    AgentKey = dto.AgentKey.Trim(),
                    Name = dto.Name.Trim(),
                    Description = dto.Description,
                    Provider = string.IsNullOrWhiteSpace(dto.Provider) ? "OpenAI" : dto.Provider,
                    ModelName = dto.ModelName ?? string.Empty,
                    Category = string.IsNullOrWhiteSpace(dto.Category) ? "General" : dto.Category,
                    IsEnabled = dto.IsEnabled,
                    CreatedAt = DateTime.UtcNow
                };
                _db.AiAgents.Add(existing);
            }
            else
            {
                existing.Name = dto.Name.Trim();
                existing.Description = dto.Description;
                existing.Provider = string.IsNullOrWhiteSpace(dto.Provider) ? existing.Provider : dto.Provider;
                existing.ModelName = dto.ModelName ?? existing.ModelName;
                existing.Category = string.IsNullOrWhiteSpace(dto.Category) ? existing.Category : dto.Category;
                existing.IsEnabled = dto.IsEnabled;
                existing.UpdatedAt = DateTime.UtcNow;
            }

            await _db.SaveChangesAsync();
            return Ok(new { success = true, data = existing });
        }

        /// <summary>
        /// Tenant-scoped grounded copilot reply (tool-backed, no external LLM required).
        /// </summary>
        [HttpPost("chat")]
        public async Task<IActionResult> Chat([FromBody] AiChatRequestDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Message))
                return BadRequest(new { success = false, error = "Message is required." });

            var tenantId = _tenantAccessor.GetTenantId();
            var message = dto.Message.Trim();
            var lower = message.ToLowerInvariant();
            var recordType = (dto.RecordType ?? string.Empty).Trim().ToLowerInvariant();
            var hasRecord = dto.RecordId.HasValue && dto.RecordId != Guid.Empty;

            var agent = await _db.AiAgents.AsNoTracking()
                .Where(a => a.TenantId == tenantId && a.IsEnabled && !a.IsDeleted)
                .OrderByDescending(a => a.UpdatedAt ?? a.CreatedAt)
                .FirstOrDefaultAsync();

            var citations = new List<object>();
            string reply;

            if (hasRecord && (recordType is "employee" or "hrms.employee"))
            {
                var emp = await _db.Employees.AsNoTracking()
                    .FirstOrDefaultAsync(e => e.Id == dto.RecordId && e.TenantId == tenantId && !e.IsDeleted);
                if (emp == null)
                    return NotFound(new { success = false, error = "Employee not found for AI context." });

                var leavePending = await _db.LeaveRequests.CountAsync(l =>
                    l.TenantId == tenantId && !l.IsDeleted && l.EmployeeId == emp.Id &&
                    (l.Status == "Pending" || l.Status == "Submitted"));
                reply =
                    $"Employee {emp.FullName ?? emp.EmployeeCode ?? emp.Id.ToString()} ({emp.EmployeeCode ?? "—"}): status {emp.Status ?? "—"}, " +
                    $"{leavePending} pending leave request(s). " +
                    (string.IsNullOrWhiteSpace(message) ? "" : $"Regarding your question: {message}");
                citations.Add(new { type = "hrms.employee", emp.Id, emp.EmployeeCode, emp.Status, leavePending });
            }
            else if (hasRecord && (recordType is "payrollrun" or "payroll.run" or "payroll"))
            {
                var run = await _db.PayrollRuns.AsNoTracking()
                    .FirstOrDefaultAsync(r => r.Id == dto.RecordId && r.TenantId == tenantId && !r.IsDeleted);
                if (run == null)
                    return NotFound(new { success = false, error = "Payroll run not found for AI context." });

                var slipCount = await _db.Payslips.CountAsync(p =>
                    p.TenantId == tenantId && !p.IsDeleted && p.PayrollRunId == run.Id);
                reply =
                    $"Payroll run {run.Id:N} dated {run.RunDate:yyyy-MM-dd}: status {run.Status}, " +
                    $"{slipCount} payslip(s). " +
                    (string.IsNullOrWhiteSpace(message) ? "Ask about statutory deductions or completion." : $"Q: {message}");
                citations.Add(new { type = "payroll.run", run.Id, run.Status, run.RunDate, slipCount });
            }
            else if (hasRecord && (recordType is "invoice" or "sales.invoice" or "salesinvoice"))
            {
                var inv = await _db.SalesInvoices.AsNoTracking()
                    .FirstOrDefaultAsync(i => i.Id == dto.RecordId && i.TenantId == tenantId && !i.IsDeleted);
                if (inv == null)
                    return NotFound(new { success = false, error = "Invoice not found for AI context." });

                reply =
                    $"Invoice {inv.InvoiceNumber} dated {inv.InvoiceDate:yyyy-MM-dd}: total ₹{inv.TotalAmount:N0}, " +
                    $"balance ₹{inv.BalanceAmount:N0}, status {inv.Status}/{inv.PaymentStatus}. " +
                    (string.IsNullOrWhiteSpace(message) ? "" : $"Q: {message}");
                citations.Add(new { type = "sales.invoice", inv.Id, inv.InvoiceNumber, inv.BalanceAmount, inv.Status });
            }
            else if (lower.Contains("lead") || lower.Contains("pipeline") || lower.Contains("crm"))
            {
                var openLeads = await _db.CrmLeads.CountAsync(l => l.TenantId == tenantId && !l.IsDeleted && l.Status != "Closed");
                var pipelineValue = await _db.CrmLeads
                    .Where(l => l.TenantId == tenantId && !l.IsDeleted && l.Status != "Closed")
                    .SumAsync(l => (decimal?)l.Value) ?? 0m;
                reply = $"CRM snapshot: {openLeads} open leads with pipeline value ₹{pipelineValue:N0}. Open /crm/leads for the full board.";
                citations.Add(new { type = "crm.leads", openLeads, pipelineValue });
            }
            else if (lower.Contains("quotation") || lower.Contains("quote"))
            {
                var draft = await _db.SalesQuotations.CountAsync(q => q.TenantId == tenantId && !q.IsDeleted && q.Status == "Draft");
                var sent = await _db.SalesQuotations.CountAsync(q => q.TenantId == tenantId && !q.IsDeleted && q.Status == "Sent");
                reply = $"Quotations: {draft} draft and {sent} sent. Open /quotations to manage the quote register.";
                citations.Add(new { type = "sales.quotations", draft, sent });
            }
            else if (lower.Contains("invoice") || lower.Contains("receivable"))
            {
                var unpaid = await _db.SalesInvoices.CountAsync(i => i.TenantId == tenantId && !i.IsDeleted && i.Status != "Paid" && i.Status != "Cancelled");
                var balance = await _db.SalesInvoices
                    .Where(i => i.TenantId == tenantId && !i.IsDeleted && i.Status != "Paid" && i.Status != "Cancelled")
                    .SumAsync(i => (decimal?)i.BalanceAmount) ?? 0m;
                reply = $"Receivables: {unpaid} open invoices totaling ₹{balance:N0} outstanding. Open /invoices for detail.";
                citations.Add(new { type = "sales.invoices", unpaid, balance });
            }
            else if (lower.Contains("employee") || lower.Contains("headcount") || lower.Contains("staff"))
            {
                var headcount = await _db.Employees.CountAsync(e => e.TenantId == tenantId && !e.IsDeleted);
                reply = $"Workforce: {headcount} active employee records in this tenant. Open /hrms/employees for the directory.";
                citations.Add(new { type = "hrms.employees", headcount });
            }
            else if (lower.Contains("leave") || lower.Contains("attendance") || lower.Contains("hr"))
            {
                var pendingLeave = await _db.LeaveRequests.CountAsync(l =>
                    l.TenantId == tenantId && !l.IsDeleted &&
                    (l.Status == "Pending" || l.Status == "Submitted"));
                reply = $"HR ops: {pendingLeave} leave request(s) awaiting action. Use /hrms/leave and /hrms/attendance for workflows.";
                citations.Add(new { type = "hrms.leave", pendingLeave });
            }
            else
            {
                reply =
                    "I can answer grounded questions about employees, leave, CRM leads, quotations, and invoices for this tenant. " +
                    "Try: \"How many open leads?\" or \"Show unpaid invoices.\"";
            }

            return Ok(new
            {
                success = true,
                data = new
                {
                    reply,
                    citations,
                    agent = agent == null
                        ? null
                        : new { agent.AgentKey, agent.Name, agent.ModelName, agent.Provider },
                    mode = "grounded-tools",
                    tenantId,
                    recordType = string.IsNullOrWhiteSpace(dto.RecordType) ? null : dto.RecordType,
                    recordId = dto.RecordId
                }
            });
        }
    }

    public class UpsertAiAgentDto
    {
        public string AgentKey { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? Provider { get; set; }
        public string? ModelName { get; set; }
        public string? Category { get; set; }
        public bool IsEnabled { get; set; } = true;
    }

    public class AiChatRequestDto
    {
        public string Message { get; set; } = string.Empty;
        public string? AgentKey { get; set; }
        /// <summary>Optional record scope: employee | payrollrun | invoice</summary>
        public string? RecordType { get; set; }
        public Guid? RecordId { get; set; }
    }
}

