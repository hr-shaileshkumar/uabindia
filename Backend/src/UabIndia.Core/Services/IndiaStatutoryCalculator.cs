using System;

namespace UabIndia.Core.Services
{
    /// <summary>
    /// India statutory calculators for PF, ESI, PT, income-tax TDS (FY 2025-26 new regime defaults),
    /// vendor TDS (Sections 194C, 194J, 194Q), and GST Section 170 rounding rules.
    /// Amounts are rounded to 2 decimals using away-from-zero.
    /// </summary>
    public static class IndiaStatutoryCalculator
    {
        public const decimal PfWageCeiling = 15000m;
        public const decimal EsiWageCeiling = 21000m;
        public const decimal EpsMonthlyCap = 1250m;
        public const decimal EmployeePfRate = 0.12m;
        public const decimal EmployerPfRate = 0.12m;
        public const decimal EpsRate = 0.0833m;
        public const decimal EdliRate = 0.005m;
        public const decimal AdminRate = 0.005m;
        public const decimal EsiEmployeeRate = 0.0075m;
        public const decimal EsiEmployerRate = 0.0325m;
        public const decimal NewRegimeStandardDeduction = 75000m;
        public const decimal OldRegimeStandardDeduction = 50000m;
        public const decimal NewRegimeRebateLimit = 1200000m;
        public const decimal OldRegimeRebateLimit = 500000m;
        public const decimal CessRate = 0.04m;

        // Payment of Gratuity Act 1972 (Section 4(3) Statutory Maximum Limit)
        public const decimal GratuityCeiling = 2000000m; // ₹20,00,000 (Twenty Lakhs)
        public const double GratuityQualifyingYears = 4.5d; // 5 years rule (4 years 240 days)

        // Payment of Bonus Act, 1965 (Section 2(13) & Section 12)
        public const decimal BonusEligibilityWageCeiling = 21000m; // ₹21,000 per month eligibility cap
        public const decimal BonusStatutoryCalculationCeiling = 7000m; // ₹7,000 per month calculation ceiling
        public const decimal BonusMinimumRate = 0.0833m; // 8.33% minimum statutory bonus
        public const decimal BonusMaximumRate = 0.20m;   // 20.00% maximum statutory bonus
        public const int BonusMinQualifyingWorkingDays = 30; // 30 days minimum service in accounting year

        // Vendor TDS Thresholds & Rates (Income Tax Act)
        public const decimal Tds194CSingleInvoiceThreshold = 30000m;
        public const decimal Tds194CAggregateThreshold = 100000m;
        public const decimal Tds194CIndividualRate = 0.01m; // 1%
        public const decimal Tds194CCorporateRate = 0.02m;  // 2%

        public const decimal Tds194JThreshold = 30000m;
        public const decimal Tds194JTechnicalRate = 0.02m;     // 2%
        public const decimal Tds194JProfessionalRate = 0.10m;  // 10%

        public const decimal Tds194QThreshold = 5000000m;      // 50 Lakhs
        public const decimal Tds194QRate = 0.001m;             // 0.1%

        public static decimal RoundMoney(decimal value) =>
            Math.Round(value, 2, MidpointRounding.AwayFromZero);

        public static bool AmountsEqual(decimal left, decimal right) =>
            RoundMoney(left) == RoundMoney(right);

        public static PfContribution CalculatePf(decimal basicSalary, decimal dearnessAllowance = 0m, decimal? wageCeiling = null)
        {
            var ceiling = wageCeiling is > 0 ? wageCeiling.Value : PfWageCeiling;
            var pfWages = Math.Min(Math.Max(0m, basicSalary + dearnessAllowance), ceiling);
            var employee = RoundMoney(pfWages * EmployeePfRate);
            var employerTotal = RoundMoney(pfWages * EmployerPfRate);
            var eps = RoundMoney(Math.Min(pfWages * EpsRate, EpsMonthlyCap));
            var employerEpf = RoundMoney(Math.Max(0m, employerTotal - eps));
            var admin = RoundMoney(pfWages * AdminRate);
            var edli = RoundMoney(pfWages * EdliRate);
            return new PfContribution(
                PfWages: pfWages,
                EmployeeContribution: employee,
                EmployerEpf: employerEpf,
                EmployerEps: eps,
                AdminCharges: admin,
                Edli: edli,
                TotalPf: employee + employerEpf + eps);
        }

        public static EsiContribution CalculateEsi(decimal monthlyGross, bool alreadyCovered = false, decimal? wageCeiling = null)
        {
            var ceiling = wageCeiling is > 0 ? wageCeiling.Value : EsiWageCeiling;
            var eligible = alreadyCovered || monthlyGross <= ceiling;
            if (!eligible || monthlyGross <= 0)
            {
                return new EsiContribution(0, false, 0, 0, 0);
            }

            var wages = Math.Min(monthlyGross, ceiling);
            var employee = RoundMoney(wages * EsiEmployeeRate);
            var employer = RoundMoney(wages * EsiEmployerRate);
            return new EsiContribution(wages, true, employee, employer, employee + employer);
        }

        public static decimal CalculateProfessionalTax(string? stateCode, decimal monthlySalary, int month)
        {
            var state = (stateCode ?? "KA").Trim().ToUpperInvariant();
            if (state.Length > 2) state = state[..2];
            var salary = Math.Max(0m, monthlySalary);

            return state switch
            {
                "MH" => salary <= 7500m ? 0m : salary <= 10000m ? 175m : 200m,
                "TN" => salary <= 21000m ? 0m : 208m,
                "WB" => salary <= 10000m ? 0m : salary <= 15000m ? 110m : salary <= 25000m ? 130m : 200m,
                "GJ" => salary <= 5999m ? 0m : salary <= 8999m ? 80m : salary <= 11999m ? 150m : 200m,
                "KA" => CalculateKarnatakaPt(salary, month),
                _ => salary <= 15000m ? 0m : salary <= 25000m ? 200m : 300m
            };
        }

        private static decimal CalculateKarnatakaPt(decimal salary, int month)
        {
            if (salary <= 15000m) return 0m;
            if (salary <= 25000m) return month == 2 ? 300m : 200m;
            return month == 2 ? 300m : 200m;
        }

        public static TdsResult CalculateMonthlyTds(
            decimal annualGross,
            TaxRegimeKind regime,
            decimal otherDeductions = 0m,
            int remainingMonths = 12)
        {
            var standard = regime == TaxRegimeKind.Old ? OldRegimeStandardDeduction : NewRegimeStandardDeduction;
            var taxable = Math.Max(0m, annualGross - standard - Math.Max(0m, otherDeductions));
            var baseTax = regime == TaxRegimeKind.Old
                ? TaxByOldSlabs(taxable)
                : TaxByNewSlabsFy2025(taxable);

            var rebateLimit = regime == TaxRegimeKind.Old ? OldRegimeRebateLimit : NewRegimeRebateLimit;
            var rebate = taxable <= rebateLimit ? baseTax : 0m;
            var afterRebate = Math.Max(0m, baseTax - rebate);
            var cess = RoundMoney(afterRebate * CessRate);
            var annual = RoundMoney(afterRebate + cess);
            var months = Math.Clamp(remainingMonths, 1, 12);
            return new TdsResult(
                TaxableIncome: RoundMoney(taxable),
                StandardDeduction: standard,
                Rebate: RoundMoney(rebate),
                AnnualTax: annual,
                MonthlyTds: RoundMoney(annual / months));
        }

        public static decimal TaxByNewSlabsFy2025(decimal taxable)
        {
            // Finance Act 2025 new regime (simplified): 0-4L nil, then 5/10/15/20/25/30.
            decimal tax = 0m;
            tax += Band(taxable, 400000m, 800000m, 0.05m);
            tax += Band(taxable, 800000m, 1200000m, 0.10m);
            tax += Band(taxable, 1200000m, 1600000m, 0.15m);
            tax += Band(taxable, 1600000m, 2000000m, 0.20m);
            tax += Band(taxable, 2000000m, 2400000m, 0.25m);
            tax += Band(taxable, 2400000m, decimal.MaxValue, 0.30m);
            return RoundMoney(tax);
        }

        public static decimal TaxByOldSlabs(decimal taxable)
        {
            decimal tax = 0m;
            tax += Band(taxable, 250000m, 500000m, 0.05m);
            tax += Band(taxable, 500000m, 1000000m, 0.20m);
            tax += Band(taxable, 1000000m, decimal.MaxValue, 0.30m);
            return RoundMoney(tax);
        }

        private static decimal Band(decimal income, decimal from, decimal to, decimal rate)
        {
            if (income <= from) return 0m;
            var span = Math.Min(income, to) - from;
            return span * rate;
        }

        /// <summary>
        /// Calculates TDS under Section 194C on Contractor/Subcontractor payments.
        /// Applies 1% for Individuals/HUFs and 2% for Corporate entities.
        /// Threshold: Single invoice >= ₹30,000 or cumulative FY amount >= ₹100,000.
        /// </summary>
        public static VendorTdsResult CalculateTdsContractor194C(
            decimal invoiceAmount,
            bool isIndividualOrHuf,
            decimal cumulativeFyAmount = 0m)
        {
            var amount = Math.Max(0m, invoiceAmount);
            var totalCumulative = cumulativeFyAmount + amount;
            var isThresholdExceeded = amount >= Tds194CSingleInvoiceThreshold || totalCumulative >= Tds194CAggregateThreshold;

            if (!isThresholdExceeded)
            {
                return new VendorTdsResult("194C", 0m, 0m, amount, false);
            }

            var rate = isIndividualOrHuf ? Tds194CIndividualRate : Tds194CCorporateRate;
            var tds = RoundMoney(amount * rate);
            return new VendorTdsResult("194C", rate, tds, amount - tds, true);
        }

        /// <summary>
        /// Calculates TDS under Section 194J on Professional or Technical fees.
        /// Applies 10% for Professional Services and 2% for Technical Services.
        /// Threshold: Cumulative FY amount >= ₹30,000.
        /// </summary>
        public static VendorTdsResult CalculateTdsProfessional194J(
            decimal invoiceAmount,
            bool isTechnicalService,
            decimal cumulativeFyAmount = 0m)
        {
            var amount = Math.Max(0m, invoiceAmount);
            var totalCumulative = cumulativeFyAmount + amount;
            var isThresholdExceeded = totalCumulative >= Tds194JThreshold;

            if (!isThresholdExceeded)
            {
                return new VendorTdsResult("194J", 0m, 0m, amount, false);
            }

            var rate = isTechnicalService ? Tds194JTechnicalRate : Tds194JProfessionalRate;
            var tds = RoundMoney(amount * rate);
            return new VendorTdsResult("194J", rate, tds, amount - tds, true);
        }

        /// <summary>
        /// Calculates TDS under Section 194Q on Purchase of Goods exceeding ₹50,00,000 in a FY.
        /// Rate: 0.1% on the amount exceeding the threshold.
        /// </summary>
        public static VendorTdsResult CalculateTdsGoods194Q(
            decimal invoiceAmount,
            decimal cumulativeFyAmount = 0m)
        {
            var amount = Math.Max(0m, invoiceAmount);
            var prior = Math.Max(0m, cumulativeFyAmount);

            if (prior + amount <= Tds194QThreshold)
            {
                return new VendorTdsResult("194Q", 0m, 0m, amount, false);
            }

            var taxablePortion = prior >= Tds194QThreshold
                ? amount
                : (prior + amount) - Tds194QThreshold;

            var tds = RoundMoney(taxablePortion * Tds194QRate);
            return new VendorTdsResult("194Q", Tds194QRate, tds, amount - tds, true);
        }

        /// <summary>
        /// Calculates Invoice Rounding Off according to Section 170 of the CGST Act.
        /// Rounds total invoice amount to the nearest whole rupee with away-from-zero logic.
        /// </summary>
        public static InvoiceRoundOffResult CalculateRoundOff(decimal amount)
        {
            var rounded = Math.Round(amount, 0, MidpointRounding.AwayFromZero);
            var delta = RoundMoney(rounded - amount);
            return new InvoiceRoundOffResult(rounded, delta);
        }

        /// <summary>
        /// Calculates statutory gratuity under Section 4(2) &amp; 4(3) of Payment of Gratuity Act 1972.
        /// Formula: (15 * Last Drawn Basic * completed years of service) / 26
        /// Capped at the statutory maximum limit of ₹20,00,000.
        /// </summary>
        public static decimal CalculateGratuity(decimal lastDrawnBasic, double completedYears, decimal? ceiling = null)
        {
            if (completedYears < GratuityQualifyingYears || lastDrawnBasic <= 0)
            {
                return 0m;
            }

            var yearsRounded = (decimal)Math.Round(completedYears, 0, MidpointRounding.AwayFromZero);
            var rawGratuity = RoundMoney(lastDrawnBasic * 15m / 26m * yearsRounded);
            var maxCeiling = ceiling is > 0 ? ceiling.Value : GratuityCeiling;
            return Math.Min(rawGratuity, maxCeiling);
        }

        /// <summary>
        /// Calculates statutory Labour Welfare Fund (LWF) contributions by state and calendar month.
        /// Adheres to State Labour Welfare Fund Acts deduction schedules.
        /// </summary>
        public static LwfContribution CalculateLwf(string? stateCode, decimal monthlyGross, int month)
        {
            var state = (stateCode ?? "KA").Trim().ToUpperInvariant();
            if (state.Length > 2) state = state[..2];

            if (monthlyGross <= 0)
            {
                return new LwfContribution(0m, 0m, 0m, false);
            }

            return state switch
            {
                "MH" => (month == 6 || month == 12)
                    ? new LwfContribution(25m, 75m, 100m, true)
                    : new LwfContribution(0m, 0m, 0m, false),

                "KA" => (month == 12)
                    ? new LwfContribution(20m, 40m, 60m, true)
                    : new LwfContribution(0m, 0m, 0m, false),

                "TN" => (month == 12)
                    ? new LwfContribution(20m, 40m, 60m, true)
                    : new LwfContribution(0m, 0m, 0m, false),

                "DL" => new LwfContribution(0.75m, 2.25m, 3.00m, true),

                "GJ" => (month == 6 || month == 12)
                    ? new LwfContribution(6m, 12m, 18m, true)
                    : new LwfContribution(0m, 0m, 0m, false),

                "HR" => CalculateHaryanaLwf(monthlyGross),

                "TS" or "AP" => (month == 12)
                    ? new LwfContribution(20m, 50m, 70m, true)
                    : new LwfContribution(0m, 0m, 0m, false),

                _ => new LwfContribution(0m, 0m, 0m, false)
            };
        }

        private static LwfContribution CalculateHaryanaLwf(decimal monthlyGross)
        {
            var ee = RoundMoney(Math.Min(25m, monthlyGross * 0.002m));
            var er = RoundMoney(Math.Min(50m, ee * 2m));
            return new LwfContribution(ee, er, ee + er, true);
        }

        /// <summary>
        /// Calculates statutory annual bonus under the Payment of Bonus Act, 1965.
        /// Eligibility: Monthly gross <= ₹21,000 and worked >= 30 days in accounting year.
        /// Calculation ceiling: ₹7,000/month or state minimum wage, whichever is higher.
        /// Statutory percentage: 8.33% (minimum) to 20.00% (maximum).
        /// </summary>
        public static BonusCalculationResult CalculateStatutoryBonus(
            decimal monthlyBasic,
            decimal monthlyGross,
            int workingDaysInYear,
            decimal bonusPercentage = 0.0833m,
            decimal? stateMinimumWage = null)
        {
            var isEligibleBySalary = monthlyGross <= BonusEligibilityWageCeiling;
            var isEligibleByDays = workingDaysInYear >= BonusMinQualifyingWorkingDays;
            var isEligible = isEligibleBySalary && isEligibleByDays;

            if (!isEligible)
            {
                return new BonusCalculationResult(
                    IsEligible: false,
                    BonusWagesPerMonth: 0m,
                    AnnualBonusWages: 0m,
                    BonusPercentage: bonusPercentage,
                    BonusAmount: 0m,
                    DisqualificationReason: !isEligibleBySalary
                        ? $"Monthly gross (₹{monthlyGross:N2}) exceeds statutory eligibility ceiling of ₹{BonusEligibilityWageCeiling:N2}."
                        : $"Working days ({workingDaysInYear}) are less than statutory threshold of {BonusMinQualifyingWorkingDays} days.");
            }

            var calculationCeiling = Math.Max(BonusStatutoryCalculationCeiling, stateMinimumWage ?? 0m);
            var monthlyBonusWage = Math.Min(monthlyBasic > 0 ? monthlyBasic : monthlyGross, calculationCeiling);

            var annualBonusWages = RoundMoney(monthlyBonusWage * 12m * (Math.Min(workingDaysInYear, 365) / 365m));
            var effectiveRate = Math.Clamp(bonusPercentage, BonusMinimumRate, BonusMaximumRate);
            var computedBonus = RoundMoney(annualBonusWages * effectiveRate);
            var finalBonus = Math.Max(100m, computedBonus);

            return new BonusCalculationResult(
                IsEligible: true,
                BonusWagesPerMonth: monthlyBonusWage,
                AnnualBonusWages: annualBonusWages,
                BonusPercentage: effectiveRate,
                BonusAmount: finalBonus,
                DisqualificationReason: null);
        }

        /// <summary>
        /// Audits employee wage against state-notified Minimum Wages Act thresholds by skill classification.
        /// Flags potential statutory non-compliance warnings if actual basic + DA falls below threshold.
        /// </summary>
        public static MinimumWageComplianceResult ValidateMinimumWage(
            string? stateCode,
            string? skillCategory,
            decimal monthlyBasic,
            decimal monthlyGross)
        {
            var state = (stateCode ?? "KA").Trim().ToUpperInvariant();
            if (state.Length > 2) state = state[..2];

            var skill = (skillCategory ?? "Skilled").Trim().ToLowerInvariant();
            var minWage = GetStatutoryMinimumWage(state, skill);
            var wage = monthlyBasic > 0 ? monthlyBasic : monthlyGross;

            if (wage >= minWage)
            {
                return new MinimumWageComplianceResult(
                    IsCompliant: true,
                    StatutoryMinimumWage: minWage,
                    ActualWage: wage,
                    Shortfall: 0m,
                    Message: "Compliant with State Minimum Wages Act notification.");
            }

            var shortfall = RoundMoney(minWage - wage);
            return new MinimumWageComplianceResult(
                IsCompliant: false,
                StatutoryMinimumWage: minWage,
                ActualWage: wage,
                Shortfall: shortfall,
                Message: $"Non-compliant: Wage (₹{wage:N2}) is below notified minimum wage (₹{minWage:N2}) for {state} [{skillCategory}]. Shortfall: ₹{shortfall:N2}.");
        }

        public static decimal GetStatutoryMinimumWage(string state, string skill)
        {
            return (state, skill) switch
            {
                ("KA", "unskilled") => 15400m,
                ("KA", "semi-skilled") => 16600m,
                ("KA", "skilled") => 18000m,
                ("KA", "highly skilled") => 19800m,

                ("MH", "unskilled") => 13800m,
                ("MH", "semi-skilled") => 15200m,
                ("MH", "skilled") => 16800m,
                ("MH", "highly skilled") => 18500m,

                ("DL", "unskilled") => 18066m,
                ("DL", "semi-skilled") => 19929m,
                ("DL", "skilled") => 21917m,
                ("DL", "highly skilled") => 23500m,

                ("TN", "unskilled") => 12500m,
                ("TN", "semi-skilled") => 13800m,
                ("TN", "skilled") => 15200m,
                ("TN", "highly skilled") => 16800m,

                ("WB", "unskilled") => 10200m,
                ("WB", "semi-skilled") => 11300m,
                ("WB", "skilled") => 12400m,
                ("WB", "highly skilled") => 13800m,

                _ => skill switch
                {
                    "unskilled" => 10000m,
                    "semi-skilled" => 11500m,
                    "highly skilled" => 15000m,
                    _ => 13000m
                }
            };
        }
    }

    public enum TaxRegimeKind
    {
        New = 0,
        Old = 1
    }

    public readonly record struct PfContribution(
        decimal PfWages,
        decimal EmployeeContribution,
        decimal EmployerEpf,
        decimal EmployerEps,
        decimal AdminCharges,
        decimal Edli,
        decimal TotalPf);

    public readonly record struct EsiContribution(
        decimal EsiWages,
        bool IsEligible,
        decimal EmployeeContribution,
        decimal EmployerContribution,
        decimal Total);

    public readonly record struct TdsResult(
        decimal TaxableIncome,
        decimal StandardDeduction,
        decimal Rebate,
        decimal AnnualTax,
        decimal MonthlyTds);

    public readonly record struct VendorTdsResult(
        string Section,
        decimal TaxRate,
        decimal TdsAmount,
        decimal NetPayable,
        bool IsDeducted);

    public readonly record struct InvoiceRoundOffResult(
        decimal RoundedTotal,
        decimal RoundOffAdjustment);

    public readonly record struct LwfContribution(
        decimal EmployeeContribution,
        decimal EmployerContribution,
        decimal TotalContribution,
        bool IsDeductionMonth);

    public readonly record struct BonusCalculationResult(
        bool IsEligible,
        decimal BonusWagesPerMonth,
        decimal AnnualBonusWages,
        decimal BonusPercentage,
        decimal BonusAmount,
        string? DisqualificationReason);

    public readonly record struct MinimumWageComplianceResult(
        bool IsCompliant,
        decimal StatutoryMinimumWage,
        decimal ActualWage,
        decimal Shortfall,
        string Message);
}
