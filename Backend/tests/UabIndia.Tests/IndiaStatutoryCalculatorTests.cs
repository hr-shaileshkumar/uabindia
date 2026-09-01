using System;
using System.Linq;
using Xunit;
using UabIndia.Core.Services;
using UabIndia.Infrastructure.Services;

namespace UabIndia.Tests
{
    public class IndiaStatutoryCalculatorTests
    {
        [Fact]
        public void CalculatePf_UsesCeilingAndCorrectEmployerSplit()
        {
            var pf = IndiaStatutoryCalculator.CalculatePf(20000m);

            Assert.Equal(15000m, pf.PfWages);
            Assert.Equal(1800m, pf.EmployeeContribution);
            Assert.Equal(1249.50m, pf.EmployerEps);
            Assert.Equal(550.50m, pf.EmployerEpf);
            Assert.Equal(75m, pf.AdminCharges);
            Assert.Equal(75m, pf.Edli);
            Assert.Equal(3600m, pf.TotalPf);
        }

        [Fact]
        public void CalculateEsi_AboveCeiling_IsNotEligible()
        {
            var esi = IndiaStatutoryCalculator.CalculateEsi(30000m);
            Assert.False(esi.IsEligible);
            Assert.Equal(0m, esi.EmployeeContribution);
            Assert.Equal(0m, esi.Total);
        }

        [Fact]
        public void CalculateEsi_BelowCeiling_AppliesRates()
        {
            var esi = IndiaStatutoryCalculator.CalculateEsi(20000m);
            Assert.True(esi.IsEligible);
            Assert.Equal(150m, esi.EmployeeContribution);
            Assert.Equal(650m, esi.EmployerContribution);
        }

        [Fact]
        public void Gst_IntraState_SplitsCgstSgst()
        {
            var gst = GstCalculator.Calculate(10000m, 18m, false);
            Assert.Equal(1800m, gst.Cgst + gst.Sgst);
            Assert.Equal(0m, gst.Igst);
            Assert.Equal(11800m, gst.InvoiceTotal);
        }

        [Fact]
        public void CalculateMonthlyTds_NewRegimeRebateAtTwelveLakh()
        {
            var tds = IndiaStatutoryCalculator.CalculateMonthlyTds(1200000m, TaxRegimeKind.New);
            Assert.Equal(0m, tds.AnnualTax);
            Assert.Equal(0m, tds.MonthlyTds);
        }

        [Fact]
        public void CalculateProfessionalTax_KarnatakaFebruarySurcharge()
        {
            Assert.Equal(0m, IndiaStatutoryCalculator.CalculateProfessionalTax("KA", 14000m, 1));
            Assert.Equal(200m, IndiaStatutoryCalculator.CalculateProfessionalTax("KA", 26000m, 1));
            Assert.Equal(300m, IndiaStatutoryCalculator.CalculateProfessionalTax("KA", 26000m, 2));
        }

        [Fact]
        public void Gst_InterState_UsesIgst()
        {
            var gst = GstCalculator.Calculate(10000m, 18m, true);
            Assert.Equal(1800m, gst.Igst);
            Assert.Equal(0m, gst.Cgst);
            Assert.Equal(11800m, gst.InvoiceTotal);
            Assert.True(GstCalculator.IsInterState("KA", "MH"));
            Assert.False(GstCalculator.IsInterState("KA", "Karnataka"));
        }

        [Fact]
        public void Tds194C_IndividualAndCorporateRates_WithThresholdValidation()
        {
            // Case 1: Below single invoice and aggregate threshold => No TDS
            var res1 = IndiaStatutoryCalculator.CalculateTdsContractor194C(25000m, isIndividualOrHuf: true, cumulativeFyAmount: 0m);
            Assert.False(res1.IsDeducted);
            Assert.Equal(0m, res1.TdsAmount);
            Assert.Equal(25000m, res1.NetPayable);

            // Case 2: Above single invoice threshold (₹50,000) for Individual => 1% (₹500)
            var res2 = IndiaStatutoryCalculator.CalculateTdsContractor194C(50000m, isIndividualOrHuf: true);
            Assert.True(res2.IsDeducted);
            Assert.Equal(0.01m, res2.TaxRate);
            Assert.Equal(500m, res2.TdsAmount);
            Assert.Equal(49500m, res2.NetPayable);

            // Case 3: Above single invoice threshold (₹50,000) for Corporate => 2% (₹1,000)
            var res3 = IndiaStatutoryCalculator.CalculateTdsContractor194C(50000m, isIndividualOrHuf: false);
            Assert.True(res3.IsDeducted);
            Assert.Equal(0.02m, res3.TaxRate);
            Assert.Equal(1000m, res3.TdsAmount);
            Assert.Equal(49000m, res3.NetPayable);

            // Case 4: Single invoice is small (₹20,000) but cumulative exceeds ₹100,000 => Triggers TDS
            var res4 = IndiaStatutoryCalculator.CalculateTdsContractor194C(20000m, isIndividualOrHuf: false, cumulativeFyAmount: 90000m);
            Assert.True(res4.IsDeducted);
            Assert.Equal(400m, res4.TdsAmount);
            Assert.Equal(19600m, res4.NetPayable);
        }

        [Fact]
        public void Tds194J_ProfessionalVsTechnicalRates_WithThresholdValidation()
        {
            // Case 1: Below ₹30,000 cumulative threshold => No TDS
            var res1 = IndiaStatutoryCalculator.CalculateTdsProfessional194J(20000m, isTechnicalService: false, cumulativeFyAmount: 0m);
            Assert.False(res1.IsDeducted);
            Assert.Equal(0m, res1.TdsAmount);

            // Case 2: Professional fees exceeding ₹30,000 => 10%
            var res2 = IndiaStatutoryCalculator.CalculateTdsProfessional194J(50000m, isTechnicalService: false);
            Assert.True(res2.IsDeducted);
            Assert.Equal(0.10m, res2.TaxRate);
            Assert.Equal(5000m, res2.TdsAmount);
            Assert.Equal(45000m, res2.NetPayable);

            // Case 3: Technical fees exceeding ₹30,000 => 2%
            var res3 = IndiaStatutoryCalculator.CalculateTdsProfessional194J(50000m, isTechnicalService: true);
            Assert.True(res3.IsDeducted);
            Assert.Equal(0.02m, res3.TaxRate);
            Assert.Equal(1000m, res3.TdsAmount);
            Assert.Equal(49000m, res3.NetPayable);
        }

        [Fact]
        public void Tds194Q_GoodsPurchase_ExceedingFiftyLakhsThreshold()
        {
            // Case 1: Prior cumulative ₹40 Lakhs + Current ₹5 Lakhs = ₹45 Lakhs (under threshold)
            var res1 = IndiaStatutoryCalculator.CalculateTdsGoods194Q(500000m, cumulativeFyAmount: 4000000m);
            Assert.False(res1.IsDeducted);

            // Case 2: Prior cumulative ₹45 Lakhs + Current ₹15 Lakhs = ₹60 Lakhs (exceeds by ₹10 Lakhs)
            // 0.1% on ₹10 Lakhs = ₹1,000
            var res2 = IndiaStatutoryCalculator.CalculateTdsGoods194Q(1500000m, cumulativeFyAmount: 4500000m);
            Assert.True(res2.IsDeducted);
            Assert.Equal(1000m, res2.TdsAmount);
            Assert.Equal(1499000m, res2.NetPayable);
        }

        [Fact]
        public void Section170_GstRoundOff_RoundsToNearestRupee()
        {
            var round1 = IndiaStatutoryCalculator.CalculateRoundOff(1234.49m);
            Assert.Equal(1234.00m, round1.RoundedTotal);
            Assert.Equal(-0.49m, round1.RoundOffAdjustment);

            var round2 = IndiaStatutoryCalculator.CalculateRoundOff(1234.50m);
            Assert.Equal(1235.00m, round2.RoundedTotal);
            Assert.Equal(0.50m, round2.RoundOffAdjustment);
        }

        [Fact]
        public void CommercialLedgerLines_PurchaseInvoice_RcmAndTdsDoubleEntryBalances()
        {
            var gst = GstCalculator.Calculate(100000m, 18m, false); // CGST 9000, SGST 9000, Total 118000
            var tds = 2000m; // 2% TDS on ₹100,000

            // Forward charge with TDS
            var linesStandard = CommercialLedgerLines.PurchaseInvoice(
                total: gst.InvoiceTotal,
                taxable: 100000m,
                gst: gst,
                discount: 0m,
                isRcm: false,
                tdsAmount: tds);

            var totalDebitStd = linesStandard.Sum(l => l.Debit);
            var totalCreditStd = linesStandard.Sum(l => l.Credit);
            Assert.Equal(totalDebitStd, totalCreditStd); // Strictly balanced!

            // RCM with TDS
            var linesRcm = CommercialLedgerLines.PurchaseInvoice(
                total: gst.InvoiceTotal,
                taxable: 100000m,
                gst: gst,
                discount: 0m,
                isRcm: true,
                tdsAmount: tds);

            var totalDebitRcm = linesRcm.Sum(l => l.Debit);
            var totalCreditRcm = linesRcm.Sum(l => l.Credit);
            Assert.Equal(totalDebitRcm, totalCreditRcm); // Strictly balanced!

            // Verify AP under RCM is only taxable - TDS = ₹98,000 (vendor does not get GST)
            var apLine = linesRcm.First(l => l.AccountCode == "2100");
            Assert.Equal(98000m, apLine.Credit);
        }

        [Fact]
        public void AccountBalance_DebitNormalIncreasesOnDebit()
        {
            var next = AccountBalanceMath.Apply("Asset", 1000m, 250m, 0m);
            Assert.Equal(1250m, next);
            var split = AccountBalanceMath.SplitForTrialBalance("Revenue", 500m);
            Assert.Equal(0m, split.debit);
            Assert.Equal(500m, split.credit);
        }

        [Fact]
        public void AccountBalance_CreditNormalIncreasesOnCredit()
        {
            var next = AccountBalanceMath.Apply("Liability", 1000m, 0m, 250m);
            Assert.Equal(1250m, next);
        }
    }
}
