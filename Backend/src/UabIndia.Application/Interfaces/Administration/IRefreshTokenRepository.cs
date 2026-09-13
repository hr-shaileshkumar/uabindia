using System;
using System.Threading.Tasks;
using UabIndia.Core.Entities;

namespace UabIndia.Application.Interfaces
{
    public interface IRefreshTokenRepository
    {
        Task SaveRefreshTokenAsync(Guid tenantId, Guid userId, string tokenHash, string deviceId, DateTime expiresAt);
        Task<RefreshToken> SaveRefreshTokenWithFamilyAsync(Guid tenantId, Guid userId, string tokenHash, string deviceId, DateTime expiresAt, Guid? parentTokenId);
        Task<bool> ValidateRefreshTokenAsync(Guid tenantId, Guid userId, string tokenHash);
        Task<RefreshToken?> GetByHashAsync(Guid tenantId, Guid userId, string tokenHash);
        Task<RefreshToken?> GetByHashAsync(Guid tenantId, string tokenHash);
        Task UpdateRefreshTokenAsync(RefreshToken token);
        Task RevokeRefreshTokenAsync(Guid tenantId, Guid userId, string tokenHash);
        Task RevokeFamilyAsync(Guid tenantId, Guid userId, Guid tokenId);
        Task RevokeAllForUserAsync(Guid tenantId, Guid userId);
    }
}
