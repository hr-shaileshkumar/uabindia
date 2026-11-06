using System;
using System.ComponentModel.DataAnnotations;

namespace UabIndia.Core.Entities
{
    /// <summary>
    /// Represents a physical or cloud IoT Biometric Terminal (ZKTeco, eSSL, Hikvision, Realtime, CAMS)
    /// </summary>
    public class BiometricDevice : BaseEntity
    {
        [Required]
        [StringLength(100)]
        public string DeviceName { get; set; } = string.Empty;

        [Required]
        [StringLength(100)]
        public string DeviceSerialNumber { get; set; } = string.Empty;

        [StringLength(50)]
        public string DeviceBrand { get; set; } = "ZKTeco"; // ZKTeco, eSSL, Hikvision, Realtime, Matrix

        [StringLength(100)]
        public string? ModelNumber { get; set; }

        [StringLength(50)]
        public string? IpAddress { get; set; }

        public int Port { get; set; } = 4370;

        /// <summary>
        /// Mapped facility / site where this machine is physically installed
        /// </summary>
        public Guid? OperationalLocationId { get; set; }

        /// <summary>
        /// Default Direction: IN (Turnstile Entry), OUT (Turnstile Exit), AUTO (Device determined or dual)
        /// </summary>
        [StringLength(20)]
        public string DirectionMode { get; set; } = "AUTO";

        [StringLength(50)]
        public string Status { get; set; } = "Online"; // Online, Offline, Maintenance

        public DateTime? LastHeartbeatAt { get; set; }

        [StringLength(50)]
        public string? FirmwareVersion { get; set; }

        public int TotalPunchesLogged { get; set; }

        [StringLength(200)]
        public string? ApiSecretKey { get; set; }

        public bool IsActive { get; set; } = true;
    }
}
