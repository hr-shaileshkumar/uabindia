using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;

namespace UabIndia.Api.Services
{
    /// <summary>
    /// Validates critical configuration settings on startup
    /// Prevents deployment with insecure or missing configurations
    /// </summary>
    public class ConfigurationValidator
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<ConfigurationValidator> _logger;

        public ConfigurationValidator(IConfiguration configuration, ILogger<ConfigurationValidator> logger)
        {
            _configuration = configuration;
            _logger = logger;
        }

        public ValidationResult ValidateConfiguration(bool isProduction)
        {
            var errors = new List<string>();
            var warnings = new List<string>();

            // Critical: Database connection string
            var connectionString = _configuration.GetConnectionString("DefaultConnection");
            if (string.IsNullOrEmpty(connectionString))
            {
                errors.Add("Database connection string is missing");
            }
            else if (isProduction && connectionString.Contains("Trusted_Connection=True"))
            {
                warnings.Add("Production environment using Windows Authentication - ensure appropriate credentials");
            }

            // Critical: JWT configuration
            var jwtKey = _configuration["Jwt:Key"];
            if (string.IsNullOrEmpty(jwtKey))
            {
                errors.Add("JWT signing key is missing");
            }
            else if (jwtKey.Length < 32)
            {
                errors.Add("JWT signing key is too short (minimum 32 characters required)");
            }
            else if (isProduction && (jwtKey.Contains("dev") || jwtKey.Contains("test") || jwtKey.Contains("change-this")))
            {
                errors.Add("Production environment using development JWT key - security risk!");
            }

            var jwtIssuer = _configuration["Jwt:Issuer"];
            if (string.IsNullOrEmpty(jwtIssuer))
            {
                warnings.Add("JWT Issuer is not configured");
            }

            var jwtAudience = _configuration["Jwt:Audience"];
            if (string.IsNullOrEmpty(jwtAudience))
            {
                warnings.Add("JWT Audience is not configured");
            }

            // CORS configuration
            var corsOrigins = _configuration.GetSection("Cors:AllowedOrigins").Get<string[]>();
            if (corsOrigins == null || !corsOrigins.Any())
            {
                warnings.Add("No CORS origins configured");
            }
            else if (isProduction && corsOrigins.Any(o => o.Contains("localhost")))
            {
                warnings.Add("Production CORS configuration includes localhost - potential security issue");
            }

            // Application Insights (recommended for production)
            if (isProduction)
            {
                var aiConnectionString = _configuration["ApplicationInsights:ConnectionString"];
                if (string.IsNullOrEmpty(aiConnectionString))
                {
                    warnings.Add("Application Insights not configured - monitoring and telemetry disabled");
                }
            }

            // Validate rate limiting configuration
            var rateLimitConfig = _configuration.GetSection("RateLimiting");
            if (!rateLimitConfig.Exists())
            {
                warnings.Add("Rate limiting configuration not found - using defaults");
            }

            return new ValidationResult
            {
                IsValid = !errors.Any(),
                Errors = errors,
                Warnings = warnings
            };
        }

        public void LogValidationResult(ValidationResult result, bool isProduction)
        {
            if (!result.IsValid)
            {
                _logger.LogCritical("Configuration validation failed:");
                foreach (var error in result.Errors)
                {
                    _logger.LogCritical("  ERROR: {Error}", error);
                }
            }

            if (result.Warnings.Any())
            {
                _logger.LogWarning("Configuration warnings:");
                foreach (var warning in result.Warnings)
                {
                    _logger.LogWarning("  WARNING: {Warning}", warning);
                }
            }

            if (result.IsValid && !result.Warnings.Any())
            {
                _logger.LogInformation("Configuration validation passed - all settings correct");
            }
        }

        public class ValidationResult
        {
            public bool IsValid { get; set; }
            public List<string> Errors { get; set; } = new();
            public List<string> Warnings { get; set; } = new();
        }
    }
}
