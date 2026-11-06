using System;

namespace UabIndia.Core.Entities
{
    public class UserPermission : BaseEntity
    {
        public Guid UserId { get; set; }
        public Guid? CompanyId { get; set; }

        // Level 1: Module (e.g. hrms, finance, administration, crm, fleet)
        public string Module { get; set; } = string.Empty;

        // Level 2: Page or Submodule (e.g. attendance, employees, companies, leaves)
        public string PageKey { get; set; } = string.Empty;

        // Level 3: Action or Capability (e.g. view, create, edit, delete, export, approve)
        public string Action { get; set; } = "view";

        public bool IsGranted { get; set; } = true;
    }
}
