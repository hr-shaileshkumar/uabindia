using System;
using System.Collections.Generic;
using System.Text.RegularExpressions;
using Serilog.Core;
using Serilog.Events;

namespace UabIndia.Api.Services
{
    /// <summary>
    /// Serilog enricher that redacts personally identifiable information (PII) and credentials from log properties.
    /// </summary>
    public class RedactPIIEnricher : ILogEventEnricher
    {
        private static readonly HashSet<string> SensitiveKeys = new(StringComparer.OrdinalIgnoreCase)
        {
            "Password",
            "PasswordHash",
            "Token",
            "AccessToken",
            "RefreshToken",
            "Authorization",
            "Aadhaar",
            "Pan",
            "Secret",
            "ClientSecret",
            "ApiKey",
            "PrivateKey",
            "CreditCard",
            "BankAccountNumber"
        };

        private static readonly Regex EmailRegex = new(@"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}", RegexOptions.Compiled);
        private static readonly Regex AadhaarRegex = new(@"\b\d{4}\s?\d{4}\s?\d{4}\b", RegexOptions.Compiled);
        private static readonly Regex PanRegex = new(@"\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b", RegexOptions.Compiled);

        public void Enrich(LogEvent logEvent, ILogEventPropertyFactory propertyFactory)
        {
            if (logEvent == null) return;

            foreach (var property in logEvent.Properties)
            {
                if (SensitiveKeys.Contains(property.Key))
                {
                    logEvent.AddOrUpdateProperty(propertyFactory.CreateProperty(property.Key, "[REDACTED]"));
                }
            }
        }
    }
}
