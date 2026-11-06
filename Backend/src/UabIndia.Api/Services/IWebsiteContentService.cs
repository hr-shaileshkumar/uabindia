using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using UabIndia.Api.Models;
using UabIndia.Core.Entities;

namespace UabIndia.Api.Services
{
    public interface IWebsiteContentService
    {
        Task<PublicCompanyProfileResponse?> GetCompanyProfileAsync(string audience);
        Task<PublicSiteDataResponse?> GetPublicSiteDataAsync(string audience);
        Task<PublicWebsitePageResponse?> GetPublicWebsitePageAsync(string pageType, string audience);
        Task<PublicSiteManifestResponse> GetPublicSiteManifestAsync(string audience);
        Task<Guid?> SubmitPublicContactAsync(PublicContactRequestDto dto, string source, string audience);
        Task<IReadOnlyList<WebsitePageSummaryDto>> GetManagedPagesAsync(bool includeAllTenants, Guid tenantId);
        Task<PublicWebsitePageResponse> GetManagedPageAsync(string pageType, Guid tenantId);
        Task<WebsitePageSummaryDto> SaveManagedPageAsync(string pageType, UpdateWebsitePageRequest request, Guid tenantId, Guid userId);
        Task<bool> SetPublishStateAsync(string pageType, Guid tenantId, Guid userId, bool isPublished);
        Task<Tenant?> ResolveCurrentTenantAsync();
        Task<Tenant?> ResolvePlatformTenantAsync();
        Task<Tenant?> ResolveTenantForPublicAudienceAsync(string audience);
        bool IsSupportedPageType(string pageType);
    }
}
