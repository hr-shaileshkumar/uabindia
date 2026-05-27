using System;

namespace UabIndia.Core.Entities
{
    public class WebsitePage : BaseEntity
    {
        public required string PageType { get; set; } // "home", "about", "contact", "career"
        public required string Title { get; set; }
        public required string ContentJson { get; set; } // JSON for rich content, sections, CTAs
        public bool IsPublished { get; set; } = false;
        public DateTime? PublishedAt { get; set; }
        public Guid? PublishedBy { get; set; }
    }
}