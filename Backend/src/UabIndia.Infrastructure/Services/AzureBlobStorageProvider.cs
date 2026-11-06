using System;
using System.IO;
using System.Net.Http;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using UabIndia.Application.Interfaces;

namespace UabIndia.Infrastructure.Services
{
    /// <summary>
    /// Azure Blob Storage provider for enterprise cloud storage.
    /// Strictly partitions files by tenant container: {tenantId}/{folder}/{fileName}.
    /// </summary>
    public class AzureBlobStorageProvider : IStorageProvider
    {
        private readonly IConfiguration _config;
        private readonly ILogger<AzureBlobStorageProvider> _logger;
        private readonly HttpClient _httpClient;
        private readonly string _accountName;
        private readonly string _containerName;
        private readonly string _sasToken;

        public string ProviderName => "AzureBlobStorage";

        public AzureBlobStorageProvider(
            IConfiguration config,
            ILogger<AzureBlobStorageProvider> logger,
            IHttpClientFactory httpClientFactory)
        {
            _config = config;
            _logger = logger;
            _httpClient = httpClientFactory.CreateClient("AzureBlobStorageClient");

            _accountName = config["Storage:Azure:AccountName"] ?? "uabindiastorage";
            _containerName = config["Storage:Azure:ContainerName"] ?? "documents";
            _sasToken = (config["Storage:Azure:SasToken"] ?? string.Empty).TrimStart('?');
        }

        public async Task<string> UploadFileAsync(
            Stream fileStream,
            string fileName,
            string contentType,
            Guid tenantId,
            string? folder = null,
            CancellationToken cancellationToken = default)
        {
            var safeFolder = string.IsNullOrWhiteSpace(folder) ? "general" : folder.Trim('/', '\\');
            var safeFileName = Path.GetFileName(fileName);
            var uniqueFileName = $"{Guid.NewGuid():N}_{safeFileName}";
            var blobPath = $"{tenantId:N}/{safeFolder}/{uniqueFileName}";

            if (string.IsNullOrWhiteSpace(_sasToken))
            {
                _logger.LogWarning("Azure SAS token not configured. Simulating blob upload for key: {BlobPath}", blobPath);
                return blobPath;
            }

            var requestUri = $"https://{_accountName}.blob.core.windows.net/{_containerName}/{blobPath}?{_sasToken}";
            using var request = new HttpRequestMessage(HttpMethod.Put, requestUri);
            request.Headers.Add("x-ms-blob-type", "BlockBlob");
            request.Content = new StreamContent(fileStream);
            request.Content.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue(contentType);

            var response = await _httpClient.SendAsync(request, cancellationToken);
            response.EnsureSuccessStatusCode();

            _logger.LogInformation("Blob uploaded to Azure container {Container} with path {Path}", _containerName, blobPath);
            return blobPath;
        }

        public async Task<Stream> DownloadFileAsync(
            string storageKey,
            Guid tenantId,
            CancellationToken cancellationToken = default)
        {
            var tenantPrefix = tenantId.ToString("N");
            if (!storageKey.StartsWith(tenantPrefix, StringComparison.OrdinalIgnoreCase))
            {
                throw new UnauthorizedAccessException("Attempted cross-tenant blob access.");
            }

            if (string.IsNullOrWhiteSpace(_sasToken))
            {
                return new MemoryStream(Encoding.UTF8.GetBytes("Simulation Azure content for " + storageKey));
            }

            var requestUri = $"https://{_accountName}.blob.core.windows.net/{_containerName}/{storageKey}?{_sasToken}";
            var response = await _httpClient.GetAsync(requestUri, cancellationToken);
            response.EnsureSuccessStatusCode();

            return await response.Content.ReadAsStreamAsync(cancellationToken);
        }

        public async Task<bool> DeleteFileAsync(
            string storageKey,
            Guid tenantId,
            CancellationToken cancellationToken = default)
        {
            var tenantPrefix = tenantId.ToString("N");
            if (!storageKey.StartsWith(tenantPrefix, StringComparison.OrdinalIgnoreCase))
            {
                throw new UnauthorizedAccessException("Attempted cross-tenant blob deletion.");
            }

            if (string.IsNullOrWhiteSpace(_sasToken))
            {
                return true;
            }

            var requestUri = $"https://{_accountName}.blob.core.windows.net/{_containerName}/{storageKey}?{_sasToken}";
            var response = await _httpClient.DeleteAsync(requestUri, cancellationToken);
            return response.IsSuccessStatusCode;
        }

        public Task<string> GetPreSignedUrlAsync(
            string storageKey,
            Guid tenantId,
            TimeSpan validFor,
            CancellationToken cancellationToken = default)
        {
            var tenantPrefix = tenantId.ToString("N");
            if (!storageKey.StartsWith(tenantPrefix, StringComparison.OrdinalIgnoreCase))
            {
                throw new UnauthorizedAccessException("Attempted cross-tenant pre-signed URL generation.");
            }

            var url = $"https://{_accountName}.blob.core.windows.net/{_containerName}/{storageKey}?{_sasToken}";
            return Task.FromResult(url);
        }
    }
}
