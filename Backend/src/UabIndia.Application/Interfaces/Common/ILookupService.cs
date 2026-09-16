using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using UabIndia.Application.Models;

namespace UabIndia.Application.Interfaces
{
    public interface ILookupService
    {
        /// <summary>
        /// Retrieves a paginated/filtered list of lookup reference items by lookup category type.
        /// </summary>
        Task<LookupResultDto> GetLookupItemsAsync(string lookupType, LookupQuery query, CancellationToken ct = default);

        /// <summary>
        /// Retrieves multiple lookup categories in a single batch request to optimize form preloading.
        /// </summary>
        Task<Dictionary<string, List<LookupItemDto>>> GetBatchLookupsAsync(IEnumerable<string> lookupTypes, Guid? companyId = null, CancellationToken ct = default);
    }
}
