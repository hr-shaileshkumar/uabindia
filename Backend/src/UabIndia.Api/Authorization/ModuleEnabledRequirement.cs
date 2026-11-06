using Microsoft.AspNetCore.Authorization;

namespace UabIndia.Api.Authorization
{
    public class ModuleEnabledRequirement : IAuthorizationRequirement
    {
        public ModuleEnabledRequirement(string moduleKey)
        {
            ModuleKey = moduleKey;
        }

        public string ModuleKey { get; }
    }
}
