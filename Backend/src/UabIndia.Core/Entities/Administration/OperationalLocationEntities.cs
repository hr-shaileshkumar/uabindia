using System;

namespace UabIndia.Core.Entities
{
    public enum FacilityType
    {
        HeadOffice = 1,
        DistrictCenter = 2,
        Warehouse = 3,
        Hospital = 4,
        SatelliteOffice = 5,
        MobileFleetBase = 6
    }

    public class OperationalLocation : BaseOrgEntity
    {
        public FacilityType Type { get; set; } = FacilityType.DistrictCenter;

        // Physical / Administrative mapping
        public Guid? DistrictId { get; set; }
        public Guid? CityId { get; set; }
        public string? Address { get; set; }
        public string? PostalCode { get; set; }

        // Geofencing for Attendance and Security
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public int GeofenceRadiusMeters { get; set; } = 150;

        // Business management mapping
        public Guid? BusinessClusterId { get; set; }

        // Contact info
        public string? ContactPersonName { get; set; }
        public string? ContactPhone { get; set; }
    }

    public enum PostingTargetType
    {
        FixedFacility = 1,  // Directly working at site (e.g. Patna DC Desk)
        MobileUnit = 2,     // MVU (Mobile Veterinary Van / Roaming Vehicle)
        RemoteField = 3,    // Field Doctor / Surveyor
        Virtual = 4         // WFH / Remote
    }

    public class PostingUnit : BaseOrgEntity
    {
        public PostingTargetType TargetType { get; set; } = PostingTargetType.FixedFacility;

        // Base facility from which this unit operates (e.g. Patna DC)
        public Guid? ParentLocationId { get; set; }

        // MVU & Asset Specific tracking
        public string? VehicleRegistrationNumber { get; set; }
        public string? ImeiOrGpsDeviceId { get; set; }
        public string? ChasisOrAssetNumber { get; set; }
        public string? OperationalRoute { get; set; }
    }
}
