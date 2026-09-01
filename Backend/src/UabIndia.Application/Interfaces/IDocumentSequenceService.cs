using System;
using System.Threading;
using System.Threading.Tasks;

namespace UabIndia.Application.Interfaces
{
    public interface IDocumentSequenceService
    {
        /// <summary>
        /// Generates the next sequential, atomic document number for a given document type.
        /// Example formats: "INV-2026-00001", "PO-2026-00001", "SO-2026-00001", "JV-2026-00001", "PAY-2026-00001"
        /// </summary>
        /// <param name="tenantId">Active tenant ID</param>
        /// <param name="documentType">Document type identifier (e.g., "SalesInvoice", "PurchaseOrder", "SalesOrder", "JournalEntry", "Payslip")</param>
        /// <param name="prefix">Custom prefix (defaults to standard document prefix if null)</param>
        /// <param name="cancellationToken">Cancellation token</param>
        /// <returns>Formatted unique sequential document code</returns>
        Task<string> GetNextSequenceNumberAsync(
            Guid tenantId,
            string documentType,
            string? prefix = null,
            CancellationToken cancellationToken = default);

        /// <summary>
        /// Peeks the current sequence number for a document type without incrementing.
        /// </summary>
        Task<long> GetCurrentSequenceValueAsync(
            Guid tenantId,
            string documentType,
            CancellationToken cancellationToken = default);
    }
}
