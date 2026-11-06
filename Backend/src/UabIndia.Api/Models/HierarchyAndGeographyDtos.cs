using System;
using System.ComponentModel.DataAnnotations;
using UabIndia.Core.Entities;

namespace UabIndia.Api.Models
{
    // ==========================================
    // 1. Business Management Hierarchy DTOs
    // ==========================================

    public class BusinessZoneDto : OrgUnitDto
    {
        public Guid? HeadEmployeeId { get; set; }
        public string? HeadEmployeeName { get; set; }
    }

    public class UpsertBusinessZoneRequest : UpsertOrgUnitRequest
    {
        public Guid? HeadEmployeeId { get; set; }
        public string? HeadEmployeeName { get; set; }
    }

    public class BusinessRegionDto : OrgUnitDto
    {
        public Guid ZoneId { get; set; }
        public string? ZoneName { get; set; }
        public Guid? HeadEmployeeId { get; set; }
        public string? HeadEmployeeName { get; set; }
    }

    public class UpsertBusinessRegionRequest : UpsertOrgUnitRequest
    {
        [Required]
        public Guid ZoneId { get; set; }
        public Guid? HeadEmployeeId { get; set; }
        public string? HeadEmployeeName { get; set; }
    }

    public class BusinessClusterDto : OrgUnitDto
    {
        public Guid RegionId { get; set; }
        public string? RegionName { get; set; }
        public Guid? HeadEmployeeId { get; set; }
        public string? HeadEmployeeName { get; set; }
    }

    public class UpsertBusinessClusterRequest : UpsertOrgUnitRequest
    {
        [Required]
        public Guid RegionId { get; set; }
        public Guid? HeadEmployeeId { get; set; }
        public string? HeadEmployeeName { get; set; }
    }

    // ==========================================
    // 2. Operational Locations & Posting Units DTOs
    // ==========================================

    public class OperationalLocationDto : OrgUnitDto
    {
        public FacilityType Type { get; set; }
        public string FacilityTypeName => Type.ToString();
        public Guid? DistrictId { get; set; }
        public string? DistrictName { get; set; }
        public Guid? CityId { get; set; }
        public string? CityName { get; set; }
        public string? Address { get; set; }
        public string? PostalCode { get; set; }
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public int GeofenceRadiusMeters { get; set; }
        public Guid? BusinessClusterId { get; set; }
        public string? BusinessClusterName { get; set; }
        public string? ContactPersonName { get; set; }
        public string? ContactPhone { get; set; }
    }

    public class UpsertOperationalLocationRequest : UpsertOrgUnitRequest
    {
        public FacilityType Type { get; set; } = FacilityType.DistrictCenter;
        public Guid? DistrictId { get; set; }
        public Guid? CityId { get; set; }
        public string? Address { get; set; }
        public string? PostalCode { get; set; }
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public int GeofenceRadiusMeters { get; set; } = 150;
        public Guid? BusinessClusterId { get; set; }
        public string? ContactPersonName { get; set; }
        public string? ContactPhone { get; set; }
    }

    public class PostingUnitDto : OrgUnitDto
    {
        public PostingTargetType TargetType { get; set; }
        public string TargetTypeName => TargetType.ToString();
        public Guid? ParentLocationId { get; set; }
        public string? ParentLocationName { get; set; }
        public string? VehicleRegistrationNumber { get; set; }
        public string? ImeiOrGpsDeviceId { get; set; }
        public string? ChasisOrAssetNumber { get; set; }
        public string? OperationalRoute { get; set; }
    }

    public class UpsertPostingUnitRequest : UpsertOrgUnitRequest
    {
        public PostingTargetType TargetType { get; set; } = PostingTargetType.FixedFacility;
        public Guid? ParentLocationId { get; set; }
        public string? VehicleRegistrationNumber { get; set; }
        public string? ImeiOrGpsDeviceId { get; set; }
        public string? ChasisOrAssetNumber { get; set; }
        public string? OperationalRoute { get; set; }
    }

    // ==========================================
    // 3. Administrative Geography DTOs
    // ==========================================

    public class GeoCountryDto
    {
        public Guid Id { get; set; }
        public string Code { get; set; } = "IND";
        public string Iso2Code { get; set; } = "IN";
        public string Name { get; set; } = "India";
        public string CurrencyCode { get; set; } = "INR";
        public string PhoneCode { get; set; } = "+91";
        public bool IsActive { get; set; }
    }

    public class GeoStateDto
    {
        public Guid Id { get; set; }
        public Guid CountryId { get; set; }
        public string StateCode { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? CapitalCity { get; set; }
        public bool IsActive { get; set; }
    }

    public class GeoDistrictDto
    {
        public Guid Id { get; set; }
        public Guid StateId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? DistrictCode { get; set; }
        public bool IsActive { get; set; }
    }

    public class GeoCityDto
    {
        public Guid Id { get; set; }
        public Guid DistrictId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? PostalCode { get; set; }
        public bool IsActive { get; set; }
    }

    // ==========================================
    // 4. Employee Posting & Assignment DTOs
    // ==========================================

    public class EmployeePostingAssignmentDto
    {
        public Guid Id { get; set; }
        public Guid EmployeeId { get; set; }
        public string? EmployeeName { get; set; }
        public string? EmployeeCode { get; set; }
        public Guid? ProjectId { get; set; }
        public string? ProjectName { get; set; }
        public Guid? BusinessClusterId { get; set; }
        public string? BusinessClusterName { get; set; }
        public string? BusinessRegionName { get; set; }
        public string? BusinessZoneName { get; set; }
        public Guid? OperationalLocationId { get; set; }
        public string? OperationalLocationName { get; set; }
        public Guid? PostingUnitId { get; set; }
        public string? PostingUnitName { get; set; }
        public string? PostingUnitTargetType { get; set; }
        public Guid? StateId { get; set; }
        public string? StateName { get; set; }
        public Guid? DistrictId { get; set; }
        public string? DistrictName { get; set; }
        public DateTime EffectiveFrom { get; set; }
        public DateTime? EffectiveTo { get; set; }
        public bool IsPrimary { get; set; }
        public string AssignmentType { get; set; } = "Permanent";
        public string Status { get; set; } = "Active";
        public string? Remarks { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class CreatePostingAssignmentRequest
    {
        [Required]
        public Guid EmployeeId { get; set; }
        public Guid? ProjectId { get; set; }
        public Guid? BusinessClusterId { get; set; }
        public Guid? OperationalLocationId { get; set; }
        public Guid? PostingUnitId { get; set; }
        public Guid? StateId { get; set; }
        public Guid? DistrictId { get; set; }
        public DateTime EffectiveFrom { get; set; } = DateTime.UtcNow;
        public DateTime? EffectiveTo { get; set; }
        public bool IsPrimary { get; set; } = true;
        public string AssignmentType { get; set; } = "Permanent"; // Permanent, Deputation, Transfer, Temporary
        public string? Remarks { get; set; }
    }
}
