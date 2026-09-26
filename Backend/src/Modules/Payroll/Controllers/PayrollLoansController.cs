using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;
using UabIndia.Api.Models;

namespace UabIndia.Api.Modules.Payroll.Controllers
{
    /// <summary>
    /// Dedicated controller for Employee Loans: apply, approve, activate, EMI recording, close.
    /// Route: api/v1/payroll/loans
    /// </summary>
    [ApiController]
    [Route("api/v1/payroll/loans")]
    [Authorize]
    [Authorize(Policy = "Module:payroll")]
    public class PayrollLoansController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;
        private readonly IPayrollEmployeeFinanceService _employeeFinance;

        public PayrollLoansController(
            ApplicationDbContext db,
            ITenantAccessor tenantAccessor,
            IPayrollEmployeeFinanceService employeeFinance)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
            _employeeFinance = employeeFinance;
        }

        /// <summary>GET api/v1/payroll/loans — list all loans with optional status/employee filter</summary>
        [HttpGet]
        public async Task<IActionResult> List(
            [FromQuery] string? status,
            [FromQuery] Guid? employeeId,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 25,
            CancellationToken ct = default)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var query = _db.PayrollLoans.AsNoTracking().Where(l => l.TenantId == tenantId && !l.IsDeleted);
            if (!string.IsNullOrWhiteSpace(status)) query = query.Where(l => l.Status == status);
            if (employeeId.HasValue) query = query.Where(l => l.EmployeeId == employeeId.Value);

            var total = await query.CountAsync(ct);
            var items = await query.OrderByDescending(l => l.DisbursementDate).Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);
            return Ok(new { total, page, pageSize, items });
        }

        /// <summary>GET api/v1/payroll/loans/{id}</summary>
        [HttpGet("{id:guid}")]
        public async Task<IActionResult> Get(Guid id, CancellationToken ct)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            var loan = await _db.PayrollLoans.AsNoTracking().FirstOrDefaultAsync(l => l.Id == id && l.TenantId == tenantId && !l.IsDeleted, ct);
            return loan == null ? NotFound(new { message = "Loan not found." }) : Ok(loan);
        }

        /// <summary>POST api/v1/payroll/loans — apply for a loan</summary>
        [HttpPost]
        public async Task<IActionResult> Apply([FromBody] CreatePayrollLoanDto dto, CancellationToken ct)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            if (dto.PrincipalAmount <= 0 || dto.EmiAmount <= 0)
                return BadRequest(new { message = "Principal and EMI must be greater than zero." });

            var employee = await _db.Employees.AsNoTracking().FirstOrDefaultAsync(e => e.Id == dto.EmployeeId && !e.IsDeleted, ct);
            if (employee == null) return BadRequest(new { message = "Employee not found." });

            var loan = new PayrollLoan
            {
                TenantId = _tenantAccessor.GetTenantId(),
                EmployeeId = employee.Id,
                EmployeeName = employee.FullName ?? employee.EmployeeCode ?? "Employee",
                EmployeeCode = employee.EmployeeCode ?? string.Empty,
                LoanType = dto.LoanType.Trim(),
                PrincipalAmount = dto.PrincipalAmount,
                OutstandingAmount = dto.PrincipalAmount,
                EmiAmount = dto.EmiAmount,
                InterestRate = dto.InterestRate,
                DisbursementDate = dto.DisbursementDate,
                TotalInstallments = dto.TotalInstallments < 1 ? 12 : dto.TotalInstallments,
                Purpose = dto.Purpose,
                Status = "Pending",
                CreatedAt = DateTime.UtcNow
            };
            _db.PayrollLoans.Add(loan);
            await _db.SaveChangesAsync(ct);
            return Ok(loan);
        }

        /// <summary>PUT api/v1/payroll/loans/{id} — update a pending loan</summary>
        [HttpPut("{id:guid}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] CreatePayrollLoanDto dto, CancellationToken ct)
        {
            var loan = await _db.PayrollLoans.FirstOrDefaultAsync(l => l.Id == id && !l.IsDeleted, ct);
            if (loan == null) return NotFound(new { message = "Loan not found." });
            if (loan.Status != "Pending") return BadRequest(new { message = "Only pending loans can be edited." });

            loan.LoanType = dto.LoanType;
            loan.PrincipalAmount = dto.PrincipalAmount;
            loan.EmiAmount = dto.EmiAmount;
            loan.InterestRate = dto.InterestRate;
            loan.DisbursementDate = dto.DisbursementDate;
            loan.TotalInstallments = dto.TotalInstallments < 1 ? 12 : dto.TotalInstallments;
            loan.Purpose = dto.Purpose;
            loan.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);
            return Ok(loan);
        }

        /// <summary>POST api/v1/payroll/loans/{id}/approve — manager approves the loan</summary>
        [HttpPost("{id:guid}/approve")]
        public async Task<IActionResult> Approve(Guid id, CancellationToken ct)
        {
            try { await _employeeFinance.ApproveLoanAsync(id); return Ok(new { message = "Loan approved." }); }
            catch (KeyNotFoundException) { return NotFound(new { message = "Loan not found." }); }
        }

        /// <summary>POST api/v1/payroll/loans/{id}/activate — disburse and activate the loan</summary>
        [HttpPost("{id:guid}/activate")]
        public async Task<IActionResult> Activate(Guid id, CancellationToken ct)
        {
            try { await _employeeFinance.ActivateLoanAsync(id); return Ok(new { message = "Loan activated." }); }
            catch (KeyNotFoundException) { return NotFound(new { message = "Loan not found." }); }
        }

        /// <summary>POST api/v1/payroll/loans/{id}/emi — record next EMI deduction</summary>
        [HttpPost("{id:guid}/emi")]
        public async Task<IActionResult> RecordEmi(Guid id, CancellationToken ct)
        {
            try
            {
                var result = await _employeeFinance.RecordEmiAsync(id);
                return Ok(result);
            }
            catch (KeyNotFoundException) { return NotFound(new { message = "Loan not found." }); }
            catch (InvalidOperationException ex) { return BadRequest(new { message = ex.Message }); }
        }

        /// <summary>POST api/v1/payroll/loans/{id}/close — close/pre-close a loan</summary>
        [HttpPost("{id:guid}/close")]
        public async Task<IActionResult> Close(Guid id, CancellationToken ct)
        {
            try { await _employeeFinance.CloseLoanAsync(id); return Ok(new { message = "Loan closed." }); }
            catch (KeyNotFoundException) { return NotFound(new { message = "Loan not found." }); }
        }

        /// <summary>DELETE api/v1/payroll/loans/{id} — soft delete a pending loan</summary>
        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
        {
            var loan = await _db.PayrollLoans.FirstOrDefaultAsync(l => l.Id == id && !l.IsDeleted, ct);
            if (loan == null) return NotFound(new { message = "Loan not found." });
            if (loan.Status != "Pending") return BadRequest(new { message = "Only pending loans can be deleted." });
            loan.IsDeleted = true;
            await _db.SaveChangesAsync(ct);
            return Ok(new { message = "Loan deleted." });
        }
    }
}
