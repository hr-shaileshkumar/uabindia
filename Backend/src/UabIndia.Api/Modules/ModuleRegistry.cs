using System;
using System.Collections.Generic;
using System.IO;
using System.Text.Json;
using YamlDotNet.Serialization;
using YamlDotNet.Serialization.NamingConventions;

namespace UabIndia.Api.Modules
{
    public class ModuleRegistry : IModuleRegistry
    {
        private readonly List<ModuleDefinition> _modules = new();

        public ModuleRegistry()
        {
            // Load JSON manifest if present
            var jsonPath = Path.Combine(AppContext.BaseDirectory, "modules.json");
            if (File.Exists(jsonPath))
            {
                try
                {
                    var json = File.ReadAllText(jsonPath);
                    using var doc = JsonDocument.Parse(json);
                    if (doc.RootElement.ValueKind == JsonValueKind.Array)
                    {
                        var jsonModules = JsonSerializer.Deserialize<List<ModuleDefinition>>(json);
                        if (jsonModules != null)
                            _modules.AddRange(jsonModules);
                    }
                    else if (doc.RootElement.ValueKind == JsonValueKind.Object &&
                             doc.RootElement.TryGetProperty("Modules", out var modulesProp) &&
                             modulesProp.ValueKind == JsonValueKind.Array)
                    {
                        foreach (var elem in modulesProp.EnumerateArray())
                        {
                            var name = elem.TryGetProperty("Name", out var n) ? n.GetString() ?? "" : "";
                            var path = elem.TryGetProperty("Path", out var p) ? p.GetString() ?? "" : "";
                            if (!string.IsNullOrWhiteSpace(name))
                            {
                                _modules.Add(new ModuleDefinition(name, path));
                            }
                        }
                    }
                }
                catch
                {
                    // Non-fatal parse fallback
                }
            }

            // Load YAML manifest if present
            var yamlPath = Path.Combine(AppContext.BaseDirectory, "modules.yaml");
            if (File.Exists(yamlPath))
            {
                try
                {
                    var yaml = File.ReadAllText(yamlPath);
                    var deserializer = new DeserializerBuilder()
                        .WithNamingConvention(CamelCaseNamingConvention.Instance)
                        .IgnoreUnmatchedProperties()
                        .Build();
                    var yamlModules = deserializer.Deserialize<List<ModuleDefinition>>(yaml);
                    if (yamlModules != null)
                        _modules.AddRange(yamlModules);
                }
                catch
                {
                    // Non-fatal parse fallback
                }
            }
        }

        public IEnumerable<ModuleDefinition> GetModules() => _modules;
    }
}
