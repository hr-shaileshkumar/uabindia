using System;

namespace UabIndia.Core.Entities
{
    public class DocumentTemplate : BaseEntity
    {
        public Guid? CompanyId { get; set; }
        public Guid? ProjectId { get; set; }
        public string TemplateKey { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Category { get; set; } = "Commercial";
        public string? Description { get; set; }
        public string PageOrientation { get; set; } = "Portrait";
        public string? HeaderLayout { get; set; } = "modern-split";
        public string? HeaderHtml { get; set; }
        public string? BodyHtml { get; set; }
        public string? FooterHtml { get; set; }
        public string? TermsAndConditions { get; set; }
        public string? WatermarkText { get; set; }
        public bool HasBarcode { get; set; }
        public bool HasQrCode { get; set; }
        public bool HasDigitalSignature { get; set; } = true;
        public bool IsDefault { get; set; } = true;
        public bool IsActive { get; set; } = true;
    }
}
