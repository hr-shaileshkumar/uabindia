using System;
using System.Collections.Generic;

namespace UabIndia.Application.Models
{
    public class LookupItemDto
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? Code { get; set; }
        public string? Description { get; set; }
        public string? Category { get; set; }
        public Dictionary<string, object?>? Metadata { get; set; }
    }

    public class LookupResultDto
    {
        public string Type { get; set; } = string.Empty;
        public List<LookupItemDto> Items { get; set; } = new();
        public int Total { get; set; }
    }

    public class LookupQuery
    {
        public string? Search { get; set; }
        public Guid? CompanyId { get; set; }
        public Guid? ParentId { get; set; }
        public int Limit { get; set; } = 100;
    }
}
