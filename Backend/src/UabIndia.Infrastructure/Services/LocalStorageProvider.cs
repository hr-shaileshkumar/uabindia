using System;
using System.IO;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using UabIndia.Application.Interfaces;

namespace UabIndia.Infrastructure.Services
{
    public class LocalStorageProvider : IStorageProvider
    {
        private readonly string _baseStoragePath;
        private readonly ILogger<LocalStorageProvider> _logger;

        public string ProviderName => "LocalFileSystem";

        public LocalStorageProvider(IConfiguration configuration, ILogger<LocalStorageProvider> logger)
        {
            _logger = logger;
            var configuredPath = configuration["Storage:LocalBasePath"];
            _baseStoragePath = !string.IsNullOrWhiteSpace(configuredPath)
                ? configuredPath
                : Path.Combine(AppContext.BaseDirectory, "uploads");

            if (!Directory.Exists(_baseStoragePath))
            {
                Directory.CreateDirectory(_baseStoragePath);
            }
        }

        public async Task<string> UploadFileAsync(
            Stream fileStream,
            string fileName,
            string contentType,
            Guid tenantId,
            string? folder = null,
            CancellationToken cancellationToken = default)
        {
            var safeFolder = string.IsNullOrWhiteSpace(folder) ? "documents" : folder.Trim('/', '\\');
            var tenantDir = Path.Combine(_baseStoragePath, safeFolder, tenantId.ToString("N"));
            Directory.CreateDirectory(tenantDir);

            var safeFileName = Path.GetFileName(fileName);
            var uniqueFileName = $"{Guid.NewGuid():N}_{safeFileName}";
            var destinationPath = Path.Combine(tenantDir, uniqueFileName);

            await using var output = File.Create(destinationPath);
            await fileStream.CopyToAsync(output, cancellationToken);

            var relativeKey = Path.Combine(safeFolder, tenantId.ToString("N"), uniqueFileName).Replace("\\", "/");
            _logger.LogInformation("File uploaded to local storage. Key: {Key}, Tenant: {TenantId}", relativeKey, tenantId);
            return relativeKey;
        }

        public Task<Stream> DownloadFileAsync(
            string storageKey,
            Guid tenantId,
            CancellationToken cancellationToken = default)
        {
            var normalizedKey = storageKey.Replace('/', Path.DirectorySeparatorChar).Replace('\\', Path.DirectorySeparatorChar);
            var fullPath = Path.Combine(_baseStoragePath, normalizedKey);

            if (!File.Exists(fullPath))
            {
                throw new FileNotFoundException($"File not found at storage key: {storageKey}");
            }

            Stream stream = File.OpenRead(fullPath);
            return Task.FromResult(stream);
        }

        public Task<bool> DeleteFileAsync(
            string storageKey,
            Guid tenantId,
            CancellationToken cancellationToken = default)
        {
            try
            {
                var normalizedKey = storageKey.Replace('/', Path.DirectorySeparatorChar).Replace('\\', Path.DirectorySeparatorChar);
                var fullPath = Path.Combine(_baseStoragePath, normalizedKey);

                if (File.Exists(fullPath))
                {
                    File.Delete(fullPath);
                    _logger.LogInformation("Deleted file at key: {Key}", storageKey);
                    return Task.FromResult(true);
                }

                return Task.FromResult(false);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to delete file at key: {Key}", storageKey);
                return Task.FromResult(false);
            }
        }

        public Task<string> GetPreSignedUrlAsync(
            string storageKey,
            Guid tenantId,
            TimeSpan validFor,
            CancellationToken cancellationToken = default)
        {
            // For local storage, route through the API's download endpoint
            var url = $"/api/v1/documents/download-file?key={Uri.EscapeDataString(storageKey)}";
            return Task.FromResult(url);
        }
    }
}
