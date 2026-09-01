using System;

namespace UabIndia.Core.Services
{
    /// <summary>
    /// Commercial documents freeze on convert/post. Corrections are a new reversing document.
    /// </summary>
    public static class DocumentLifecycle
    {
        public const string ReverseInstead =
            "Create a reversing document instead of editing a locked one.";

        public static bool IsLockedQuotation(string? status) =>
            EqualsAny(status, "Accepted", "Rejected", "Expired");

        public static bool IsLockedSalesOrder(string? status) =>
            EqualsAny(status, "Invoiced", "Completed", "Cancelled");

        public static bool IsPostedInvoice(Guid? journalEntryId) => journalEntryId.HasValue;

        public static bool CanConvertQuotation(string? status) =>
            !EqualsAny(status, "Rejected", "Expired");

        public static bool CanConvertSalesOrder(string? status) =>
            !EqualsAny(status, "Cancelled");

        public static void EnsureMutable(string documentName, bool locked)
        {
            if (locked)
                throw new InvalidOperationException($"{documentName} is locked. {ReverseInstead}");
        }

        private static bool EqualsAny(string? status, params string[] values)
        {
            if (string.IsNullOrWhiteSpace(status))
                return false;

            foreach (var value in values)
            {
                if (string.Equals(status.Trim(), value, StringComparison.OrdinalIgnoreCase))
                    return true;
            }

            return false;
        }
    }
}
