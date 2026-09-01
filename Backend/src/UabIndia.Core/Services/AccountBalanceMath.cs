using System;

namespace UabIndia.Core.Services
{
    public static class AccountBalanceMath
    {
        public static decimal Apply(string accountType, decimal currentBalance, decimal debit, decimal credit)
        {
            var type = (accountType ?? string.Empty).Trim().ToLowerInvariant();
            var isCreditNormal = type.Contains("liab") || type.Contains("equity") || type.Contains("capital")
                                 || type.Contains("revenue") || type.Contains("income");
            return isCreditNormal
                ? currentBalance + credit - debit
                : currentBalance + debit - credit;
        }

        public static (decimal debit, decimal credit) SplitForTrialBalance(string accountType, decimal balance)
        {
            var type = (accountType ?? string.Empty).Trim().ToLowerInvariant();
            var isCreditNormal = type.Contains("liab") || type.Contains("equity") || type.Contains("capital")
                                 || type.Contains("revenue") || type.Contains("income");
            if (isCreditNormal)
            {
                return balance >= 0 ? (0, balance) : (-balance, 0);
            }

            return balance >= 0 ? (balance, 0) : (0, -balance);
        }
    }
}
