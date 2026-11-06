using System;
using System.IO;
using System.Threading;
using System.Threading.Tasks;

namespace UabIndia.Application.Interfaces
{
    public interface IStorageProvider
    {
        string ProviderName { get; }

        Task<string> UploadFileAsync(
            Stream fileStream,
            string fileName,
            string contentType,
            Guid tenantId,
            string? folder = null,
            CancellationToken cancellationToken = default);

        Task<Stream> DownloadFileAsync(
            string storageKey,
            Guid tenantId,
            CancellationToken cancellationToken = default);

        Task<bool> DeleteFileAsync(
            string storageKey,
            Guid tenantId,
            CancellationToken cancellationToken = default);

        Task<string> GetPreSignedUrlAsync(
            string storageKey,
            Guid tenantId,
            TimeSpan validFor,
            CancellationToken cancellationToken = default);
    }
}
