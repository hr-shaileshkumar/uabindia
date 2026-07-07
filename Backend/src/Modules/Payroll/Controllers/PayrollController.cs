using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;
using System.Text;
using UabIndia.Api.Models;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Api.Modules.Payroll.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    [Authorize]
    [Authorize(Policy = "Module:payroll")]
    public class PayrollController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;

        public PayrollController(ApplicationDbContext db, ITenantAccessor tenantAccessor)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
        }

        // ===== SALARY STRUCTURES =====

        [HttpGet("structures")]
        public async Task<IActionResult> GetStructures()
        {
            var data = await _db.PayrollStructures
                .AsNoTracking()
                .OrderByDescending(s => s.EffectiveFrom)
                .ToListAsync();

            return Ok(data);
        }

        [HttpGet("structures/{id}")]
        public async Task<IActionResult> GetStructure(Guid id)
        {
            var structure = await _db.PayrollStructures
                .AsNoTracking()
                .FirstOrDefaultAsync(s => s.Id == id);

            if (structure == null)
                return NotFound(new { message = "Structure not found" });

            return Ok(structure);
        }

        [HttpPost("structures")]
        public async Task<IActionResult> CreateStructure([FromBody] CreatePayrollStructureDto dto)
        {
            if (!ModelState.IsValid) 
                return BadRequest(ModelState);

            var structure = new PayrollStructure
            {
                Name = dto.Name,
                EffectiveFrom = dto.EffectiveFrom,
                EffectiveTo = dto.EffectiveTo
            };

            _db.PayrollStructures.Add(structure);
            await _db.SaveChangesAsync();

            return Ok(structure);
        }

        [HttpPut("structures/{id}")]
        public async Task<IActionResult> UpdateStructure(Guid id, [FromBody] UpdatePayrollStructureDto dto)
        {
            var structure = await _db.PayrollStructures.FindAsync(id);
            if (structure == null)
                return NotFound(new { message = "Structure not found" });

            structure.Name = dto.Name;
            structure.EffectiveFrom = dto.EffectiveFrom;
            structure.EffectiveTo = dto.EffectiveTo;

            await _db.SaveChangesAsync();
            return Ok(structure);
        }

        [HttpDelete("structures/{id}")]
        public async Task<IActionResult> DeleteStructure(Guid id)
        {
            var structure = await _db.PayrollStructures.FindAsync(id);
            if (structure == null)
                return NotFound(new { message = "Structure not found" });

            structure.IsDeleted = true;
            await _db.SaveChangesAsync();

            return Ok(new { message = "Structure deleted successfully" });
        }

        // ===== PAYROLL COMPONENTS =====

        [HttpGet("components")]
        public async Task<IActionResult> GetComponents([FromQuery] Guid? structureId)
        {
            var query = _db.PayrollComponents.AsNoTracking();

            if (structureId.HasValue)
                query = query.Where(c => c.StructureId == structureId.Value);

            var data = await query.OrderBy(c => c.Name).ToListAsync();
            return Ok(data);
        }

        [HttpGet("components/{id}")]
        public async Task<IActionResult> GetComponent(Guid id)
        {
            var component = await _db.PayrollComponents
                .AsNoTracking()
                .FirstOrDefaultAsync(c => c.Id == id);

            if (component == null)
                return NotFound(new { message = "Component not found" });

            return Ok(component);
        }

        [HttpPost("components")]
        public async Task<IActionResult> CreateComponent([FromBody] CreatePayrollComponentDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var component = new PayrollComponent
            {
                StructureId = dto.StructureId,
                Name = dto.Name,
                Type = dto.Type,
                Amount = dto.Amount,
                Percentage = dto.Percentage,
                IsStatutory = dto.IsStatutory
            };

            _db.PayrollComponents.Add(component);
            await _db.SaveChangesAsync();

            return Ok(component);
        }

        [HttpPut("components/{id}")]
        public async Task<IActionResult> UpdateComponent(Guid id, [FromBody] UpdatePayrollComponentDto dto)
        {
            var component = await _db.PayrollComponents.FindAsync(id);
            if (component == null)
                return NotFound(new { message = "Component not found" });

            component.Name = dto.Name;
            component.Type = dto.Type;
            component.Amount = dto.Amount;
            component.Percentage = dto.Percentage;
            component.IsStatutory = dto.IsStatutory;

            await _db.SaveChangesAsync();
            return Ok(component);
        }

        [HttpDelete("components/{id}")]
        public async Task<IActionResult> DeleteComponent(Guid id)
        {
            var component = await _db.PayrollComponents.FindAsync(id);
            if (component == null)
                return NotFound(new { message = "Component not found" });

            component.IsDeleted = true;
            await _db.SaveChangesAsync();

            return Ok(new { message = "Component deleted successfully" });
        }

        // ===== PAYROLL RUNS =====

        [HttpGet("runs")]
        public async Task<IActionResult> GetRuns([FromQuery] string? status)
        {
            var query = _db.PayrollRuns.AsNoTracking();

            if (!string.IsNullOrEmpty(status))
                query = query.Where(r => r.Status == status);

            var data = await query
                .OrderByDescending(r => r.RunDate)
                .Select(r => new PayrollRunDto
                {
                    Id = r.Id,
                    CompanyId = r.CompanyId,
                    RunDate = r.RunDate,
                    Status = r.Status
                })
                .ToListAsync();

            return Ok(data);
        }

        [HttpGet("runs/{id}")]
        public async Task<IActionResult> GetRun(Guid id)
        {
            var run = await _db.PayrollRuns
                .AsNoTracking()
                .FirstOrDefaultAsync(r => r.Id == id);

            if (run == null)
                return NotFound(new { message = "Payroll run not found" });

            return Ok(new PayrollRunDto
            {
                Id = run.Id,
                CompanyId = run.CompanyId,
                RunDate = run.RunDate,
                Status = run.Status
            });
        }

        [HttpPost("runs")]
        public async Task<IActionResult> CreateRun([FromBody] CreatePayrollRunDto dto)
        {
            if (!ModelState.IsValid) 
                return BadRequest(ModelState);

            var run = new PayrollRun
            {
                CompanyId = dto.CompanyId,
                RunDate = dto.RunDate,
                Status = "Draft"
            };

            _db.PayrollRuns.Add(run);
            await _db.SaveChangesAsync();

            return Ok(new PayrollRunDto
            {
                Id = run.Id,
                CompanyId = run.CompanyId,
                RunDate = run.RunDate,
                Status = run.Status
            });
        }

        [HttpPost("runs/{id}/complete")]
        public async Task<IActionResult> CompleteRun(Guid id)
        {
            var run = await _db.PayrollRuns.FindAsync(id);
            if (run == null)
                return NotFound(new { message = "Payroll run not found" });

            if (run.Status != "Draft")
                return BadRequest(new { message = "Only draft runs can be completed" });

            run.Status = "Completed";
            await _db.SaveChangesAsync();

            return Ok(new PayrollRunDto
            {
                Id = run.Id,
                CompanyId = run.CompanyId,
                RunDate = run.RunDate,
                Status = run.Status
            });
        }

        [HttpDelete("runs/{id}")]
        public async Task<IActionResult> DeleteRun(Guid id)
        {
            var run = await _db.PayrollRuns.FindAsync(id);
            if (run == null)
                return NotFound(new { message = "Payroll run not found" });

            if (run.Status == "Completed")
                return BadRequest(new { message = "Cannot delete completed payroll runs" });

            run.IsDeleted = true;
            await _db.SaveChangesAsync();

            return Ok(new { message = "Payroll run deleted successfully" });
        }

        // ===== PAYSLIPS =====

        [HttpGet("payslips")]
        public async Task<IActionResult> GetPayslips([FromQuery] Guid? runId, [FromQuery] Guid? employeeId)
        {
            var query = _db.Payslips.AsNoTracking();

            if (runId.HasValue)
                query = query.Where(p => p.PayrollRunId == runId.Value);

            if (employeeId.HasValue)
                query = query.Where(p => p.EmployeeId == employeeId.Value);

            var data = await query
                .Select(p => new PayslipDto
                {
                    Id = p.Id,
                    PayrollRunId = p.PayrollRunId,
                    EmployeeId = p.EmployeeId,
                    Gross = p.Gross,
                    Net = p.Net,
                    Details = p.Details
                })
                .ToListAsync();

            return Ok(data);
        }

        [HttpGet("payslips/{id}")]
        public async Task<IActionResult> GetPayslip(Guid id)
        {
            var payslip = await _db.Payslips
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.Id == id);

            if (payslip == null)
                return NotFound(new { message = "Payslip not found" });

            return Ok(new PayslipDto
            {
                Id = payslip.Id,
                PayrollRunId = payslip.PayrollRunId,
                EmployeeId = payslip.EmployeeId,
                Gross = payslip.Gross,
                Net = payslip.Net,
                Details = payslip.Details
            });
        }

        [HttpGet("payslips/{id:guid}/download")]
        public async Task<IActionResult> DownloadPayslip(Guid id)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var payslip = await _db.Payslips
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.Id == id && p.TenantId == tenantId);

            if (payslip == null)
                return NotFound(new { message = "Payslip not found" });

            var title = $"Payslip {payslip.Id}";
            var lines = new List<string>
            {
                $"Payslip ID: {payslip.Id}",
                $"Payroll Run ID: {payslip.PayrollRunId}",
                $"Employee ID: {payslip.EmployeeId}",
                $"Gross Pay: {payslip.Gross:0.00}",
                $"Net Pay: {payslip.Net:0.00}"
            };

            if (!string.IsNullOrWhiteSpace(payslip.Details))
            {
                lines.Add(string.Empty);
                lines.Add("Details:");
                lines.Add(payslip.Details);
            }

            var pdfBytes = BuildSimplePdf(title, lines);
            return File(pdfBytes, "application/pdf", $"payslip-{id}.pdf");
        }

        [HttpPost("payslips")]
        public async Task<IActionResult> CreatePayslip([FromBody] CreatePayslipDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var payslip = new Payslip
            {
                PayrollRunId = dto.PayrollRunId,
                EmployeeId = dto.EmployeeId,
                Gross = dto.Gross,
                Net = dto.Net,
                Details = dto.Details
            };

            _db.Payslips.Add(payslip);
            await _db.SaveChangesAsync();

            return Ok(new PayslipDto
            {
                Id = payslip.Id,
                PayrollRunId = payslip.PayrollRunId,
                EmployeeId = payslip.EmployeeId,
                Gross = payslip.Gross,
                Net = payslip.Net,
                Details = payslip.Details
            });
        }

        private static byte[] BuildSimplePdf(string title, IEnumerable<string> lines)
        {
            static string EscapePdfText(string value)
            {
                var builder = new StringBuilder(value.Length);
                foreach (var ch in value)
                {
                    if (ch is '\r' or '\n')
                    {
                        builder.Append(' ');
                        continue;
                    }

                    if (ch == '\\' || ch == '(' || ch == ')')
                    {
                        builder.Append('\\');
                    }

                    builder.Append(ch <= 0x7F ? ch : '?');
                }

                return builder.ToString();
            }

            var content = new StringBuilder();
            content.AppendLine("BT");
            content.AppendLine("/F1 12 Tf");
            content.AppendLine("72 760 Td");
            content.Append('(');
            content.Append(EscapePdfText(title));
            content.AppendLine(") Tj");

            foreach (var line in lines)
            {
                content.AppendLine("0 -18 Td");
                content.Append("(");
                content.Append(EscapePdfText(line));
                content.AppendLine(") Tj");
            }

            content.AppendLine("ET");

            var contentBytes = Encoding.ASCII.GetBytes(content.ToString());
            var objects = new List<string>
            {
                "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n",
                "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n",
                "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj\n",
                "4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n",
                $"5 0 obj << /Length {contentBytes.Length} >> stream\n{content}\nendstream endobj\n"
            };

            using var buffer = new MemoryStream();
            using (var writer = new StreamWriter(buffer, Encoding.ASCII, leaveOpen: true))
            {
                writer.NewLine = "\n";
                writer.Write("%PDF-1.4\n");
                writer.Flush();

                var offsets = new List<long>();
                foreach (var obj in objects)
                {
                    offsets.Add(buffer.Position);
                    var bytes = Encoding.ASCII.GetBytes(obj);
                    buffer.Write(bytes, 0, bytes.Length);
                }

                var xrefPosition = buffer.Position;
                writer.Write("xref\n");
                writer.Write("0 6\n");
                writer.Write("0000000000 65535 f \n");
                foreach (var offset in offsets)
                {
                    writer.Write($"{offset:0000000000} 00000 n \n");
                }

                writer.Write("trailer << /Size 6 /Root 1 0 R >>\n");
                writer.Write("startxref\n");
                writer.Write(xrefPosition);
                writer.Write("\n%%EOF");
                writer.Flush();
            }

            return buffer.ToArray();
        }

        // ===== STATUTORY COMPLIANCE =====

        [HttpGet("statutory/pf")]
        public Task<IActionResult> GetPFReport([FromQuery] DateTime? month)
        {
            // Placeholder for PF statutory report
            return Task.FromResult<IActionResult>(Ok(new 
            { 
                month = month ?? DateTime.UtcNow,
                totalPF = 0,
                records = new List<object>()
            }));
        }

        [HttpGet("statutory/esi")]
        public Task<IActionResult> GetESIReport([FromQuery] DateTime? month)
        {
            // Placeholder for ESI statutory report
            return Task.FromResult<IActionResult>(Ok(new 
            { 
                month = month ?? DateTime.UtcNow,
                totalESI = 0,
                records = new List<object>()
            }));
        }

        [HttpGet("statutory/pt")]
        public Task<IActionResult> GetPTReport([FromQuery] DateTime? month)
        {
            // Placeholder for Professional Tax report
            return Task.FromResult<IActionResult>(Ok(new 
            { 
                month = month ?? DateTime.UtcNow,
                totalPT = 0,
                records = new List<object>()
            }));
        }

        [HttpGet("statutory/tds")]
        public Task<IActionResult> GetTDSReport([FromQuery] DateTime? month)
        {
            // Placeholder for TDS report
            return Task.FromResult<IActionResult>(Ok(new 
            { 
                month = month ?? DateTime.UtcNow,
                totalTDS = 0,
                records = new List<object>()
            }));
        }
    }
}
