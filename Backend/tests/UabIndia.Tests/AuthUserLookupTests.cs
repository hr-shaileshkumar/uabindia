using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using UabIndia.Api.Services;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;
using UabIndia.Infrastructure.Services;
using UabIndia.Tests.TestUtilities;
using Xunit;

namespace UabIndia.Tests;

public class AuthUserLookupTests : IDisposable
{
    private readonly ApplicationDbContext _db;
    private readonly IPasswordHasher<User> _hasher = new PasswordHasher<User>();

    public AuthUserLookupTests()
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Encryption:Key"] = "dev-only-change-this-to-a-strong-secret-key-min-32-chars",
            })
            .Build();

        var encryption = new AesEncryptionService(config);
        var tenantAccessor = new TestTenantAccessor();
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        _db = new ApplicationDbContext(options, tenantAccessor, encryption);
        SeedUser(AuthUserLookup.DevAdminEmail, AuthUserLookup.DevAdminPassword, isSystemAdmin: true);
    }

    [Fact]
    public async Task FindActiveUserForLoginAsync_MatchesCaseInsensitiveEmail()
    {
        var user = await AuthUserLookup.FindActiveUserForLoginAsync(_db, "Admin@UabIndia.IN", Guid.Empty);

        Assert.NotNull(user);
        Assert.True(user!.IsSystemAdmin);
    }

    [Fact]
    public async Task FindActiveUserForLoginAsync_AllowsSystemAdminWithTenantContext()
    {
        var tenantId = Guid.NewGuid();
        var user = await AuthUserLookup.FindActiveUserForLoginAsync(_db, AuthUserLookup.DevAdminEmail, tenantId);

        Assert.NotNull(user);
    }

    [Fact]
    public async Task FindUserByEmailAsync_ResolvesDevAdmin()
    {
        var user = await AuthUserLookup.FindUserByEmailAsync(_db, "Admin@UabIndia.IN");
        Assert.NotNull(user);
        Assert.True(user!.IsSystemAdmin);
    }

    [Fact]
    public async Task FindUserByEmailAsync_WithEncryptionService_UsesBlindIndexAndAutoPopulatesEmailHash()
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Encryption:Key"] = "dev-only-change-this-to-a-strong-secret-key-min-32-chars",
            })
            .Build();
        var encryption = new AesEncryptionService(config);

        var user = await AuthUserLookup.FindUserByEmailAsync(_db, "Admin@UabIndia.IN", encryption);
        Assert.NotNull(user);
        Assert.False(string.IsNullOrEmpty(user!.EmailHash));
        Assert.Equal(encryption.ComputeHash("admin@uabindia.in"), user.EmailHash);
    }

    [Fact]
    public async Task SaveChangesAsync_PreservesExplicitTenantId_WhenAccessorIsEmpty()
    {
        var user = await _db.Users.IgnoreQueryFilters().FirstAsync();
        var expectedTenantId = user.TenantId;
        Assert.NotEqual(Guid.Empty, expectedTenantId);

        var refreshToken = new RefreshToken
        {
            TenantId = expectedTenantId,
            UserId = user.Id,
            TokenHash = "hash",
            DeviceId = "device-1",
            ExpiresAt = DateTime.UtcNow.AddDays(1),
        };

        _db.RefreshTokens.Add(refreshToken);
        await _db.SaveChangesAsync();

        var saved = await _db.RefreshTokens.IgnoreQueryFilters().SingleAsync(r => r.Id == refreshToken.Id);
        Assert.Equal(expectedTenantId, saved.TenantId);
    }

    public void Dispose() => _db.Dispose();

    private void SeedUser(string email, string password, bool isSystemAdmin)
    {
        var tenant = new Tenant { Subdomain = "api", Name = "API Tenant", IsActive = true };
        _db.Tenants.Add(tenant);
        _db.SaveChanges();

        var user = new User
        {
            TenantId = tenant.Id,
            Email = AuthUserLookup.NormalizeEmail(email),
            IsSystemAdmin = isSystemAdmin,
            IsActive = true,
        };
        user.PasswordHash = _hasher.HashPassword(user, password);
        _db.Users.Add(user);
        _db.SaveChanges();
    }
}
