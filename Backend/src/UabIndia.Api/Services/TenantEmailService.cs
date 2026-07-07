using System;
using System.Linq;
using System.Net;
using System.Net.Mail;
using System.Text.Json.Nodes;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using UabIndia.Core.Entities;
using UabIndia.Core.Services;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Api.Services
{
    public sealed class TenantEmailService
    {
        private readonly ApplicationDbContext _db;
        private readonly IConfiguration _configuration;
        private readonly IEncryptionService _encryptionService;
        private readonly ILogger<TenantEmailService> _logger;

        public TenantEmailService(
            ApplicationDbContext db,
            IConfiguration configuration,
            IEncryptionService encryptionService,
            ILogger<TenantEmailService> logger)
        {
            _db = db;
            _configuration = configuration;
            _encryptionService = encryptionService;
            _logger = logger;
        }

        public async Task SendPasswordResetEmailAsync(
            User user,
            string resetToken,
            string resetUrl,
            CancellationToken cancellationToken = default)
        {
            var tenant = await _db.Tenants
                .IgnoreQueryFilters()
                .AsNoTracking()
                .FirstOrDefaultAsync(t => t.Id == user.TenantId && !t.IsDeleted, cancellationToken);

            var tenantConfig = await _db.TenantConfigs
                .IgnoreQueryFilters()
                .AsNoTracking()
                .FirstOrDefaultAsync(config => config.TenantId == user.TenantId && !config.IsDeleted, cancellationToken);

            var profile = ReadProfileSettings(tenantConfig?.ConfigJson);

            var workspaceName = string.IsNullOrWhiteSpace(tenant?.Name)
                ? "Your workspace"
                : tenant.Name!.Trim();
            var subject = $"{workspaceName} password reset";
            var body = $"""
Hello,

We received a request to reset the password for your {workspaceName} account.

Reset link:
{resetUrl}

Reset token:
{resetToken}

This link and token expire in 1 hour. If you did not request this reset, you can ignore this email.
""";

            await SendAsync(
                toEmail: user.Email,
                subject: subject,
                body: body,
                fromDisplayName: workspaceName,
                profile: profile,
                cancellationToken: cancellationToken);
        }

        private async Task SendAsync(
            string toEmail,
            string subject,
            string body,
            string fromDisplayName,
            TenantMailProfile profile,
            CancellationToken cancellationToken)
        {
            cancellationToken.ThrowIfCancellationRequested();

            var smtpHost = FirstNonEmpty(profile.SmtpHost, _configuration["Mail:SmtpHost"], Environment.GetEnvironmentVariable("SMTP_HOST"));
            if (string.IsNullOrWhiteSpace(smtpHost))
            {
                throw new InvalidOperationException("SMTP host is not configured.");
            }

            var smtpPort = profile.SmtpPort
                ?? ReadInt(_configuration["Mail:SmtpPort"])
                ?? ReadInt(Environment.GetEnvironmentVariable("SMTP_PORT"))
                ?? 587;

            var smtpUsername = FirstNonEmpty(profile.SmtpUsername, _configuration["Mail:SmtpUsername"], Environment.GetEnvironmentVariable("SMTP_USERNAME"));
            var smtpPassword = FirstNonEmpty(profile.SmtpPassword, _configuration["Mail:SmtpPassword"], Environment.GetEnvironmentVariable("SMTP_PASSWORD"));
            var fromEmail = FirstNonEmpty(
                profile.SmtpFromEmail,
                _configuration["Mail:FromEmail"],
                Environment.GetEnvironmentVariable("SMTP_FROM_EMAIL"),
                smtpUsername);

            if (string.IsNullOrWhiteSpace(fromEmail))
            {
                throw new InvalidOperationException("SMTP from-email is not configured.");
            }

            var enableSsl = ReadBool(_configuration["Mail:EnableSsl"])
                ?? ReadBool(Environment.GetEnvironmentVariable("SMTP_ENABLE_SSL"))
                ?? smtpPort != 25;

            using var message = new MailMessage
            {
                From = new MailAddress(fromEmail, fromDisplayName),
                Subject = subject,
                Body = body,
                IsBodyHtml = false
            };
            message.To.Add(toEmail);

            using var client = new SmtpClient(smtpHost, smtpPort)
            {
                DeliveryMethod = SmtpDeliveryMethod.Network,
                EnableSsl = enableSsl,
                UseDefaultCredentials = false
            };

            if (!string.IsNullOrWhiteSpace(smtpUsername) && !string.IsNullOrWhiteSpace(smtpPassword))
            {
                client.Credentials = new NetworkCredential(smtpUsername, smtpPassword);
            }

            await client.SendMailAsync(message);
            _logger.LogInformation("Password reset email sent to {Email}", toEmail);
        }

        private TenantMailProfile ReadProfileSettings(string? configJson)
        {
            if (string.IsNullOrWhiteSpace(configJson))
            {
                return new TenantMailProfile();
            }

            try
            {
                var root = JsonNode.Parse(configJson) as JsonObject;
                var profile = root?["tenantProfile"] as JsonObject;
                var encryptedPassword = profile?["smtpPasswordEncrypted"]?.GetValue<string>();

                return new TenantMailProfile
                {
                    SmtpHost = profile?["smtpHost"]?.GetValue<string>()?.Trim(),
                    SmtpPort = profile?["smtpPort"]?.GetValue<int?>(),
                    SmtpUsername = profile?["smtpUsername"]?.GetValue<string>()?.Trim(),
                    SmtpFromEmail = profile?["smtpFromEmail"]?.GetValue<string>()?.Trim(),
                    SmtpPassword = string.IsNullOrWhiteSpace(encryptedPassword)
                        ? null
                        : _encryptionService.Decrypt(encryptedPassword)
                };
            }
            catch
            {
                return new TenantMailProfile();
            }
        }

        private static string? FirstNonEmpty(params string?[] values)
        {
            return values.FirstOrDefault(value => !string.IsNullOrWhiteSpace(value))?.Trim();
        }

        private static int? ReadInt(string? value)
        {
            return int.TryParse(value, out var parsed) ? parsed : null;
        }

        private static bool? ReadBool(string? value)
        {
            return bool.TryParse(value, out var parsed) ? parsed : null;
        }

        private sealed class TenantMailProfile
        {
            public string? SmtpHost { get; set; }
            public int? SmtpPort { get; set; }
            public string? SmtpUsername { get; set; }
            public string? SmtpPassword { get; set; }
            public string? SmtpFromEmail { get; set; }
        }
    }
}
