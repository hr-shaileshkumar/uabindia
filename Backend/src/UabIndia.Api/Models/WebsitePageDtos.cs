using System;
using System.Collections.Generic;

namespace UabIndia.Api.Models
{
    public class PublicWebsitePageResponse
    {
        public string PageType { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string ContentJson { get; set; } = "{}";
        public bool IsPublished { get; set; }
    }

    public class PublicSiteManifestResponse
    {
        public string Audience { get; set; } = "tenant";
        public bool TenantResolved { get; set; }
        public string HomePath { get; set; } = "/";
        public TenantDto? Tenant { get; set; }
        public List<PublicSitePageDto> Pages { get; set; } = new();
    }

    public class PublicSitePageDto
    {
        public string Key { get; set; } = string.Empty;
        public string Label { get; set; } = string.Empty;
        public string Path { get; set; } = string.Empty;
        public bool IsEnabled { get; set; }
        public bool IsPublished { get; set; }
        public List<string> Placements { get; set; } = new();
    }

    public class WebsitePageSummaryDto
    {
        public Guid Id { get; set; }
        public string PageType { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string ContentJson { get; set; } = "{}";
        public bool IsPublished { get; set; }
        public DateTime? PublishedAt { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public Guid TenantId { get; set; }
        public string TenantName { get; set; } = string.Empty;
    }

    public class UpdateWebsitePageRequest
    {
        public string? Title { get; set; }
        public string? ContentJson { get; set; }
        public Guid? TenantId { get; set; }
    }
}
