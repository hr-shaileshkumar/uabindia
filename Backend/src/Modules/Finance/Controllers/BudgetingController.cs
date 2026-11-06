using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UabIndia.Application.Interfaces;

namespace UabIndia.Api.Modules.Finance.Controllers
{
    [ApiController]
    [Route("api/v1/finance/budgeting")]
    [Route("api/v1/finance/budgets")]
    [Route("api/v1/budgets")]
    [Authorize]
    public class BudgetingController : ControllerBase
    {
        private readonly IBudgetingService _budgetingService;
        private readonly ITenantAccessor _tenantAccessor;

        public BudgetingController(
            IBudgetingService budgetingService,
            ITenantAccessor tenantAccessor)
        {
            _budgetingService = budgetingService;
            _tenantAccessor = tenantAccessor;
        }

        [HttpGet]
        public async Task<IActionResult> ListBudgets(
            [FromQuery] int fiscalYear = 2026,
            [FromQuery] Guid? branchId = null)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            if (tenantId == Guid.Empty)
            {
                return BadRequest(new { success = false, message = "Tenant context required." });
            }

            var analysis = await _budgetingService.GetBudgetVarianceAnalysisAsync(tenantId, fiscalYear, branchId);
            return Ok(new
            {
                success = true,
                data = analysis.CostCenters,
                items = analysis.CostCenters,
                summary = analysis,
                total = analysis.CostCenters?.Count ?? 0
            });
        }

        [HttpGet("variance-analysis")]
        public async Task<IActionResult> GetVarianceAnalysis(
            [FromQuery] int fiscalYear = 2026,
            [FromQuery] Guid? branchId = null)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            if (tenantId == Guid.Empty)
            {
                return BadRequest(new { success = false, message = "Tenant context required." });
            }

            var analysis = await _budgetingService.GetBudgetVarianceAnalysisAsync(tenantId, fiscalYear, branchId);
            return Ok(new { success = true, data = analysis });
        }

        [HttpPost("allocate")]
        [HttpPost("cost-centers/allocate")]
        public async Task<IActionResult> SaveBudgetAllocation([FromBody] SaveBudgetAllocationRequest req)
        {
            var tenantId = _tenantAccessor.GetTenantId();
            if (tenantId == Guid.Empty)
            {
                return BadRequest(new { success = false, message = "Tenant context required." });
            }

            var result = await _budgetingService.SaveBudgetAllocationAsync(tenantId, req);
            return Ok(new { success = true, message = "Budget allocated successfully.", data = result });
        }
    }
}
