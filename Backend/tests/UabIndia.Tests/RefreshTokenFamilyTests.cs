using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using UabIndia.Api.Extensions;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;
using UabIndia.Infrastructure.Repositories;
using UabIndia.Tests.TestUtilities;
using Xunit;

namespace UabIndia.Tests
{
    public class RefreshTokenFamilyTests
    {
        private static ApplicationDbContext CreateInMemoryDbContext()
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .ConfigureWarnings(w => w.Ignore(InMemoryEventId.TransactionIgnoredWarning))
                .Options;

            return new ApplicationDbContext(options, new TestTenantAccessor(), new TestEncryptionService());
        }

        [Fact]
        public async Task RotateRefreshToken_CreatesChildToken_AndLinksParent()
        {
            await using var db = CreateInMemoryDbContext();
            var repo = new RefreshTokenRepository(db);
            var tenantId = Guid.NewGuid();
            var userId = Guid.NewGuid();

            // 1. Initial Token T1
            var initialToken = await repo.SaveRefreshTokenWithFamilyAsync(
                tenantId, userId, "hash-t1", "device-ios", DateTime.UtcNow.AddDays(30), null);

            Assert.False(initialToken.IsRevoked);
            Assert.Null(initialToken.ParentTokenId);
            Assert.Null(initialToken.ReplacedByTokenId);

            // 2. Rotate to Child Token T2
            var childToken = await repo.SaveRefreshTokenWithFamilyAsync(
                tenantId, userId, "hash-t2", "device-ios", DateTime.UtcNow.AddDays(30), initialToken.Id);

            initialToken.IsRevoked = true;
            initialToken.RevokedAt = DateTime.UtcNow;
            initialToken.ReplacedByTokenId = childToken.Id;
            await repo.UpdateRefreshTokenAsync(initialToken);

            // 3. Verify DB state
            var t1 = await repo.GetByHashAsync(tenantId, userId, "hash-t1");
            var t2 = await repo.GetByHashAsync(tenantId, userId, "hash-t2");

            Assert.NotNull(t1);
            Assert.NotNull(t2);
            Assert.True(t1!.IsRevoked);
            Assert.Equal(childToken.Id, t1.ReplacedByTokenId);
            Assert.False(t2!.IsRevoked);
            Assert.Equal(initialToken.Id, t2.ParentTokenId);
        }

        [Fact]
        public async Task RevokeFamily_RevokesDescendantsAndSessionTokens()
        {
            await using var db = CreateInMemoryDbContext();
            var repo = new RefreshTokenRepository(db);
            var tenantId = Guid.NewGuid();
            var userId = Guid.NewGuid();

            // Setup token chain: T1 -> T2 -> T3
            var t1 = await repo.SaveRefreshTokenWithFamilyAsync(tenantId, userId, "hash-t1", "device-1", DateTime.UtcNow.AddDays(30), null);
            var t2 = await repo.SaveRefreshTokenWithFamilyAsync(tenantId, userId, "hash-t2", "device-1", DateTime.UtcNow.AddDays(30), t1.Id);
            var t3 = await repo.SaveRefreshTokenWithFamilyAsync(tenantId, userId, "hash-t3", "device-1", DateTime.UtcNow.AddDays(30), t2.Id);

            t1.ReplacedByTokenId = t2.Id;
            t2.ReplacedByTokenId = t3.Id;
            await repo.UpdateRefreshTokenAsync(t1);
            await repo.UpdateRefreshTokenAsync(t2);

            // Trigger Family Revocation targeting T2 (e.g. replay attack on T2)
            await repo.RevokeFamilyAsync(tenantId, userId, t2.Id);

            // Verify all tokens in chain are revoked
            var check1 = await repo.GetByHashAsync(tenantId, userId, "hash-t1");
            var check2 = await repo.GetByHashAsync(tenantId, userId, "hash-t2");
            var check3 = await repo.GetByHashAsync(tenantId, userId, "hash-t3");

            Assert.True(check1!.IsRevoked);
            Assert.True(check2!.IsRevoked);
            Assert.True(check3!.IsRevoked);
            Assert.NotNull(check1.RevokedAt);
            Assert.NotNull(check2.RevokedAt);
            Assert.NotNull(check3.RevokedAt);
        }

        [Fact]
        public async Task RevokeAllForUser_RevokesAllTokensAcrossDevices()
        {
            await using var db = CreateInMemoryDbContext();
            var repo = new RefreshTokenRepository(db);
            var tenantId = Guid.NewGuid();
            var userId = Guid.NewGuid();

            await repo.SaveRefreshTokenWithFamilyAsync(tenantId, userId, "hash-dev1", "device-1", DateTime.UtcNow.AddDays(30), null);
            await repo.SaveRefreshTokenWithFamilyAsync(tenantId, userId, "hash-dev2", "device-2", DateTime.UtcNow.AddDays(30), null);

            var valid1 = await repo.ValidateRefreshTokenAsync(tenantId, userId, "hash-dev1");
            var valid2 = await repo.ValidateRefreshTokenAsync(tenantId, userId, "hash-dev2");
            Assert.True(valid1);
            Assert.True(valid2);

            await repo.RevokeAllForUserAsync(tenantId, userId);

            var after1 = await repo.ValidateRefreshTokenAsync(tenantId, userId, "hash-dev1");
            var after2 = await repo.ValidateRefreshTokenAsync(tenantId, userId, "hash-dev2");
            Assert.False(after1);
            Assert.False(after2);
        }

        [Fact]
        public void GetClientIp_PrioritizesCloudflareAndForwardedHeaders()
        {
            // Case 1: CF-Connecting-IP
            var context1 = new DefaultHttpContext();
            context1.Request.Headers["CF-Connecting-IP"] = "203.0.113.195";
            context1.Request.Headers["X-Forwarded-For"] = "198.51.100.1";
            var ip1 = RateLimitingExtensions.GetClientIp(context1);
            Assert.Equal("203.0.113.195", ip1);

            // Case 2: Multi-hop X-Forwarded-For
            var context2 = new DefaultHttpContext();
            context2.Request.Headers["X-Forwarded-For"] = "198.51.100.42, 10.0.0.1, 172.16.0.1";
            var ip2 = RateLimitingExtensions.GetClientIp(context2);
            Assert.Equal("198.51.100.42", ip2);

            // Case 3: Fallback when headers missing
            var context3 = new DefaultHttpContext();
            var ip3 = RateLimitingExtensions.GetClientIp(context3);
            Assert.Equal("unknown", ip3);
        }
    }
}
