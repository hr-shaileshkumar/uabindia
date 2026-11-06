using System.Collections.Generic;
using UabIndia.Api.Services;

namespace UabIndia.Api.Modules
{
    public interface IModuleRegistry
    {
        IEnumerable<ModuleDefinition> GetModules();
    }

    public record ModuleDefinition(string Name, string Path);
}
