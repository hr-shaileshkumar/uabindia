using System.Collections.Generic;

namespace UabIndia.Application.Interfaces
{
    public class IndustryExtensionManifest
    {
        public string Code { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Icon { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public List<string> ExtendedModules { get; set; } = new();
        public List<string> CustomEntityNames { get; set; } = new();
        public bool IsActive { get; set; } = true;
    }

    public interface IIndustryExtensionService
    {
        IReadOnlyList<IndustryExtensionManifest> GetSupportedIndustries();
        IndustryExtensionManifest GetIndustryManifest(string code);
    }
}
