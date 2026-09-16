using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace UabIndia.Api.Models
{
    public class PermissionActionCatalogItem
    {
        public string Key { get; set; } = "view"; // view, create, edit, delete, export, approve, etc.
        public string Label { get; set; } = "View";
        public string? Description { get; set; }
    }

    public class PageCatalogItem
    {
        public string Key { get; set; } = string.Empty; // e.g. "attendance", "employees", "branches"
        public string Title { get; set; } = string.Empty;
        public string Route { get; set; } = string.Empty;
        public string? SubGroup { get; set; }
        public List<PermissionActionCatalogItem> Actions { get; set; } = new();
    }

    public class ModuleCatalogItem
    {
        public string Key { get; set; } = string.Empty; // e.g. "hrms", "finance", "administration", "crm"
        public string Title { get; set; } = string.Empty;
        public string? Icon { get; set; }
        public string? Description { get; set; }
        public List<PageCatalogItem> Pages { get; set; } = new();
    }

    public class UserPermissionItemDto
    {
        public string Module { get; set; } = string.Empty;
        public string PageKey { get; set; } = string.Empty;
        public string Action { get; set; } = "view";
        public bool IsGranted { get; set; } = true;
    }

    public class UserPermissionsResponse
    {
        public Guid UserId { get; set; }
        public string? FullName { get; set; }
        public string? Email { get; set; }
        public string? Role { get; set; }
        public List<UserPermissionItemDto> Permissions { get; set; } = new();
    }

    public class UserPermissionGrantItem
    {
        [Required]
        public string Module { get; set; } = string.Empty;

        [Required]
        public string PageKey { get; set; } = string.Empty;

        [Required]
        public string Action { get; set; } = "view";
    }

    public class SaveUserPermissionsRequest
    {
        [Required]
        public Guid UserId { get; set; }

        public List<UserPermissionGrantItem> Permissions { get; set; } = new();
    }
}
