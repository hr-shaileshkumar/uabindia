using System;

namespace UabIndia.Core.Entities
{
    public class CommunicationTemplate : BaseEntity
    {
        public string TemplateKind { get; set; } = "Email";
        public string Name { get; set; } = string.Empty;
        public string? Subject { get; set; }
        public string Body { get; set; } = string.Empty;
        public string? TriggerEvent { get; set; }
        public string? Language { get; set; }
        public string Status { get; set; } = "Draft";
    }
}
