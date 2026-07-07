using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using UabIndia.Application.Interfaces;
using UabIndia.Api.Models;
using UabIndia.Core.Entities;

namespace UabIndia.Api.Modules.Compliance.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    [Route("api/[controller]")]
    [Authorize]
    [Authorize(Policy = "Module:compliance")]
    public class ComplianceController : ControllerBase
    {
        private readonly IComplianceRepository _repository;
        private readonly ILogger<ComplianceController> _logger;

        public ComplianceController(IComplianceRepository repository, ILogger<ComplianceController> logger)
        {
            _repository = repository;
            _logger = logger;
        }

        // ==================== PROVIDENT FUND ENDPOINTS ====================
        #region Provident Fund Endpoints

        [HttpGet("pf")]
        [Authorize(Roles = "Admin,HR,Manager")]
        public async Task<ActionResult<List<ProvidentFundDto>>> GetAllProvidentFunds([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10)
        {
            try
            {
                var pfs = await _repository.GetAllProvidentFundsAsync(pageNumber, pageSize);
                var result = pfs.Select(p => MapToProvidentFundDto(p)).ToList();
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving provident funds");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        [HttpGet("pf/{id}")]
        [Authorize(Roles = "Admin,HR,Manager,Employee")]
        public async Task<ActionResult<ProvidentFundDto>> GetProvidentFundById(Guid id)
        {
            try
            {
                var pf = await _repository.GetProvidentFundByIdAsync(id);
                if (pf == null) return NotFound(new { message = "Provident Fund not found" });

                return Ok(MapToProvidentFundDto(pf));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving provident fund");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        [HttpGet("pf/employee/{employeeId}")]
        [Authorize(Roles = "Admin,HR,Manager,Employee")]
        public async Task<ActionResult<ProvidentFundDto>> GetProvidentFundByEmployee(Guid employeeId)
        {
            try
            {
                var pf = await _repository.GetProvidentFundByEmployeeAsync(employeeId);
                if (pf == null) return NotFound(new { message = "PF record not found for employee" });

                return Ok(MapToProvidentFundDto(pf));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving PF for employee");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        [HttpPost("pf")]
        [Authorize(Roles = "Admin,HR")]
        public async Task<ActionResult<ProvidentFundDto>> CreateProvidentFund([FromBody] CreateProvidentFundDto dto)
        {
            try
            {
                if (!ModelState.IsValid) return BadRequest(ModelState);

                var pf = new ProvidentFund
                {
                    EmployeeId = dto.EmployeeId,
                    EmployeeNumber = dto.EmployeeNumber,
                    EmployeeName = dto.EmployeeName,
                    DepartmentId = dto.DepartmentId,
                    PFAccountNumber = dto.PFAccountNumber,
                    EffectiveFrom = dto.EffectiveFrom,
                    BasicSalary = dto.BasicSalary,
                    DA = dto.DA,
                    FinancialYear = DateTime.Now.Year,
                    Status = PFStatus.Active
                };

                var created = await _repository.CreateProvidentFundAsync(pf);
                return CreatedAtAction(nameof(GetProvidentFundById), new { id = created.Id }, MapToProvidentFundDto(created));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating provident fund");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        [HttpPut("pf/{id}")]
        [Authorize(Roles = "Admin,HR")]
        public async Task<ActionResult<ProvidentFundDto>> UpdateProvidentFund(Guid id, [FromBody] UpdateProvidentFundDto dto)
        {
            try
            {
                if (!ModelState.IsValid) return BadRequest(ModelState);

                var pf = await _repository.GetProvidentFundByIdAsync(id);
                if (pf == null) return NotFound(new { message = "Provident Fund not found" });

                pf.BasicSalary = dto.BasicSalary;
                pf.DA = dto.DA;
                pf.InterestEarned = dto.InterestEarned;

                var updated = await _repository.UpdateProvidentFundAsync(pf);
                return Ok(MapToProvidentFundDto(updated));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating provident fund");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        #endregion

        // ==================== PF WITHDRAWAL ENDPOINTS ====================
        #region PF Withdrawal Endpoints

        [HttpGet("pf-withdrawals")]
        [Authorize(Roles = "Admin,HR,Manager")]
        public async Task<ActionResult<List<PFWithdrawalDto>>> GetAllPFWithdrawals([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10)
        {
            try
            {
                var withdrawals = await _repository.GetAllPFWithdrawalsAsync(pageNumber, pageSize);
                var result = withdrawals.Select(w => MapToPFWithdrawalDto(w)).ToList();
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving PF withdrawals");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        [HttpGet("pf-withdrawals/employee/{employeeId}")]
        [Authorize(Roles = "Admin,HR,Manager,Employee")]
        public async Task<ActionResult<List<PFWithdrawalDto>>> GetPFWithdrawalsByEmployee(Guid employeeId)
        {
            try
            {
                var withdrawals = await _repository.GetPFWithdrawalsByEmployeeAsync(employeeId);
                var result = withdrawals.Select(w => MapToPFWithdrawalDto(w)).ToList();
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving PF withdrawals for employee");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        [HttpGet("pf-withdrawals/pending")]
        [Authorize(Roles = "Admin,HR,Manager")]
        public async Task<ActionResult<List<PFWithdrawalDto>>> GetPendingPFWithdrawals()
        {
            try
            {
                var withdrawals = await _repository.GetPendingPFWithdrawalsAsync();
                var result = withdrawals.Select(w => MapToPFWithdrawalDto(w)).ToList();
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving pending withdrawals");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        [HttpPost("pf-withdrawals")]
        [Authorize(Roles = "Admin,HR,Employee")]
        public async Task<ActionResult<PFWithdrawalDto>> CreatePFWithdrawal([FromBody] CreatePFWithdrawalDto dto)
        {
            try
            {
                if (!ModelState.IsValid) return BadRequest(ModelState);

                var withdrawal = new PFWithdrawal
                {
                    EmployeeId = dto.EmployeeId,
                    PFId = dto.PFId,
                    EmployeeNumber = "",
                    EmployeeName = "",
                    WithdrawalAmount = dto.WithdrawalAmount,
                    WithdrawalType = Enum.Parse<PFWithdrawalType>(dto.WithdrawalType),
                    Reason = dto.Reason,
                    BankAccountNumber = dto.BankAccountNumber,
                    BankIFSC = dto.BankIFSC,
                    Status = WithdrawalStatus.Pending
                };

                var created = await _repository.CreatePFWithdrawalAsync(withdrawal);
                return CreatedAtAction(nameof(GetPFWithdrawalById), new { id = created.Id }, MapToPFWithdrawalDto(created));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating PF withdrawal");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        [HttpPut("pf-withdrawals/{id}")]
        [Authorize(Roles = "Admin,HR,Manager")]
        public async Task<ActionResult<PFWithdrawalDto>> UpdatePFWithdrawal(Guid id, [FromBody] UpdatePFWithdrawalDto dto)
        {
            try
            {
                if (!ModelState.IsValid) return BadRequest(ModelState);

                var withdrawal = await _repository.GetPFWithdrawalByIdAsync(id);
                if (withdrawal == null) return NotFound(new { message = "Withdrawal not found" });

                withdrawal.Status = Enum.Parse<WithdrawalStatus>(dto.Status);
                withdrawal.RejectionReason = dto.RejectionReason;
                withdrawal.TransactionReference = dto.TransactionReference;
                withdrawal.TDSOnWithdrawal = dto.TDSOnWithdrawal;

                var updated = await _repository.UpdatePFWithdrawalAsync(withdrawal);
                return Ok(MapToPFWithdrawalDto(updated));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating PF withdrawal");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        [HttpGet("pf-withdrawals/{id}")]
        public async Task<ActionResult<PFWithdrawalDto>> GetPFWithdrawalById(Guid id)
        {
            var withdrawal = await _repository.GetPFWithdrawalByIdAsync(id);
            if (withdrawal == null) return NotFound();
            return Ok(MapToPFWithdrawalDto(withdrawal));
        }

        #endregion

        // ==================== ESI ENDPOINTS ====================
        #region ESI Endpoints

        [HttpGet("esi")]
        [Authorize(Roles = "Admin,HR,Manager")]
        public async Task<ActionResult<List<EmployeeStateInsuranceDto>>> GetAllESI([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10)
        {
            try
            {
                var esi = await _repository.GetAllESIAsync(pageNumber, pageSize);
                var result = esi.Select(e => MapToESIDto(e)).ToList();
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving ESI records");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        [HttpGet("esi/employee/{employeeId}")]
        [Authorize(Roles = "Admin,HR,Manager,Employee")]
        public async Task<ActionResult<EmployeeStateInsuranceDto>> GetESIByEmployee(Guid employeeId)
        {
            try
            {
                var esi = await _repository.GetESIByEmployeeAsync(employeeId);
                if (esi == null) return NotFound(new { message = "ESI record not found" });

                return Ok(MapToESIDto(esi));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving ESI for employee");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        [HttpGet("esi/eligible")]
        [Authorize(Roles = "Admin,HR")]
        public async Task<ActionResult<List<EmployeeStateInsuranceDto>>> GetEligibleESIEmployees()
        {
            try
            {
                var esi = await _repository.GetEligibleESIEmployeesAsync();
                var result = esi.Select(e => MapToESIDto(e)).ToList();
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving eligible ESI employees");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        [HttpPost("esi")]
        [Authorize(Roles = "Admin,HR")]
        public async Task<ActionResult<EmployeeStateInsuranceDto>> CreateESI([FromBody] CreateEmployeeStateInsuranceDto dto)
        {
            try
            {
                if (!ModelState.IsValid) return BadRequest(ModelState);

                var esi = new EmployeeStateInsurance
                {
                    EmployeeId = dto.EmployeeId,
                    EmployeeNumber = dto.EmployeeNumber,
                    EmployeeName = dto.EmployeeName,
                    DepartmentId = dto.DepartmentId,
                    ESINumber = dto.ESINumber,
                    StateCode = dto.StateCode,
                    EffectiveFrom = dto.EffectiveFrom,
                    MonthlySalary = dto.MonthlySalary,
                    FinancialYear = DateTime.Now.Year,
                    Status = ESIStatus.Active
                };

                var created = await _repository.CreateESIAsync(esi);
                return CreatedAtAction(nameof(GetESIByEmployee), new { employeeId = created.EmployeeId }, MapToESIDto(created));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating ESI record");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        [HttpPut("esi/{id}")]
        [Authorize(Roles = "Admin,HR")]
        public async Task<ActionResult<EmployeeStateInsuranceDto>> UpdateESI(Guid id, [FromBody] UpdateEmployeeStateInsuranceDto dto)
        {
            try
            {
                if (!ModelState.IsValid) return BadRequest(ModelState);

                var esi = await _repository.GetESIByIdAsync(id);
                if (esi == null) return NotFound(new { message = "ESI record not found" });

                esi.MonthlySalary = dto.MonthlySalary;
                esi.IsESIEligible = dto.IsESIEligible;
                esi.ESICoverageEndDate = dto.ESICoverageEndDate;

                var updated = await _repository.UpdateESIAsync(esi);
                return Ok(MapToESIDto(updated));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating ESI record");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        #endregion

        // ==================== INCOME TAX ENDPOINTS ====================
        #region Income Tax Endpoints

        [HttpGet("it")]
        [Authorize(Roles = "Admin,HR,Manager")]
        public async Task<ActionResult<List<IncomeTaxDto>>> GetAllIncomeTax([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10)
        {
            try
            {
                var it = await _repository.GetAllIncomeTaxAsync(pageNumber, pageSize);
                var result = it.Select(x => MapToIncomeTaxDto(x)).ToList();
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving income tax records");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        [HttpGet("it/employee/{employeeId}")]
        [Authorize(Roles = "Admin,HR,Manager,Employee")]
        public async Task<ActionResult<IncomeTaxDto>> GetIncomeTaxByEmployee(Guid employeeId)
        {
            try
            {
                var it = await _repository.GetIncomeTaxByEmployeeAsync(employeeId);
                if (it == null) return NotFound(new { message = "Income tax record not found" });

                return Ok(MapToIncomeTaxDto(it));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving income tax");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        [HttpPost("it")]
        [Authorize(Roles = "Admin,HR")]
        public async Task<ActionResult<IncomeTaxDto>> CreateIncomeTax([FromBody] CreateIncomeTaxDto dto)
        {
            try
            {
                if (!ModelState.IsValid) return BadRequest(ModelState);

                var it = new IncomeTax
                {
                    EmployeeId = dto.EmployeeId,
                    EmployeeNumber = dto.EmployeeNumber,
                    EmployeeName = dto.EmployeeName,
                    PAN = dto.PAN,
                    DepartmentId = dto.DepartmentId,
                    TaxRegime = Enum.Parse<TaxRegime>(dto.TaxRegime),
                    BasicSalary = dto.BasicSalary,
                    DA = dto.DA,
                    HRA = dto.HRA,
                    FinancialYear = DateTime.Now.Year,
                    AssessmentYear = DateTime.Now.Year + 1,
                    Status = ITStatus.Calculated
                };

                var created = await _repository.CreateIncomeTaxAsync(it);
                return CreatedAtAction(nameof(GetIncomeTaxByEmployee), new { employeeId = created.EmployeeId }, MapToIncomeTaxDto(created));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating income tax record");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        [HttpPut("it/{id}")]
        [Authorize(Roles = "Admin,HR")]
        public async Task<ActionResult<IncomeTaxDto>> UpdateIncomeTax(Guid id, [FromBody] UpdateIncomeTaxDto dto)
        {
            try
            {
                if (!ModelState.IsValid) return BadRequest(ModelState);

                var it = await _repository.GetIncomeTaxByIdAsync(id);
                if (it == null) return NotFound(new { message = "Income tax record not found" });

                it.BasicSalary = dto.BasicSalary;
                it.DA = dto.DA;
                it.HRA = dto.HRA;
                it.SpecialAllowance = dto.SpecialAllowance;
                it.TaxRegime = Enum.Parse<TaxRegime>(dto.TaxRegime);

                var updated = await _repository.UpdateIncomeTaxAsync(it);
                return Ok(MapToIncomeTaxDto(updated));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating income tax record");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        [HttpGet("it/{employeeId}/calculate")]
        [Authorize(Roles = "Admin,HR")]
        public async Task<ActionResult<IncomeTaxCalculationDto>> CalculateTax(Guid employeeId)
        {
            try
            {
                var it = await _repository.GetIncomeTaxByEmployeeAsync(employeeId);
                if (it == null) return NotFound(new { message = "Income tax record not found" });

                var taxableIncome = await _repository.CalculateTaxableIncomeAsync(employeeId);
                var taxLiability = await _repository.CalculateTaxLiabilityAsync(employeeId, it.TaxRegime.ToString());

                var slabs = await GetApplicableSlabsAsync(it.FinancialYear, it.TaxRegime.ToString(), taxableIncome);

                return Ok(new IncomeTaxCalculationDto
                {
                    EmployeeId = employeeId,
                    GrossSalary = it.GrossSalary,
                    TaxableIncome = taxableIncome,
                    TaxCalculated = taxLiability,
                    TotalTaxLiability = taxLiability,
                    ApplicableSlabs = slabs
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error calculating tax");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        #endregion

        // ==================== STATUTORY SETTINGS ENDPOINTS ====================
        #region Statutory Settings Endpoints

        [HttpGet("statutory-settings")]
        [Authorize(Roles = "Admin,HR")]
        public async Task<ActionResult<List<StatutorySettingsDto>>> GetAllStatutorySettings()
        {
            try
            {
                var settings = await _repository.GetAllActiveSettingsAsync();
                var result = settings.Select(MapToStatutorySettingsDto).ToList();
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving statutory settings");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        [HttpGet("statutory-settings/{settingKey}")]
        [Authorize(Roles = "Admin,HR")]
        public async Task<ActionResult<StatutorySettingsDto>> GetSettingByKey(string settingKey)
        {
            try
            {
                var setting = await _repository.GetSettingByKeyAsync(settingKey);
                if (setting == null) return NotFound(new { message = "Setting not found" });
                return Ok(MapToStatutorySettingsDto(setting));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving statutory setting {SettingKey}", settingKey);
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        [HttpPost("statutory-settings")]
        [Authorize(Roles = "Admin,HR")]
        public async Task<ActionResult<StatutorySettingsDto>> CreateSetting([FromBody] CreateStatutorySettingsDto dto)
        {
            try
            {
                if (!ModelState.IsValid) return BadRequest(ModelState);

                var setting = new StatutorySettings
                {
                    SettingKey = dto.SettingKey,
                    SettingValue = dto.SettingValue,
                    FinancialYear = dto.FinancialYear,
                    Description = dto.Description,
                    EffectiveFrom = dto.EffectiveFrom,
                    EffectiveTo = dto.EffectiveTo,
                    IsActive = dto.IsActive
                };

                var created = await _repository.CreateStatutorySettingAsync(setting);
                return CreatedAtAction(nameof(GetSettingByKey), new { settingKey = created.SettingKey }, MapToStatutorySettingsDto(created));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating statutory setting");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        [HttpPut("statutory-settings/{settingKey}")]
        [Authorize(Roles = "Admin,HR")]
        public async Task<ActionResult<StatutorySettingsDto>> UpdateSetting(string settingKey, [FromBody] UpdateStatutorySettingsDto dto)
        {
            try
            {
                if (!ModelState.IsValid) return BadRequest(ModelState);

                var existing = await _repository.GetSettingByKeyAsync(settingKey);
                if (existing == null) return NotFound(new { message = "Setting not found" });

                existing.SettingValue = dto.SettingValue;
                existing.Description = dto.Description;
                existing.EffectiveTo = dto.EffectiveTo;
                existing.IsActive = dto.IsActive;

                var updated = await _repository.UpdateStatutorySettingAsync(existing);
                return Ok(MapToStatutorySettingsDto(updated));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating statutory setting {SettingKey}", settingKey);
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        #endregion

        // ==================== PROFESSIONAL TAX ENDPOINTS ====================
        #region Professional Tax Endpoints

        [HttpGet("pt")]
        [Authorize(Roles = "Admin,HR,Manager")]
        public async Task<ActionResult<List<ProfessionalTaxDto>>> GetAllPT([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10)
        {
            try
            {
                var pt = await _repository.GetAllPTAsync(pageNumber, pageSize);
                var result = pt.Select(p => MapToPTDto(p)).ToList();
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving professional tax records");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        [HttpGet("pt/{id}")]
        [Authorize(Roles = "Admin,HR,Manager,Employee")]
        public async Task<ActionResult<ProfessionalTaxDto>> GetPTById(Guid id)
        {
            try
            {
                var pt = await _repository.GetPTByIdAsync(id);
                if (pt == null) return NotFound(new { message = "Professional tax record not found" });
                return Ok(MapToPTDto(pt));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving professional tax record");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        [HttpGet("pt/employee/{employeeId}")]
        [Authorize(Roles = "Admin,HR,Manager,Employee")]
        public async Task<ActionResult<ProfessionalTaxDto>> GetPTByEmployee(Guid employeeId)
        {
            try
            {
                var pt = await _repository.GetPTByEmployeeAsync(employeeId);
                if (pt == null) return NotFound(new { message = "Professional tax record not found" });
                return Ok(MapToPTDto(pt));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving professional tax for employee");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        [HttpPost("pt")]
        [Authorize(Roles = "Admin,HR")]
        public async Task<ActionResult<ProfessionalTaxDto>> CreatePT([FromBody] CreateProfessionalTaxDto dto)
        {
            try
            {
                if (!ModelState.IsValid) return BadRequest(ModelState);

                var pt = new ProfessionalTax
                {
                    EmployeeId = dto.EmployeeId,
                    EmployeeNumber = dto.EmployeeNumber,
                    EmployeeName = dto.EmployeeName,
                    DepartmentId = dto.DepartmentId,
                    StateCode = dto.StateCode,
                    MonthlySalary = dto.MonthlySalary,
                    FinancialYear = DateTime.Now.Year,
                    Status = PTStatus.Active
                };

                var created = await _repository.CreatePTAsync(pt);
                return CreatedAtAction(nameof(GetPTById), new { id = created.Id }, MapToPTDto(created));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating professional tax record");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        [HttpPut("pt/{id}")]
        [Authorize(Roles = "Admin,HR")]
        public async Task<ActionResult<ProfessionalTaxDto>> UpdatePT(Guid id, [FromBody] UpdateProfessionalTaxDto dto)
        {
            try
            {
                if (!ModelState.IsValid) return BadRequest(ModelState);

                var pt = await _repository.GetPTByIdAsync(id);
                if (pt == null) return NotFound(new { message = "Professional tax record not found" });

                pt.MonthlySalary = dto.MonthlySalary;
                pt.IsPTExempt = dto.IsPTExempt;

                var updated = await _repository.UpdatePTAsync(pt);
                return Ok(MapToPTDto(updated));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating professional tax record");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        #endregion

        // ==================== TAX DECLARATION ENDPOINTS ====================
        #region Tax Declaration Endpoints

        [HttpGet("tax-declarations/employee/{employeeId}")]
        [Authorize(Roles = "Admin,HR,Employee")]
        public async Task<ActionResult<TaxDeclarationDto>> GetTaxDeclaration(Guid employeeId, [FromQuery] int financialYear)
        {
            try
            {
                var declaration = await _repository.GetTaxDeclarationByEmployeeAsync(employeeId, financialYear);
                if (declaration == null) return NotFound(new { message = "Tax declaration not found" });

                return Ok(MapToTaxDeclarationDto(declaration));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving tax declaration");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        [HttpPost("tax-declarations")]
        [Authorize(Roles = "Admin,HR,Employee")]
        public async Task<ActionResult<TaxDeclarationDto>> CreateTaxDeclaration([FromBody] CreateTaxDeclarationDto dto)
        {
            try
            {
                if (!ModelState.IsValid) return BadRequest(ModelState);

                var declaration = new TaxDeclaration
                {
                    EmployeeId = dto.EmployeeId,
                    FinancialYear = dto.FinancialYear,
                    Section80C_Total = dto.Section80C_Total,
                    Section80D_Total = dto.Section80D_Total,
                    Section80G_Donation = dto.Section80G_Donation,
                    Section80E_InterestOnEducationLoan = dto.Section80E_InterestOnEducationLoan,
                    RentPaid = dto.RentPaid,
                    ProofDocuments = dto.ProofDocuments,
                    Status = DeclarationStatus.Declared
                };

                var created = await _repository.CreateTaxDeclarationAsync(declaration);
                return CreatedAtAction(nameof(GetTaxDeclaration), new { employeeId = created.EmployeeId }, MapToTaxDeclarationDto(created));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating tax declaration");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        [HttpPut("tax-declarations/{id}")]
        [Authorize(Roles = "Admin,HR,Employee")]
        public async Task<ActionResult<TaxDeclarationDto>> UpdateTaxDeclaration(Guid id, [FromBody] UpdateTaxDeclarationDto dto)
        {
            try
            {
                if (!ModelState.IsValid) return BadRequest(ModelState);

                var declaration = await _repository.GetTaxDeclarationByIdAsync(id);
                if (declaration == null) return NotFound(new { message = "Tax declaration not found" });

                declaration.Section80C_Total = dto.Section80C_Total;
                declaration.Section80D_Total = dto.Section80D_Total;
                declaration.Section80G_Donation = dto.Section80G_Donation;
                declaration.ProofSubmitted = dto.ProofSubmitted;
                declaration.ProofDocuments = dto.ProofDocuments;

                var updated = await _repository.UpdateTaxDeclarationAsync(declaration);
                return Ok(MapToTaxDeclarationDto(updated));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating tax declaration");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        #endregion

        // ==================== COMPLIANCE REPORT ENDPOINTS ====================
        #region Compliance Report Endpoints

        [HttpGet("reports")]
        [Authorize(Roles = "Admin,HR")]
        public async Task<ActionResult<List<ComplianceReportDto>>> GetAllComplianceReports([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10)
        {
            try
            {
                var reports = await _repository.GetAllComplianceReportsAsync(pageNumber, pageSize);
                var result = reports.Select(r => MapToComplianceReportDto(r)).ToList();
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving compliance reports");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        [HttpGet("reports/{reportType}")]
        [Authorize(Roles = "Admin,HR")]
        public async Task<ActionResult<List<ComplianceReportDto>>> GetComplianceReportsByType(string reportType, [FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10)
        {
            try
            {
                var reports = await _repository.GetComplianceReportsByTypeAsync(reportType);
                var result = reports.Skip((pageNumber - 1) * pageSize).Take(pageSize).Select(r => MapToComplianceReportDto(r)).ToList();
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving compliance reports by type");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        [HttpPost("reports")]
        [Authorize(Roles = "Admin,HR")]
        public async Task<ActionResult<ComplianceReportDto>> CreateComplianceReport([FromBody] CreateComplianceReportDto dto)
        {
            try
            {
                if (!ModelState.IsValid) return BadRequest(ModelState);

                var report = new ComplianceReport
                {
                    ReportType = dto.ReportType,
                    FinancialYear = dto.FinancialYear,
                    MonthYear = dto.MonthYear,
                    PFDtrCode = dto.PFDtrCode,
                    ESIRegistrationNumber = dto.ESIRegistrationNumber,
                    DeductorPAN = dto.DeductorPAN,
                    EmployeeId = dto.EmployeeId,
                    Status = ComplianceReportStatus.Generated,
                    SubmissionDeadline = DateTime.UtcNow.AddDays(15)
                };

                var created = await _repository.CreateComplianceReportAsync(report);
                return CreatedAtAction(nameof(GetAllComplianceReports), MapToComplianceReportDto(created));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating compliance report");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        #endregion

        // ==================== COMPLIANCE AUDIT ENDPOINTS ====================
        #region Compliance Audit Endpoints

        [HttpGet("audits")]
        [Authorize(Roles = "Admin,HR")]
        public async Task<ActionResult<List<ComplianceAuditDto>>> GetAllComplianceAudits([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10)
        {
            try
            {
                var audits = await _repository.GetAllComplianceAuditsAsync(pageNumber, pageSize);
                var result = audits.Select(a => MapToComplianceAuditDto(a)).ToList();
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving compliance audits");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        [HttpPost("audits")]
        [Authorize(Roles = "Admin,HR")]
        public async Task<ActionResult<ComplianceAuditDto>> CreateComplianceAudit([FromBody] CreateComplianceAuditDto dto)
        {
            try
            {
                if (!ModelState.IsValid) return BadRequest(ModelState);

                var audit = new ComplianceAudit
                {
                    AuditType = dto.AuditType,
                    FinancialYear = dto.FinancialYear,
                    TotalRecordsChecked = dto.TotalRecordsChecked,
                    AuditFindings = dto.AuditFindings,
                    Status = AuditStatus.InProgress,
                    StartDate = DateTime.UtcNow
                };

                var created = await _repository.CreateComplianceAuditAsync(audit);
                return CreatedAtAction(nameof(GetAllComplianceAudits), MapToComplianceAuditDto(created));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating compliance audit");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        #endregion

        // ==================== HELPER MAPPING METHODS ====================
        #region Mapping Methods

        private ProvidentFundDto MapToProvidentFundDto(ProvidentFund pf)
        {
            return new ProvidentFundDto
            {
                Id = pf.Id,
                EmployeeId = pf.EmployeeId,
                EmployeeNumber = pf.EmployeeNumber,
                EmployeeName = pf.EmployeeName,
                PFAccountNumber = pf.PFAccountNumber,
                BasicSalary = pf.BasicSalary,
                DA = pf.DA,
                PFWages = pf.PFWages,
                EmployeeContribution = pf.EmployeeContribution,
                EmployerContributionPF = pf.EmployerContributionPF,
                EmployerContributionEPS = pf.EmployerContributionEPS,
                TotalBalance = pf.TotalBalance,
                FinancialYear = pf.FinancialYear,
                Status = pf.Status.ToString()
            };
        }

        private PFWithdrawalDto MapToPFWithdrawalDto(PFWithdrawal w)
        {
            return new PFWithdrawalDto
            {
                Id = w.Id,
                EmployeeId = w.EmployeeId,
                EmployeeNumber = w.EmployeeNumber,
                EmployeeName = w.EmployeeName,
                WithdrawalAmount = w.WithdrawalAmount,
                PFBalance = w.PFBalance,
                WithdrawalType = w.WithdrawalType.ToString(),
                ApplicationDate = w.ApplicationDate,
                Status = w.Status.ToString(),
                TDSOnWithdrawal = w.TDSOnWithdrawal,
                ProcessedDate = w.ProcessedDate
            };
        }

        private EmployeeStateInsuranceDto MapToESIDto(EmployeeStateInsurance esi)
        {
            return new EmployeeStateInsuranceDto
            {
                Id = esi.Id,
                EmployeeId = esi.EmployeeId,
                EmployeeNumber = esi.EmployeeNumber,
                EmployeeName = esi.EmployeeName,
                ESINumber = esi.ESINumber,
                StateName = esi.StateName,
                IsESIEligible = esi.IsESIEligible,
                MonthlySalary = esi.MonthlySalary,
                EmployeeContribution = esi.EmployeeContribution,
                EmployerContribution = esi.EmployerContribution,
                TotalContribution = esi.TotalContribution,
                ContributionDays = esi.ContributionDays,
                Status = esi.Status.ToString()
            };
        }

        private IncomeTaxDto MapToIncomeTaxDto(IncomeTax it)
        {
            return new IncomeTaxDto
            {
                Id = it.Id,
                EmployeeId = it.EmployeeId,
                EmployeeNumber = it.EmployeeNumber,
                EmployeeName = it.EmployeeName,
                PAN = it.PAN,
                TaxRegime = it.TaxRegime.ToString(),
                GrossSalary = it.GrossSalary,
                StandardDeduction = it.StandardDeduction,
                TaxableIncome = it.TaxableIncome,
                TotalTaxLiability = it.TotalTaxLiability,
                TDSDeducted = it.TDSDeducted,
                TaxRefundable = it.TaxRefundable,
                FinancialYear = it.FinancialYear,
                Status = it.Status.ToString()
            };
        }

        private ProfessionalTaxDto MapToPTDto(ProfessionalTax pt)
        {
            return new ProfessionalTaxDto
            {
                Id = pt.Id,
                EmployeeId = pt.EmployeeId,
                EmployeeNumber = pt.EmployeeNumber,
                EmployeeName = pt.EmployeeName,
                StateName = pt.StateName,
                MonthlySalary = pt.MonthlySalary,
                PTDeduction = pt.PTDeduction,
                FinancialYear = pt.FinancialYear,
                IsPTExempt = pt.IsPTExempt,
                Status = pt.Status.ToString()
            };
        }

        private TaxDeclarationDto MapToTaxDeclarationDto(TaxDeclaration td)
        {
            return new TaxDeclarationDto
            {
                Id = td.Id,
                EmployeeId = td.EmployeeId,
                EmployeeName = td.EmployeeName,
                FinancialYear = td.FinancialYear,
                DeclarationDate = td.DeclarationDate,
                Section80C_Total = td.Section80C_Total,
                Section80D_Total = td.Section80D_Total,
                Section80G_Donation = td.Section80G_Donation,
                TotalDeductionsUnderOldRegime = td.TotalDeductionsUnderOldRegime,
                HRAClaim = td.HRAClaim,
                ProofSubmitted = td.ProofSubmitted,
                ProofSubmittedDate = td.ProofSubmittedDate,
                Status = td.Status.ToString()
            };
        }

        private ComplianceReportDto MapToComplianceReportDto(ComplianceReport cr)
        {
            return new ComplianceReportDto
            {
                Id = cr.Id,
                ReportType = cr.ReportType,
                FinancialYear = cr.FinancialYear,
                MonthYear = cr.MonthYear,
                GeneratedDate = cr.GeneratedDate,
                TotalEmployees = cr.TotalEmployees,
                TotalAmount = cr.TotalAmount,
                EmployeeContribution = cr.EmployeeContribution,
                EmployerContribution = cr.EmployerContribution,
                Status = cr.Status.ToString(),
                SubmittedDate = cr.SubmittedDate,
                ReferenceNumber = cr.ReferenceNumber,
                FileLocation = cr.FileLocation
            };
        }

        private ComplianceAuditDto MapToComplianceAuditDto(ComplianceAudit ca)
        {
            return new ComplianceAuditDto
            {
                Id = ca.Id,
                AuditType = ca.AuditType,
                FinancialYear = ca.FinancialYear,
                AuditDate = ca.AuditDate,
                AuditedByName = ca.AuditedByName,
                TotalRecordsChecked = ca.TotalRecordsChecked,
                DiscrepanciesFound = ca.DiscrepanciesFound,
                CorrectionsMade = ca.CorrectionsMade,
                Status = ca.Status.ToString(),
                CompletionDate = ca.CompletionDate
            };
        }

        private StatutorySettingsDto MapToStatutorySettingsDto(StatutorySettings setting)
        {
            return new StatutorySettingsDto
            {
                Id = setting.Id,
                SettingKey = setting.SettingKey,
                SettingValue = setting.SettingValue,
                FinancialYear = setting.FinancialYear,
                Description = setting.Description,
                EffectiveFrom = setting.EffectiveFrom,
                EffectiveTo = setting.EffectiveTo,
                IsActive = setting.IsActive
            };
        }

        private async Task<List<TaxSlabDto>> GetApplicableSlabsAsync(int financialYear, string regime, decimal taxableIncome)
        {
            var settings = await _repository.GetTaxSlabsByYearAsync(financialYear);
            var key = $"IT_SLAB_{regime.ToUpperInvariant()}_FY{financialYear}";
            var setting = settings.FirstOrDefault(s => s.SettingKey == key);
            if (setting == null || string.IsNullOrWhiteSpace(setting.SettingValue))
            {
                return new List<TaxSlabDto>();
            }

            try
            {
                var slabs = JsonSerializer.Deserialize<List<TaxSlabDto>>(setting.SettingValue) ?? new List<TaxSlabDto>();
                foreach (var slab in slabs)
                {
                    if (taxableIncome <= slab.From)
                    {
                        slab.Tax = 0m;
                        continue;
                    }

                    var upper = Math.Min(taxableIncome, slab.To);
                    var taxable = upper - slab.From;
                    slab.Tax = taxable > 0 ? taxable * slab.Rate : 0m;
                }

                return slabs;
            }
            catch (JsonException ex)
            {
                _logger.LogWarning(ex, "Invalid tax slab JSON for {Regime} FY{FinancialYear}", regime, financialYear);
                return new List<TaxSlabDto>();
            }
        }

        #endregion
    }
}
