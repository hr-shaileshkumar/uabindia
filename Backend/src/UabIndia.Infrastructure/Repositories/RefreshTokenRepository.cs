using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
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
            await SaveRefreshTokenWithFamilyAsync(tenantId, userId, tokenHash, deviceId, expiresAt, null);
        }

        public async Task<RefreshToken> SaveRefreshTokenWithFamilyAsync(Guid tenantId, Guid userId, string tokenHash, string deviceId, DateTime expiresAt, Guid? parentTokenId)
        {
            var rt = new RefreshToken
            {
                TenantId = tenantId,
                UserId = userId,
                TokenHash = tokenHash,
                DeviceId = deviceId,
                ExpiresAt = expiresAt,
                IsRevoked = false,
                ParentTokenId = parentTokenId,
                CreatedAt = DateTime.UtcNow
            };
            _db.RefreshTokens.Add(rt);
            await _db.SaveChangesAsync();
            return rt;
        }

        public async Task<bool> ValidateRefreshTokenAsync(Guid tenantId, Guid userId, string tokenHash)
        {
            var existing = await _db.RefreshTokens
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(r => r.TenantId == tenantId && r.UserId == userId && r.TokenHash == tokenHash && !r.IsRevoked && r.ExpiresAt > DateTime.UtcNow);
            return existing != null;
        }

        public async Task<RefreshToken?> GetByHashAsync(Guid tenantId, Guid userId, string tokenHash)
        {
            return await _db.RefreshTokens
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(r => r.TenantId == tenantId && r.UserId == userId && r.TokenHash == tokenHash);
        }

        public async Task<RefreshToken?> GetByHashAsync(Guid tenantId, string tokenHash)
        {
            return await _db.RefreshTokens
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(r => r.TenantId == tenantId && r.TokenHash == tokenHash);
        }

        public async Task UpdateRefreshTokenAsync(RefreshToken token)
        {
            token.UpdatedAt = DateTime.UtcNow;
            _db.RefreshTokens.Update(token);
            await _db.SaveChangesAsync();
        }

        public async Task RevokeRefreshTokenAsync(Guid tenantId, Guid userId, string tokenHash)
        {
            var existing = await _db.RefreshTokens
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(r => r.TenantId == tenantId && r.UserId == userId && r.TokenHash == tokenHash);
            if (existing == null) return;
            existing.IsRevoked = true;
            existing.RevokedAt = DateTime.UtcNow;
            existing.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
        }

        public async Task RevokeFamilyAsync(Guid tenantId, Guid userId, Guid tokenId)
        {
            var utcNow = DateTime.UtcNow;
            var target = await _db.RefreshTokens
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(r => r.Id == tokenId && r.TenantId == tenantId);

            if (target == null) return;

            // Revoke the target
            target.IsRevoked = true;
            target.RevokedAt = utcNow;
            target.UpdatedAt = utcNow;

            // Revoke all tokens sharing the same device session or in parent/child tree
            var familyTokens = await _db.RefreshTokens
                .IgnoreQueryFilters()
                .Where(r => r.TenantId == tenantId && r.UserId == userId && !r.IsRevoked &&
                            (r.DeviceId == target.DeviceId || r.ParentTokenId == tokenId || r.ReplacedByTokenId == tokenId || r.Id == target.ParentTokenId))
                .ToListAsync();

            foreach (var token in familyTokens)
            {
                token.IsRevoked = true;
                token.RevokedAt = utcNow;
                token.UpdatedAt = utcNow;
            }

            await _db.SaveChangesAsync();
        }

        public async Task RevokeAllForUserAsync(Guid tenantId, Guid userId)
        {
            var utcNow = DateTime.UtcNow;
            var tokens = await _db.RefreshTokens
                .IgnoreQueryFilters()
                .Where(r => r.TenantId == tenantId && r.UserId == userId && !r.IsRevoked)
                .ToListAsync();

            foreach (var t in tokens)
            {
                t.IsRevoked = true;
                t.RevokedAt = utcNow;
                t.UpdatedAt = utcNow;
            }

            await _db.SaveChangesAsync();
        }
    }
}
