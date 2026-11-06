using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using UabIndia.Core.Entities;
using UabIndia.Core.Services;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Api.Services;

public static class AuthUserLookup
{
    public const string DevAdminEmail = "admin@uabindia.in";
    /// <summary>
    /// Development and automated test fixture credential only. Never used as a fallback in Production.
    /// Production startup strictly requires an explicit, strong SEED_ADMIN_PASSWORD environment variable.
    /// </summary>
    public const string DevAdminPassword = "Admin@123";

    public static string NormalizeEmail(string email) => email.Trim().ToLowerInvariant();

    /// <summary>
    /// Resolves an active user by email using indexed EmailHash lookup or deterministic EF lookup.
    /// Eliminates full-table in-memory scans.
    /// </summary>
    public static async Task<User?> FindUserByEmailAsync(
        ApplicationDbContext db,
        string email,
        IEncryptionService? encryption = null)
    {
        if (string.IsNullOrWhiteSpace(email)) return null;
        var normalizedEmail = NormalizeEmail(email);

        // 1. Fast path: Blind index lookup via indexed EmailHash
        if (encryption != null)
        {
            var hash = encryption.ComputeHash(normalizedEmail);
            if (!string.IsNullOrEmpty(hash))
            {
                var matchByHash = await db.Users.IgnoreQueryFilters()
                    .Where(u => u.IsActive && !u.IsDeleted && u.EmailHash == hash)
                    .FirstOrDefaultAsync();

                if (matchByHash != null)
                {
                    return matchByHash;
                }
            }
        }

        // 2. Direct query fallback via EF Core value converter
        var directMatch = await db.Users.IgnoreQueryFilters()
            .Where(u => u.IsActive && !u.IsDeleted && u.Email == normalizedEmail)
            .FirstOrDefaultAsync();

        if (directMatch != null)
        {
            // Backfill EmailHash if missing
            if (encryption != null && string.IsNullOrEmpty(directMatch.EmailHash))
            {
                try
                {
                    directMatch.EmailHash = encryption.ComputeHash(normalizedEmail);
                    await db.SaveChangesAsync();
                }
                catch
                {
                    // Non-fatal backfill attempt
                }
            }
            return directMatch;
        }

        return null;
    }

    public static async Task<User?> FindActiveUserForLoginAsync(
        ApplicationDbContext db,
        string email,
        Guid requestedTenantId,
        IEncryptionService? encryption = null)
    {
        var user = await FindUserByEmailAsync(db, email, encryption);
        if (user == null)
        {
            return null;
        }

        // If a specific tenant workspace URL was requested (e.g. acme.uabindia.in),
        // ensure the user belongs to that tenant (or is a platform SystemAdmin).
        if (requestedTenantId != Guid.Empty)
        {
            if (user.TenantId != requestedTenantId && !user.IsSystemAdmin)
            {
                return null;
            }
        }
        // When requestedTenantId is Guid.Empty (the primary/global login page),
        // allow the user to authenticate directly into their assigned tenant workspace.

        return user;
    }

    public static async Task<bool> RequiresTenantWorkspaceAsync(
        ApplicationDbContext db,
        string email,
        Guid requestedTenantId,
        IEncryptionService? encryption = null)
    {
        // Global / direct login is supported; users are automatically signed into their tenant.
        await Task.CompletedTask;
        return false;
    }
}

