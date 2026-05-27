using System;

namespace UabIndia.Core.Entities
{
    public class RolePermission : BaseEntity
    {
        public Guid RoleId { get; set; }
        public Guid PermissionId { get; set; }
    }
}