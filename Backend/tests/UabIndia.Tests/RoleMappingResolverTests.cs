using Microsoft.Extensions.Configuration;
using UabIndia.Api.Services;
using UabIndia.Core.Authorization;

namespace UabIndia.Tests;

public sealed class RoleMappingResolverTests
{
    [Fact]
    public void ResolveAdminRole_UsesConfiguredRole_WhenAllowed()
    {
        var resolver = BuildResolver(new Dictionary<string, string?>
        {
            ["TenantProvisioning:RoleMappings:DefaultAdminRole"] = "SUPER_ADMIN",
            ["TenantProvisioning:RoleMappings:AllowedAdminRoles:0"] = "ADMIN",
            ["TenantProvisioning:RoleMappings:AllowedAdminRoles:1"] = "SUPER_ADMIN"
        });

        var role = resolver.ResolveAdminRole("SUPER_ADMIN");

        Assert.Equal(RoleCatalog.SuperAdminRoleName, role);
    }

    [Fact]
    public void ResolveAdminRole_FallsBack_WhenRequestedRoleNotAllowed()
    {
        var resolver = BuildResolver(new Dictionary<string, string?>
        {
            ["TenantProvisioning:RoleMappings:DefaultAdminRole"] = "ADMIN",
            ["TenantProvisioning:RoleMappings:AllowedAdminRoles:0"] = "ADMIN"
        });

        var role = resolver.ResolveAdminRole("SUPER_ADMIN");

        Assert.Equal(RoleCatalog.AdminRoleName, role);
    }

    [Fact]
    public void ResolveEmployeeRole_UsesConfiguredFallback_WhenMissing()
    {
        var resolver = BuildResolver(new Dictionary<string, string?>
        {
            ["TenantProvisioning:RoleMappings:DefaultEmployeeRole"] = "INTERN",
            ["TenantProvisioning:RoleMappings:AllowedEmployeeRoles:0"] = "EMPLOYEE",
            ["TenantProvisioning:RoleMappings:AllowedEmployeeRoles:1"] = "INTERN"
        });

        var role = resolver.ResolveEmployeeRole(null);

        Assert.Equal("INTERN", role);
    }

    private static RoleMappingResolver BuildResolver(Dictionary<string, string?> values)
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(values)
            .Build();

        return new RoleMappingResolver(configuration);
    }
}
