using System;
using System.Threading.Tasks;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Infrastructure.Repositories
{
    public class RefreshTokenRepository : IRefreshTokenRepository
    {
        private readonly ApplicationDbContext _db;

        public RefreshTokenRepository(ApplicationDbContext db)
        {
            _db = db;
        }

        public async Task SaveRefreshTokenAsync(Guid tenantId, Guid userId, string tokenHash, string deviceId, DateTime expiresAt)
        {
            var rt = new RefreshToken
            {
                TenantId = tenantId,
                UserId = userId,
                TokenHash = tokenHash,
                DeviceId = deviceId,
                ExpiresAt = expiresAt,
                IsRevoked = false,
                CreatedAt = DateTime.UtcNow
            };
            _db.RefreshTokens.Add(rt);
            await _db.SaveChangesAsync();
        }

        public async Task<bool> ValidateRefreshTokenAsync(Guid tenantId, Guid userId, string tokenHash)
        {
            var existing = await _db.RefreshTokens.FirstOrDefaultAsync(r => r.TenantId == tenantId && r.UserId == userId && r.TokenHash == tokenHash && !r.IsRevoked && r.ExpiresAt > DateTime.UtcNow);
            return existing != null;
        }

        public async Task<RefreshToken?> GetByHashAsync(Guid tenantId, Guid userId, string tokenHash)
        {
            return await _db.RefreshTokens.FirstOrDefaultAsync(r => r.TenantId == tenantId && r.UserId == userId && r.TokenHash == tokenHash);
        }

        public async Task<RefreshToken?> GetByHashAsync(Guid tenantId, string tokenHash)
        {
            return await _db.RefreshTokens.FirstOrDefaultAsync(r => r.TenantId == tenantId && r.TokenHash == tokenHash);
        }

        public async Task UpdateRefreshTokenAsync(RefreshToken token)
        {
            _db.RefreshTokens.Update(token);
            await _db.SaveChangesAsync();
        }

        public async Task RevokeRefreshTokenAsync(Guid tenantId, Guid userId, string tokenHash)
        {
            var existing = await _db.RefreshTokens.FirstOrDefaultAsync(r => r.TenantId == tenantId && r.UserId == userId && r.TokenHash == tokenHash);
            if (existing == null) return;
            existing.IsRevoked = true;
            await _db.SaveChangesAsync();
        }

        public async Task RevokeAllForUserAsync(Guid tenantId, Guid userId)
        {
            var tokens = _db.RefreshTokens.Where(r => r.TenantId == tenantId && r.UserId == userId && !r.IsRevoked);
            await tokens.ForEachAsync(t => t.IsRevoked = true);
            await _db.SaveChangesAsync();
        }
    }
}
