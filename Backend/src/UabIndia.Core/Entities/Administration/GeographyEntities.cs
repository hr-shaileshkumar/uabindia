using System;

namespace UabIndia.Core.Entities
{
    // ==========================================
    // 1. Administrative Geography (Statutory / Compliance)
    // ==========================================

    public class GeoCountry : BaseEntity
    {
        public string Code { get; set; } = "IND"; // ISO Alpha-3
        public string Iso2Code { get; set; } = "IN";
        public string Name { get; set; } = "India";
        public string CurrencyCode { get; set; } = "INR";
        public string PhoneCode { get; set; } = "+91";
        public bool IsActive { get; set; } = true;
    }

    public class GeoState : BaseEntity
    {
        public Guid CountryId { get; set; }
        public string StateCode { get; set; } = string.Empty; // e.g. "BR" for Bihar, "DL" for Delhi
        public string Name { get; set; } = string.Empty;
        public string? CapitalCity { get; set; }
        public bool IsActive { get; set; } = true;
    }

    public class GeoDistrict : BaseEntity
    {
        public Guid StateId { get; set; }
        public string Name { get; set; } = string.Empty; // e.g. "Patna", "Gaya"
        public string? DistrictCode { get; set; }
        public bool IsActive { get; set; } = true;
    }

    public class GeoCity : BaseEntity
    {
        public Guid DistrictId { get; set; }
        public string Name { get; set; } = string.Empty; // e.g. "Danapur", "Patna Town"
        public string? PostalCode { get; set; }
        public bool IsActive { get; set; } = true;
    }

    // ==========================================
    // 2. Business Management Geography (Operational / Internal)
    // ==========================================

    public class BusinessZone : BaseOrgEntity
    {
        public Guid? HeadEmployeeId { get; set; }
        public string? HeadEmployeeName { get; set; }
    }

    public class BusinessRegion : BaseOrgEntity
    {
        public Guid ZoneId { get; set; }
        public Guid? HeadEmployeeId { get; set; }
        public string? HeadEmployeeName { get; set; }
    }

    public class BusinessCluster : BaseOrgEntity
    {
        public Guid RegionId { get; set; }
        public Guid? HeadEmployeeId { get; set; }
        public string? HeadEmployeeName { get; set; }
    }
}
