using System;
using System.Collections.Generic;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Services;

namespace UabIndia.Infrastructure.Services
{
    public static class CommercialLedgerLines
    {
        public static IReadOnlyList<LedgerLine> SalesInvoice(decimal total, decimal taxable, GstBreakdown gst, decimal discount) =>
            SalesInvoice(total, taxable, gst, discount, 0m);

        public static IReadOnlyList<LedgerLine> SalesInvoice(
            decimal total,
            decimal taxable,
            GstBreakdown gst,
            decimal discount,
            decimal roundOff)
        {
            var customerReceivable = total + roundOff;
            var lines = new List<LedgerLine>
            {
                new LedgerLine("1100", "Accounts Receivable", "Asset", customerReceivable, 0),
                new LedgerLine("4000", "Sales Revenue", "Revenue", 0, taxable)
            };

            if (gst.Cgst > 0) lines.Add(new LedgerLine("2201", "CGST Payable", "Liability", 0, gst.Cgst));
            if (gst.Sgst > 0) lines.Add(new LedgerLine("2202", "SGST Payable", "Liability", 0, gst.Sgst));
            if (gst.Igst > 0) lines.Add(new LedgerLine("2203", "IGST Payable", "Liability", 0, gst.Igst));

            if (discount > 0)
            {
                lines.Add(new LedgerLine("4101", "Discount Allowed", "Expense", discount, 0));
            }

            if (roundOff > 0)
            {
                lines.Add(new LedgerLine("4201", "Rounding Off Reserve", "Revenue", 0, roundOff));
            }
            else if (roundOff < 0)
            {
                lines.Add(new LedgerLine("5201", "Rounding Off Adjustment", "Expense", Math.Abs(roundOff), 0));
            }

            return lines;
        }

        public static IReadOnlyList<LedgerLine> PurchaseInvoice(decimal total, decimal taxable, GstBreakdown gst, decimal discount) =>
            PurchaseInvoice(total, taxable, gst, discount, false, 0m, 0m);

        public static IReadOnlyList<LedgerLine> PurchaseInvoice(
            decimal total,
            decimal taxable,
            GstBreakdown gst,
            decimal discount,
            bool isRcm,
            decimal tdsAmount = 0m,
            decimal roundOff = 0m)
        {
            var lines = new List<LedgerLine>
            {
                new LedgerLine("5101", "Purchase Expense", "Expense", taxable, 0)
            };

            if (discount > 0)
            {
                lines.Add(new LedgerLine("4102", "Discount Received", "Revenue", 0, discount));
            }

            if (isRcm)
            {
                // Under RCM: Recipient claims ITC and pays GST to government; vendor is not paid GST.
                if (gst.Cgst > 0) lines.Add(new LedgerLine("1304", "RCM CGST Input", "Asset", gst.Cgst, 0));
                if (gst.Sgst > 0) lines.Add(new LedgerLine("1305", "RCM SGST Input", "Asset", gst.Sgst, 0));
                if (gst.Igst > 0) lines.Add(new LedgerLine("1306", "RCM IGST Input", "Asset", gst.Igst, 0));

                if (gst.Cgst > 0) lines.Add(new LedgerLine("2204", "RCM CGST Payable", "Liability", 0, gst.Cgst));
                if (gst.Sgst > 0) lines.Add(new LedgerLine("2205", "RCM SGST Payable", "Liability", 0, gst.Sgst));
                if (gst.Igst > 0) lines.Add(new LedgerLine("2206", "RCM IGST Payable", "Liability", 0, gst.Igst));

                var vendorPayable = Math.Max(0m, taxable - discount - tdsAmount + roundOff);
                lines.Add(new LedgerLine("2100", "Accounts Payable", "Liability", 0, vendorPayable));
            }
            else
            {
                // Standard Forward Charge
                if (gst.Cgst > 0) lines.Add(new LedgerLine("1301", "CGST Input", "Asset", gst.Cgst, 0));
                if (gst.Sgst > 0) lines.Add(new LedgerLine("1302", "SGST Input", "Asset", gst.Sgst, 0));
                if (gst.Igst > 0) lines.Add(new LedgerLine("1303", "IGST Input", "Asset", gst.Igst, 0));

                var vendorPayable = Math.Max(0m, total - tdsAmount + roundOff);
                lines.Add(new LedgerLine("2100", "Accounts Payable", "Liability", 0, vendorPayable));
            }

            if (tdsAmount > 0)
            {
                lines.Add(new LedgerLine("2210", "TDS Payable", "Liability", 0, tdsAmount));
            }

            if (roundOff > 0)
            {
                lines.Add(new LedgerLine("5201", "Rounding Off Adjustment", "Expense", roundOff, 0));
            }
            else if (roundOff < 0)
            {
                lines.Add(new LedgerLine("4201", "Rounding Off Reserve", "Revenue", 0, Math.Abs(roundOff)));
            }

            return lines;
        }

        public static IReadOnlyList<LedgerLine> Payment(bool received, decimal amount) =>
            received
                ? new[]
                {
                    new LedgerLine("1110", "Bank", "Asset", amount, 0, "Receipt"),
                    new LedgerLine("1100", "Accounts Receivable", "Asset", 0, amount, "AR settlement")
                }
                : new[]
                {
                    new LedgerLine("2100", "Accounts Payable", "Liability", amount, 0, "AP settlement"),
                    new LedgerLine("1110", "Bank", "Asset", 0, amount, "Payment")
                };

        public static IReadOnlyList<LedgerLine> ExpensePayment(decimal amount, string title, string creditNarration) =>
            new[]
            {
                new LedgerLine("5200", "Employee Expenses", "Expense", amount, 0, title),
                new LedgerLine("1110", "Bank", "Asset", 0, amount, creditNarration)
            };

        public static IReadOnlyList<LedgerLine> SalesReturn(decimal amount) =>
            new[]
            {
                new LedgerLine("4000", "Sales Revenue", "Revenue", amount, 0, "Return"),
                new LedgerLine("1100", "Accounts Receivable", "Asset", 0, amount, "Credit note")
            };

        public static IReadOnlyList<LedgerLine> CostOfGoodsSold(decimal cost) =>
            new[]
            {
                new LedgerLine("5001", "Cost of Goods Sold", "Expense", cost, 0, "COGS"),
                new LedgerLine("1400", "Inventory Asset", "Asset", 0, cost, "Stock issue")
            };

        public static IReadOnlyList<LedgerLine> InventoryRestock(decimal cost) =>
            new[]
            {
                new LedgerLine("1400", "Inventory Asset", "Asset", cost, 0, "Stock return"),
                new LedgerLine("5001", "Cost of Goods Sold", "Expense", 0, cost, "COGS reversal")
            };

        public static IReadOnlyList<LedgerLine> FinalSettlement(decimal total) =>
            total >= 0
                ? new[]
                {
                    new LedgerLine("5100", "Salary Expense", "Expense", total, 0, "F&F payout"),
                    new LedgerLine("2101", "Salary Payable", "Liability", 0, total, "F&F payable")
                }
                : new[]
                {
                    new LedgerLine("1320", "Employee Recoverable", "Asset", Math.Abs(total), 0, "F&F recovery"),
                    new LedgerLine("4200", "Recovery Income", "Revenue", 0, Math.Abs(total), "F&F recovery")
                };
    }
}
