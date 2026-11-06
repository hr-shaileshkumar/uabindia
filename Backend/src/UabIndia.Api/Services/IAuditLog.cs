using System.Threading.Tasks;
using UabIndia.Core.Entities;

namespace UabIndia.Api.Services;

public interface IAuditLog
{
    /// <summary>
    /// Persists an audit log entry with immutable hash chaining.
    /// </summary>
    /// <param name="entry">The audit record to store.</param>
    /// <returns>A task that completes when the entry is saved.</returns>
    Task WriteAsync(AuditLog entry);
}
