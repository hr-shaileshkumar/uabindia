using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace UabIndia.Api.Models
{
    public class PublicCompanyProfileDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? LegalName { get; set; }
        public string? WebsiteUrl { get; set; }
        public string? LogoUrl { get; set; }
        public string? Industry { get; set; }
        public string? CompanySize { get; set; }
        public string? Email { get; set; }
        public string? PhoneNumber { get; set; }
        public string? ContactPersonName { get; set; }
        public string? ContactPersonEmail { get; set; }
        public string? ContactPersonPhone { get; set; }
        public string? HRPersonName { get; set; }
        public string? HRPersonEmail { get; set; }
        public string? City { get; set; }
        public string? State { get; set; }
        public string? Country { get; set; }
    }

    public class PublicCompanyProfileResponse
    {
        public TenantDto? Tenant { get; set; }
        public PublicCompanyProfileDto? Company { get; set; }
        public string BrandingJson { get; set; } = "{}";
    }

    public class PublicSiteMetricDto
    {
        public string Label { get; set; } = string.Empty;
        public string Value { get; set; } = string.Empty;
        public string Helper { get; set; } = string.Empty;
    }

    public class PublicSiteStatDto
    {
        public double Value { get; set; }
        public string Suffix { get; set; } = string.Empty;
        public string Label { get; set; } = string.Empty;
        public string? Helper { get; set; }
    }

    public class PublicSiteCoverageDto
    {
        public string Name { get; set; } = string.Empty;
        public string Sector { get; set; } = string.Empty;
        public string Mark { get; set; } = string.Empty;
        public int Count { get; set; }
    }

    public class PublicSiteSocialProofDto
    {
        public bool ShowCustomerReferences { get; set; }
        public bool ShowTestimonials { get; set; }
        public string Note { get; set; } = string.Empty;
    }

    public class PublicSiteDataResponse
    {
        public string Audience { get; set; } = "tenant";
        public DateTime GeneratedAtUtc { get; set; }
        public List<PublicSiteMetricDto> HeroMetrics { get; set; } = new();
        public List<PublicSiteMetricDto> DashboardMetrics { get; set; } = new();
        public List<PublicSiteStatDto> SummaryStats { get; set; } = new();
        public List<PublicSiteCoverageDto> IndustryCoverage { get; set; } = new();
        public PublicSiteSocialProofDto SocialProof { get; set; } = new();
    }

    public class PublicContactRequestDto
    {
        [Required]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        [StringLength(200)]
        public string Email { get; set; } = string.Empty;

        [Phone]
        [StringLength(30)]
        public string? PhoneNumber { get; set; }

        [StringLength(150)]
        public string? CompanyName { get; set; }

        [StringLength(150)]
        public string? Subject { get; set; }

        [Required]
        [StringLength(2000)]
        public string Message { get; set; } = string.Empty;
    }
}
