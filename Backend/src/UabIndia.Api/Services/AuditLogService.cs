using System;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using UabIndia.Api.Services;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Api.Services;

public class AuditLogService : IAuditLog
{
    private readonly ApplicationDbContext _dbContext;
    private readonly string _hashSalt;

    public AuditLogService(ApplicationDbContext dbContext, IConfiguration configuration)
    {
        _dbContext = dbContext;
        // Load static salt from configuration – fallback to empty string if not set.
        _hashSalt = configuration["AuditLog:HashSalt"] ?? string.Empty;
    }

    public async Task WriteAsync(AuditLog entry)
    {
        // Retrieve the most recent audit log to obtain its hash.
        var lastEntry = await _dbContext.AuditLogs
            .OrderByDescending(a => a.PerformedAt)
            .Select(a => a.Hash)
            .FirstOrDefaultAsync();

        entry.PrevHash = lastEntry;
        entry.Hash = ComputeHash(entry);
        entry.PerformedAt = DateTime.UtcNow;

        _dbContext.AuditLogs.Add(entry);
        await _dbContext.SaveChangesAsync();
    }

    private string ComputeHash(AuditLog entry)
    {
        // Serialize deterministically – order of properties matters.
        var payload = JsonSerializer.Serialize(new
        {
            entry.CompanyId,
            entry.ProjectId,
            entry.EntityName,
            entry.EntityId,
            entry.Action,
            entry.OldValue,
            entry.NewValue,
            entry.PerformedBy,
            entry.Ip,
            entry.PerformedAt,
            entry.PrevHash
        }, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase });

        using var sha256 = SHA256.Create();
        var combined = Encoding.UTF8.GetBytes(payload + _hashSalt);
        var hashBytes = sha256.ComputeHash(combined);
        return Convert.ToHexString(hashBytes);
    }
}
