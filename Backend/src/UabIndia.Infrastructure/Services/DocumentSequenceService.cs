using System;
using System.Collections.Concurrent;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Infrastructure.Services
{
    public class DocumentSequenceService : IDocumentSequenceService
    {
        private readonly ApplicationDbContext _db;
        private readonly ILogger<DocumentSequenceService> _logger;
        private static readonly ConcurrentDictionary<string, SemaphoreSlim> _locks = new();

        public DocumentSequenceService(ApplicationDbContext db, ILogger<DocumentSequenceService> logger)
        {
            _db = db;
            _logger = logger;
        }

        public async Task<string> GetNextSequenceNumberAsync(
            Guid tenantId,
            string documentType,
            string? prefix = null,
            CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(documentType))
                throw new ArgumentException("Document type must be specified.", nameof(documentType));

            var resolvedPrefix = prefix ?? ResolveDefaultPrefix(documentType);
            var lockKey = $"{tenantId}:{documentType}";
            var semaphore = _locks.GetOrAdd(lockKey, _ => new SemaphoreSlim(1, 1));

            await semaphore.WaitAsync(cancellationToken);
            try
            {
                var sequence = await _db.BusinessIdSequences
                    .FirstOrDefaultAsync(s => s.TenantId == tenantId && s.EntityName == documentType, cancellationToken);

                if (sequence == null)
                {
                    sequence = new BusinessIdSequence
                    {
                        Id = Guid.NewGuid(),
                        TenantId = tenantId,
                        EntityName = documentType,
                        Prefix = resolvedPrefix,
                        Padding = 5,
                        CurrentValue = 1,
                        UpdatedAt = DateTime.UtcNow
                    };
                    _db.BusinessIdSequences.Add(sequence);
                }
                else
                {
                    sequence.CurrentValue++;
                    sequence.UpdatedAt = DateTime.UtcNow;
                    if (!string.IsNullOrWhiteSpace(prefix))
                    {
                        sequence.Prefix = prefix;
                    }
                }

                await _db.SaveChangesAsync(cancellationToken);

                var year = DateTime.UtcNow.Year;
                var paddedNumber = sequence.CurrentValue.ToString($"D{Math.Max(sequence.Padding, 4)}");
                var formattedDocNumber = $"{sequence.Prefix}-{year}-{paddedNumber}";

                _logger.LogInformation("Generated document sequence {DocumentNumber} for tenant {TenantId} ({DocumentType})",
                    formattedDocNumber, tenantId, documentType);

                return formattedDocNumber;
            }
            finally
            {
                semaphore.Release();
            }
        }

        public async Task<long> GetCurrentSequenceValueAsync(
            Guid tenantId,
            string documentType,
            CancellationToken cancellationToken = default)
        {
            var sequence = await _db.BusinessIdSequences
                .AsNoTracking()
                .FirstOrDefaultAsync(s => s.TenantId == tenantId && s.EntityName == documentType, cancellationToken);

            return sequence?.CurrentValue ?? 0;
        }

        private static string ResolveDefaultPrefix(string documentType)
        {
            return documentType.ToLowerInvariant() switch
            {
                "salesinvoice" or "invoice" => "INV",
                "purchaseorder" or "po" => "PO",
                "salesorder" or "so" => "SO",
                "journalentry" or "jv" or "journal" => "JV",
                "payslip" or "salaryslip" => "PAY",
                "goodsreceipt" or "grn" => "GRN",
                "deliveryorder" or "do" => "DO",
                "customer" => "CUST",
                "vendor" or "supplier" => "VEND",
                "item" or "product" => "ITM",
                "asset" or "fixedasset" => "AST",
                "lead" or "crmlead" => "LEAD",
                _ => documentType.Length > 4 ? documentType.Substring(0, 4).ToUpperInvariant() : documentType.ToUpperInvariant()
            };
        }
    }
}
