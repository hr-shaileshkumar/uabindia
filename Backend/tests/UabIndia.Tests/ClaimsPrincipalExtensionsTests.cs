using System.Security.Claims;
using Microsoft.IdentityModel.JsonWebTokens;
using UabIndia.Api.Extensions;
using UabIndia.Core.Authorization;

namespace UabIndia.Tests;

public sealed class ClaimsPrincipalExtensionsTests
{
    [Fact]
    public void GetUserId_ReturnsGuid_WhenSubClaimIsMappedToNameIdentifier()
    {
        var userId = Guid.NewGuid();
        var principal = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
            new Claim(ClaimTypes.Role, RoleCatalog.AdminRoleName)
        }, authenticationType: "Bearer"));

        Assert.Equal(userId, principal.GetUserId());
    }

    [Fact]
    public void GetUserId_ReturnsGuid_WhenRawSubClaimIsPresent()
    {
        var userId = Guid.NewGuid();
        var principal = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, userId.ToString())
        }, authenticationType: "Bearer"));

        Assert.Equal(userId, principal.GetUserId());
    }

    [Fact]
    public void GetUserId_ReturnsNull_WhenPrincipalIsNotAuthenticated()
    {
        var principal = new ClaimsPrincipal(new ClaimsIdentity());

        Assert.Null(principal.GetUserId());
    }
}

public sealed class RoleCatalogAdminScopeTests
{
    [Theory]
    [InlineData("hr")]
    [InlineData("finance")]
    [InlineData("auditor")]
    public void IsAdminLike_ReturnsFalse_ForFunctionalRoles(string roleName)
    {
        Assert.False(RoleCatalog.IsAdminLike(new[] { roleName }));
    }

    [Theory]
    [InlineData("Admin")]
    [InlineData("SuperAdmin")]
    [InlineData("tenantadmin")]
    public void IsAdminLike_ReturnsTrue_ForAdministrativeRoles(string roleName)
    {
        Assert.True(RoleCatalog.IsAdminLike(new[] { roleName }));
    }

    [Theory]
    [InlineData("hr")]
    [InlineData("finance")]
    [InlineData("auditor")]
    public void Parse_MapsFunctionalRolesToManager(string roleName)
    {
        Assert.Equal(SystemRole.Manager, RoleCatalog.Parse(roleName));
    }
}
