using System;
using System.Threading;
using System.Threading.Tasks;
using UabIndia.Application.Models;
using UabIndia.Core.Entities;

namespace UabIndia.Application.Interfaces
{
    public interface IEmployeeService
    {
        Task<EmployeeProfile360Dto?> GetProfile360Async(Guid employeeId, Guid tenantId, CancellationToken ct = default);
        Task<Employee?> GetByIdAsync(Guid employeeId, Guid tenantId, CancellationToken ct = default);
    }
}
