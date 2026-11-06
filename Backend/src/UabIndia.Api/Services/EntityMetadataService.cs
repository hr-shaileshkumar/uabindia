using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using UabIndia.Application.Interfaces;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Api.Services
{
    /// <summary>
    /// Enterprise Metadata Service for dynamic, zero-hardcoding ERP operations.
    /// Automatically reflects across the EF Core relational model to discover all database entities,
    /// property types, nullability constraints, foreign key lookup relationships, and tenant custom fields.
    /// </summary>
    public class EntityMetadataService : IEntityMetadataService
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;

        public EntityMetadataService(ApplicationDbContext db, ITenantAccessor tenantAccessor)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
        }

        // Curated business metadata for premier enterprise modules
        private static readonly Dictionary<string, EntitySummaryDto> CuratedEntities = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Employee"] = new EntitySummaryDto
            {
                Name = "Employee",
                DisplayName = "Employee Master",
                Category = "HRMS",
                Description = "Workforce profiles, employment contracts, and statutory identity records.",
                Table = "Employees",
                ApiEndpoint = "/api/v1/hrms/employees",
                Icon = "Users",
                KeyField = "id"
            },
            ["Department"] = new EntitySummaryDto
            {
                Name = "Department",
                DisplayName = "Departments",
                Category = "Organization",
                Description = "Organizational business units, divisions, and cost centers.",
                Table = "Departments",
                ApiEndpoint = "/api/v1/platform/org/departments",
                Icon = "Building2",
                KeyField = "id"
            },
            ["Designation"] = new EntitySummaryDto
            {
                Name = "Designation",
                DisplayName = "Designations & Roles",
                Category = "Organization",
                Description = "Job titles, hierarchy bands, and organizational designations.",
                Table = "Designations",
                ApiEndpoint = "/api/v1/platform/org/designations",
                Icon = "Tag",
                KeyField = "id"
            },
            ["Project"] = new EntitySummaryDto
            {
                Name = "Project",
                DisplayName = "Projects",
                Category = "Projects",
                Description = "Client projects, operational milestones, and resource tracking.",
                Table = "Projects",
                ApiEndpoint = "/api/v1/projects",
                Icon = "Briefcase",
                KeyField = "id"
            },
            ["Customer"] = new EntitySummaryDto
            {
                Name = "Customer",
                DisplayName = "Customers (CRM / Sales)",
                Category = "Sales",
                Description = "Client accounts, billing addresses, and GST profiles.",
                Table = "Customers",
                ApiEndpoint = "/api/v1/sales/customers",
                Icon = "Building",
                KeyField = "id"
            },
            ["Vendor"] = new EntitySummaryDto
            {
                Name = "Vendor",
                DisplayName = "Vendors (Suppliers)",
                Category = "Procurement",
                Description = "Vendor directory, GST numbers, payment terms, and vendor ledgers.",
                Table = "Vendors",
                ApiEndpoint = "/api/v1/procurement/vendors",
                Icon = "Truck",
                KeyField = "id"
            },
            ["Shift"] = new EntitySummaryDto
            {
                Name = "Shift",
                DisplayName = "Work Shifts",
                Category = "HRMS",
                Description = "Work rosters, shift timings, grace periods, and break rules.",
                Table = "Shifts",
                ApiEndpoint = "/api/v1/hrms/shifts",
                Icon = "Clock",
                KeyField = "id"
            },
            ["Leave"] = new EntitySummaryDto
            {
                Name = "Leave",
                DisplayName = "Leave Allocations & Requests",
                Category = "HRMS",
                Description = "Paid, sick, casual, and statutory leave balance and approval requests.",
                Table = "LeaveRequests",
                ApiEndpoint = "/api/v1/hrms/leave",
                Icon = "Calendar",
                KeyField = "id"
            },
            ["Attendance"] = new EntitySummaryDto
            {
                Name = "Attendance",
                DisplayName = "Attendance & Punches",
                Category = "HRMS",
                Description = "Daily biometric and geofenced check-in/out records.",
                Table = "AttendanceRecords",
                ApiEndpoint = "/api/v1/hrms/attendance",
                Icon = "UserCheck",
                KeyField = "id"
            },
            ["Branch"] = new EntitySummaryDto
            {
                Name = "Branch",
                DisplayName = "Operating Branches",
                Category = "Organization",
                Description = "Regional offices, plants, and operational branches.",
                Table = "Branches",
                ApiEndpoint = "/api/v1/platform/org/branches",
                Icon = "Building",
                KeyField = "id"
            },
            ["BusinessUnit"] = new EntitySummaryDto
            {
                Name = "BusinessUnit",
                DisplayName = "Business Units",
                Category = "Organization",
                Description = "Strategic business units, product lines, and divisions.",
                Table = "BusinessUnits",
                ApiEndpoint = "/api/v1/platform/org/business-units",
                Icon = "Layers",
                KeyField = "id"
            },
            ["CostCenter"] = new EntitySummaryDto
            {
                Name = "CostCenter",
                DisplayName = "Cost Centers",
                Category = "Organization",
                Description = "Accounting cost allocation and budget monitoring units.",
                Table = "CostCenters",
                ApiEndpoint = "/api/v1/platform/org/cost-centers",
                Icon = "PieChart",
                KeyField = "id"
            },
            ["Company"] = new EntitySummaryDto
            {
                Name = "Company",
                DisplayName = "Companies",
                Category = "Organization",
                Description = "Legal registered corporate entities, GSTINs, and PAN details.",
                Table = "Companies",
                ApiEndpoint = "/api/v1/companies",
                Icon = "Landmark",
                KeyField = "id"
            },
            ["Item"] = new EntitySummaryDto
            {
                Name = "Item",
                DisplayName = "Inventory Items (SKU)",
                Category = "Inventory",
                Description = "Product catalog, SKU numbers, valuation rates, and HSN codes.",
                Table = "Items",
                ApiEndpoint = "/api/v1/inventory/items",
                Icon = "Package",
                KeyField = "id"
            },
            ["Warehouse"] = new EntitySummaryDto
            {
                Name = "Warehouse",
                DisplayName = "Warehouses & Depots",
                Category = "Inventory",
                Description = "Storage facilities, bin locations, and inventory holding sites.",
                Table = "Warehouses",
                ApiEndpoint = "/api/v1/inventory/warehouses",
                Icon = "Warehouse",
                KeyField = "id"
            },
            ["Invoice"] = new EntitySummaryDto
            {
                Name = "Invoice",
                DisplayName = "Customer Invoices",
                Category = "Finance",
                Description = "Commercial tax invoices, billing schedules, and GST e-invoices.",
                Table = "Invoices",
                ApiEndpoint = "/api/v1/invoices",
                Icon = "Receipt",
                KeyField = "id"
            },
            ["SalaryStructure"] = new EntitySummaryDto
            {
                Name = "SalaryStructure",
                DisplayName = "Salary Structures",
                Category = "Payroll",
                Description = "CTC salary breakdown, earnings, deductions, and PF/ESI calculations.",
                Table = "SalaryStructures",
                ApiEndpoint = "/api/v1/payroll/structures",
                Icon = "Calculator",
                KeyField = "id"
            },
            ["PurchaseRequest"] = new EntitySummaryDto
            {
                Name = "PurchaseRequest",
                DisplayName = "Purchase Requisitions",
                Category = "Procurement",
                Description = "Internal purchase requisitions, approval matrices, and vendor selection.",
                Table = "PurchaseRequests",
                ApiEndpoint = "/api/v1/procurement/requests",
                Icon = "ShoppingCart",
                KeyField = "id"
            },
            ["Holiday"] = new EntitySummaryDto
            {
                Name = "Holiday",
                DisplayName = "Holiday Calendar",
                Category = "HRMS",
                Description = "Statutory, national, and regional holiday calendars.",
                Table = "Holidays",
                ApiEndpoint = "/api/v1/hrms/holidays",
                Icon = "Calendar",
                KeyField = "id"
            },
            ["BiometricDevice"] = new EntitySummaryDto
            {
                Name = "BiometricDevice",
                DisplayName = "Biometric Devices",
                Category = "HRMS",
                Description = "Biometric time-clocks, facial scanners, and IoT attendance relays.",
                Table = "BiometricDevices",
                ApiEndpoint = "/api/v1/hrms/biometric-devices",
                Icon = "Cpu",
                KeyField = "id"
            },
            ["SalesReturn"] = new EntitySummaryDto
            {
                Name = "SalesReturn",
                DisplayName = "Sales Returns & Credit Notes",
                Category = "Sales",
                Description = "Customer returns, RMA processing, and credit note vouchers.",
                Table = "SalesReturns",
                ApiEndpoint = "/api/v1/sales/returns",
                Icon = "RotateCcw",
                KeyField = "id"
            },
            ["AccountingPeriod"] = new EntitySummaryDto
            {
                Name = "AccountingPeriod",
                DisplayName = "Accounting Periods",
                Category = "Finance",
                Description = "Fiscal year accounting periods, book locks, and financial closures.",
                Table = "AccountingPeriods",
                ApiEndpoint = "/api/v1/finance/periods",
                Icon = "CalendarDays",
                KeyField = "id"
            }
        };

        private static readonly HashSet<string> InternalTechnicalEntities = new(StringComparer.OrdinalIgnoreCase)
        {
            "IdentityUserRole", "IdentityUserClaim", "IdentityUserLogin", "IdentityUserToken",
            "IdentityRoleClaim", "RolePermission", "UserPermission", "UserRole", "RefreshToken",
            "EntityFieldValue", "UiPageVersion", "ApplicationDbContextModelSnapshot"
        };

        public async Task<List<EntitySummaryDto>> GetDiscoverableEntitiesAsync(CancellationToken ct = default)
        {
            var discovered = new Dictionary<string, EntitySummaryDto>(StringComparer.OrdinalIgnoreCase);

            // 1. Reflect across ALL EF Core relational models in ApplicationDbContext
            foreach (var entityType in _db.Model.GetEntityTypes())
            {
                var clrType = entityType.ClrType;
                var entityName = clrType.Name;

                if (InternalTechnicalEntities.Contains(entityName) || entityName.StartsWith("<>"))
                {
                    continue;
                }

                if (CuratedEntities.TryGetValue(entityName, out var curated))
                {
                    discovered[entityName] = curated;
                }
                else
                {
                    // Dynamically infer category from namespace
                    var ns = clrType.Namespace ?? string.Empty;
                    var category = "General";
                    if (ns.Contains(".HRMS")) category = "HRMS";
                    else if (ns.Contains(".Finance")) category = "Finance";
                    else if (ns.Contains(".Sales")) category = "Sales";
                    else if (ns.Contains(".Procurement")) category = "Procurement";
                    else if (ns.Contains(".Inventory")) category = "Inventory";
                    else if (ns.Contains(".Manufacturing")) category = "Manufacturing";
                    else if (ns.Contains(".Projects")) category = "Projects";
                    else if (ns.Contains(".Payroll")) category = "Payroll";
                    else if (ns.Contains(".Assets")) category = "Assets";
                    else if (ns.Contains(".CRM")) category = "CRM";
                    else if (ns.Contains(".Administration")) category = "Administration";
                    else if (ns.Contains(".Compliance")) category = "Compliance";

                    var pk = entityType.FindPrimaryKey()?.Properties.FirstOrDefault()?.Name;
                    var keyField = pk != null ? char.ToLowerInvariant(pk[0]) + pk.Substring(1) : "id";
                    var tableName = entityType.GetTableName() ?? entityName;

                    discovered[entityName] = new EntitySummaryDto
                    {
                        Name = entityName,
                        DisplayName = HumanizeIdentifier(entityName),
                        Category = category,
                        Description = $"Dynamic, database-governed business registry for {HumanizeIdentifier(entityName)}.",
                        Table = tableName,
                        ApiEndpoint = $"/api/v1/dynamic-entities/{entityName}",
                        Icon = InferIconForCategory(category),
                        KeyField = keyField
                    };
                }
            }

            // 2. Reflect any tenant custom entities from EntityFieldDefinitions
            try
            {
                var tenantId = _tenantAccessor.GetTenantId();
                var customEntityNames = await _db.EntityFieldDefinitions
                    .AsNoTracking()
                    .Where(d => d.TenantId == tenantId && !d.IsDeleted)
                    .Select(d => d.EntityName)
                    .Distinct()
                    .ToListAsync(ct);

                foreach (var customName in customEntityNames)
                {
                    if (!discovered.ContainsKey(customName))
                    {
                        discovered[customName] = new EntitySummaryDto
                        {
                            Name = customName,
                            DisplayName = HumanizeIdentifier(customName),
                            Category = "Custom Objects",
                            Description = $"Tenant custom business entity configured in runtime.",
                            Table = "CustomEntityRecords",
                            ApiEndpoint = $"/api/v1/dynamic-entities/{customName}",
                            Icon = "Sparkles",
                            KeyField = "id"
                        };
                    }
                }
            }
            catch
            {
                // Graceful fallback if tenant context not ready
            }

            return discovered.Values
                .OrderBy(e => e.Category)
                .ThenBy(e => e.DisplayName)
                .ToList();
        }

        public Task<List<EntityFieldMetaDto>> GetEntityFieldsAsync(string entityName, CancellationToken ct = default)
        {
            return GetEntityFieldsAsync(entityName, null, null, ct);
        }

        public async Task<List<EntityFieldMetaDto>> GetEntityFieldsAsync(string entityName, Guid? companyId, Guid? projectId, CancellationToken ct = default)
        {
            var normalizedName = entityName.Trim();
            var coreFields = DiscoverFieldsFromEfCoreOrFallback(normalizedName);

            // Fetch tenant custom fields from EntityFieldDefinitions
            var tenantId = _tenantAccessor.GetTenantId();
            try
            {
                var query = _db.EntityFieldDefinitions
                    .AsNoTracking()
                    .Where(d => d.TenantId == tenantId && d.EntityName.ToLower() == normalizedName.ToLower() && d.IsActive && !d.IsDeleted);

                var customDefs = await query
                    .OrderBy(d => d.SortOrder)
                    .ToListAsync(ct);

                var result = new List<EntityFieldMetaDto>(coreFields);
                var sortIndex = coreFields.Count + 10;

                foreach (var def in customDefs)
                {
                    List<SelectOptionDto>? options = null;
                    if (!string.IsNullOrWhiteSpace(def.OptionsJson))
                    {
                        try
                        {
                            var rawOptions = JsonSerializer.Deserialize<List<string>>(def.OptionsJson);
                            if (rawOptions != null)
                            {
                                options = rawOptions.Select(o => new SelectOptionDto { Value = o, Label = o }).ToList();
                            }
                        }
                        catch
                        {
                            // Ignore invalid JSON in options
                        }
                    }

                    result.Add(new EntityFieldMetaDto
                    {
                        Key = def.FieldKey,
                        Label = def.FieldLabel,
                        Type = NormalizeFieldType(def.FieldType),
                        IsRequired = def.IsRequired,
                        IsReadOnly = false,
                        IsCustom = true,
                        Section = string.IsNullOrWhiteSpace(def.Section) ? "Custom Attributes" : def.Section,
                        SortOrder = sortIndex++,
                        Options = options,
                    });
                }

                return result;
            }
            catch
            {
                return coreFields;
            }
        }

        public async Task<string> SynthesizePageSchemaJsonAsync(string entityName, string pageKey, Guid? companyId = null, Guid? projectId = null, CancellationToken ct = default)
        {
            var fields = await GetEntityFieldsAsync(entityName, companyId, projectId, ct);
            var discoverable = await GetDiscoverableEntitiesAsync(ct);
            var summary = discoverable.FirstOrDefault(e => e.Name.Equals(entityName, StringComparison.OrdinalIgnoreCase));

            var title = summary?.DisplayName ?? HumanizeIdentifier(entityName);
            var subTitle = summary?.Description ?? $"Dynamic, database-governed registry for {title}.";
            var apiEndpoint = summary?.ApiEndpoint ?? $"/api/v1/dynamic-entities/{entityName}";
            var icon = summary?.Icon ?? "Layers";

            // 1. Synthesize Columns (filter technical and sensitive internal columns)
            var technicalKeys = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            {
                "accessfailedcount", "emailhash", "passwordhash", "concurrencystamp", "securitystamp",
                "lockoutenabled", "lockoutend", "normalizedemail", "normalizedusername", "issystemadmin",
                "businessid", "companyid", "tenantid", "twofactorenabled", "phonenumberconfirmed",
                "emailconfirmed", "rowversion", "isdeleted", "createdby", "updatedby", "deletedby", "deletedat",
                "passwordresettoken", "passwordresetexpires", "twofactorsecret", "refreshtoken", "refreshtokenexpiresat", "otp", "secret"
            };

            int ColumnPriority(string key)
            {
                var k = key.ToLowerInvariant();
                if (k == "code" || k == "employeecode" || k == "invoicenumber" || k == "ordernumber") return 1;
                if (k == "fullname" || k == "name" || k == "title") return 2;
                if (k == "email" || k == "workemail") return 3;
                if (k == "phone" || k == "phonenumber" || k == "mobile") return 4;
                if (k == "role" || k == "roles" || k == "designation" || k == "department") return 5;
                if (k == "status" || k == "isactive") return 6;
                if (k.Contains("date") || k.Contains("at")) return 7;
                if (k.Contains("amount") || k.Contains("price") || k.Contains("total") || k.Contains("rate") || k.Contains("salary")) return 8;
                return 20;
            }

            var columns = fields
                .Where(f => f.Type != "textarea" && f.Type != "password" && !technicalKeys.Contains(f.Key) && !f.Key.EndsWith("Id", StringComparison.OrdinalIgnoreCase))
                .OrderBy(f => ColumnPriority(f.Key))
                .ThenBy(f => f.SortOrder)
                .Take(8)
                .Select((f, idx) => new
                {
                    key = f.Key,
                    label = f.Label,
                    dataType = MapFieldTypeToColumnDataType(f.Type),
                    sortable = true,
                    filterable = f.Type == "select" || f.Type == "status" || f.Type == "badge" || f.Type == "boolean",
                    sortOrder = idx + 1,
                    width = f.Type == "currency" || f.Type == "date" ? "140px" : f.Type == "boolean" ? "100px" : "180px"
                })
                .ToList();

            // 2. Synthesize Filters
            var filters = new List<object>
            {
                new
                {
                    key = "search",
                    label = $"Search {title}",
                    filterType = "text",
                    placeholder = $"Search {title.ToLowerInvariant()} records…"
                }
            };

            foreach (var sf in fields.Where(f => (f.Type == "select" || f.Type == "status") && f.Options?.Count > 0).Take(2))
            {
                var filterOpts = new List<object> { new { value = "all", label = "All" } };
                filterOpts.AddRange(sf.Options!.Select(o => new { value = o.Value, label = o.Label }));
                filters.Add(new
                {
                    key = sf.Key,
                    label = sf.Label,
                    filterType = "select",
                    options = filterOpts
                });
            }

            // 3. Synthesize Form Sections with Enterprise Tab Ordering
            var groupedSections = fields
                .GroupBy(f => string.IsNullOrWhiteSpace(f.Section) ? "General Information" : f.Section)
                .OrderBy(g => GetSectionPriority(g.Key))
                .Select(g => new
                {
                    title = g.Key,
                    description = $"Configure {g.Key.ToLowerInvariant()} for this record.",
                    fields = g.OrderBy(f => f.SortOrder).Select(f => new
                    {
                        key = f.Key,
                        label = f.Label,
                        fieldType = f.Type,
                        required = f.IsRequired,
                        placeholder = f.Type == "boolean" ? null : (f.Placeholder ?? $"Enter {f.Label.ToLowerInvariant()}…"),
                        defaultValue = f.DefaultValue,
                        dependsOn = f.DependsOn,
                        filterParam = f.FilterParam,
                        optionsEndpoint = f.LookupEndpoint,
                        lookupValueKey = f.LookupValueKey,
                        lookupLabelKey = f.LookupLabelKey,
                        options = f.Options?.Select(o => new { value = o.Value, label = o.Label }).ToList(),
                        validation = (f.MaxLength.HasValue || !string.IsNullOrWhiteSpace(f.ValidationPattern)) ? new
                        {
                            max = f.MaxLength,
                            pattern = f.ValidationPattern,
                            patternMessage = f.ValidationMessage
                        } : null
                    }).ToList()
                })
                .ToList();

            // 4. Synthesize Actions
            var permissionPrefix = entityName.ToLowerInvariant();
            var actions = new List<object>
            {
                new { key = "create", label = $"New {entityName}", actionType = "button", variant = "primary", requiredPermission = $"{permissionPrefix}.create" },
                new { key = "edit", label = "Edit", actionType = "button", variant = "secondary", requiredPermission = $"{permissionPrefix}.edit" },
                new { key = "delete", label = "Delete", actionType = "button", variant = "danger", requiredPermission = $"{permissionPrefix}.delete" },
                new { key = "export", label = "Export CSV", actionType = "button", variant = "secondary", requiredPermission = $"{permissionPrefix}.view" }
            };

            var schemaDoc = new
            {
                schemaVersion = "1",
                pageKey = pageKey,
                title = title,
                subTitle = subTitle,
                entityName = entityName,
                viewType = "table",
                apiEndpoint = apiEndpoint,
                columns = columns,
                filters = filters,
                form = new
                {
                    sections = groupedSections
                },
                actions = actions
            };

            return JsonSerializer.Serialize(schemaDoc, new JsonSerializerOptions { WriteIndented = true });
        }

        private static string MapFieldTypeToColumnDataType(string fieldType)
        {
            return fieldType switch
            {
                "currency" => "currency",
                "number" or "decimal" => "number",
                "date" => "date",
                "datetime" => "datetime",
                "boolean" => "boolean",
                "status" or "badge" => "badge",
                _ => "string"
            };
        }

        private List<EntityFieldMetaDto> DiscoverFieldsFromEfCoreOrFallback(string entityName)
        {
            // 1. Inspect EF Core relational model directly across ApplicationDbContext
            var efEntityType = _db.Model.GetEntityTypes()
                .FirstOrDefault(t => t.ClrType.Name.Equals(entityName, StringComparison.OrdinalIgnoreCase));

            if (efEntityType != null)
            {
                var discovered = new List<EntityFieldMetaDto>();
                int sortIndex = 1;

                var excludedNames = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
                {
                    "Id", "TenantId", "IsDeleted", "CreatedAt", "CreatedBy", "UpdatedAt", "UpdatedBy",
                    "DeletedAt", "DeletedBy", "RowVersion", "PasswordHash", "SecurityStamp", "ConcurrencyStamp",
                    "AccessFailedCount", "LockoutEnabled", "LockoutEnd", "EmailHash", "NormalizedEmail",
                    "NormalizedUserName", "TwoFactorEnabled", "PhoneNumberConfirmed", "EmailConfirmed",
                    "IsSystemAdmin", "BusinessId", "CompanyId", "Claims", "Logins", "Tokens", "UserRoles",
                    "PasswordResetToken", "PasswordResetExpires", "TwoFactorSecret", "RefreshToken", "RefreshTokenExpiresAt", "Otp", "Secret"
                };

                foreach (var prop in efEntityType.GetProperties())
                {
                    if (excludedNames.Contains(prop.Name)) continue;

                    var clrType = Nullable.GetUnderlyingType(prop.ClrType) ?? prop.ClrType;
                    var nameLower = prop.Name.ToLowerInvariant();

                    string fieldType;
                    List<SelectOptionDto>? options = null;
                    string? lookupEndpoint = null;
                    string? lookupValueKey = null;
                    string? lookupLabelKey = null;

                    if (clrType == typeof(bool))
                    {
                        fieldType = "boolean";
                    }
                    else if (clrType == typeof(DateTime) || clrType == typeof(DateTimeOffset) || clrType == typeof(DateOnly))
                    {
                        fieldType = nameLower.Contains("time") ? "datetime" : "date";
                    }
                    else if (clrType == typeof(decimal) || clrType == typeof(double) || clrType == typeof(float))
                    {
                        fieldType = (nameLower.Contains("price") || nameLower.Contains("amount") || nameLower.Contains("cost") ||
                                     nameLower.Contains("salary") || nameLower.Contains("ctc") || nameLower.Contains("balance") ||
                                     nameLower.Contains("limit") || nameLower.Contains("rate") || nameLower.Contains("total") ||
                                     nameLower.Contains("tax")) ? "currency" : "number";
                    }
                    else if (clrType.IsEnum)
                    {
                        fieldType = "select";
                        options = Enum.GetNames(clrType).Select(n => new SelectOptionDto { Value = n, Label = HumanizeIdentifier(n) }).ToList();
                    }
                    else if (clrType == typeof(int) || clrType == typeof(long) || clrType == typeof(short) || clrType == typeof(byte))
                    {
                        fieldType = nameLower.EndsWith("status") ? "status" : "number";
                    }
                    else if (clrType == typeof(Guid))
                    {
                        if (prop.IsForeignKey())
                        {
                            fieldType = "lookup";
                            var fk = efEntityType.GetForeignKeys().FirstOrDefault(f => f.Properties.Contains(prop));
                            if (fk != null)
                            {
                                var principalName = fk.PrincipalEntityType.ClrType.Name;
                                lookupEndpoint = CuratedEntities.TryGetValue(principalName, out var curated)
                                    ? curated.ApiEndpoint
                                    : $"/api/v1/dynamic-entities/{principalName}";
                                lookupValueKey = "id";

                                // Automatically identify appropriate label property on target entity
                                var targetProps = fk.PrincipalEntityType.GetProperties();
                                var nameProp = targetProps.FirstOrDefault(p =>
                                    p.Name.Equals("Name", StringComparison.OrdinalIgnoreCase) ||
                                    p.Name.Equals("Title", StringComparison.OrdinalIgnoreCase) ||
                                    p.Name.Equals("FullName", StringComparison.OrdinalIgnoreCase) ||
                                    p.Name.Equals("Code", StringComparison.OrdinalIgnoreCase));

                                lookupLabelKey = nameProp != null
                                    ? char.ToLowerInvariant(nameProp.Name[0]) + nameProp.Name.Substring(1)
                                    : "name";
                            }
                        }
                        else
                        {
                            fieldType = "text";
                        }
                    }
                    else
                    {
                        var maxLen = prop.GetMaxLength();
                        if (nameLower.Contains("email")) fieldType = "email";
                        else if (nameLower.Contains("phone") || nameLower.Contains("mobile")) fieldType = "phone";
                        else if (nameLower.Contains("url") || nameLower.Contains("website")) fieldType = "url";
                        else if (nameLower.Contains("description") || nameLower.Contains("notes") || nameLower.Contains("remarks") || nameLower.Contains("address") || (maxLen.HasValue && maxLen.Value > 255))
                            fieldType = "textarea";
                        else if (nameLower.EndsWith("status"))
                            fieldType = "status";
                        else
                            fieldType = "text";
                    }

                    var camelKey = char.ToLowerInvariant(prop.Name[0]) + prop.Name.Substring(1);
                    var section = "General Information";
                    if (fieldType == "currency" || nameLower.Contains("gst") || nameLower.Contains("pan") || nameLower.Contains("bank") || nameLower.Contains("tax") || nameLower.Contains("iban") || nameLower.Contains("swift") || nameLower.Contains("routing") || nameLower.Contains("ifsc") || nameLower.Contains("currency") || nameLower.Contains("financialyear"))
                    {
                        section = "Financial & Statutory";
                    }
                    else if (nameLower.Contains("address") || nameLower.Contains("city") || nameLower.Contains("state") || nameLower.Contains("country") || nameLower.Contains("postal") || nameLower.Contains("zip") || nameLower.Contains("contact") || nameLower.Contains("phone") || nameLower.Contains("mobile") || nameLower.Contains("email") || nameLower.Contains("website") || nameLower.Contains("hr_") || nameLower.Contains("person"))
                    {
                        section = "Contact & Address";
                    }
                    else if (nameLower.Contains("department") || nameLower.Contains("designation") || nameLower.Contains("branch") || nameLower.Contains("location") || nameLower.Contains("company") || nameLower.Contains("manager"))
                    {
                        section = "Deployment & Organization";
                    }
                    else if (fieldType == "date" || fieldType == "datetime" || nameLower.Contains("date") || nameLower.Contains("joining"))
                    {
                        section = "Schedules & Timeline";
                    }

                    discovered.Add(new EntityFieldMetaDto
                    {
                        Key = camelKey,
                        Label = HumanizeIdentifier(prop.Name),
                        Type = fieldType,
                        IsRequired = !prop.IsNullable,
                        IsReadOnly = false,
                        IsCustom = false,
                        MaxLength = prop.GetMaxLength(),
                        Section = section,
                        SortOrder = sortIndex++,
                        Options = options,
                        LookupEndpoint = lookupEndpoint,
                        LookupValueKey = lookupValueKey,
                        LookupLabelKey = lookupLabelKey
                    });
                }

                if (discovered.Count > 0)
                {
                    return discovered;
                }
            }

            // Universal dynamic baseline for non-EF entities
            return new List<EntityFieldMetaDto>
            {
                new() { Key = "code", Label = "Code", Type = "text", IsRequired = true, Section = "General Information", SortOrder = 1, Placeholder = $"{entityName.ToUpperInvariant()}-001" },
                new() { Key = "name", Label = "Name / Title", Type = "text", IsRequired = true, Section = "General Information", SortOrder = 2, Placeholder = $"Enter {HumanizeIdentifier(entityName)} name…" },
                new() { Key = "description", Label = "Description", Type = "textarea", IsRequired = false, Section = "General Information", SortOrder = 3, Placeholder = "Add descriptive details…" },
                new() { Key = "isActive", Label = "Active Status", Type = "boolean", IsRequired = true, Section = "General Information", SortOrder = 4, DefaultValue = "true" },
            };
        }

        private static int GetSectionPriority(string section)
        {
            return section switch
            {
                "General Information" or "General Details" or "Identity" or "Basic Details" => 10,
                "Contact & Address" or "Contact Details" or "Address & Operations" => 20,
                "Financial & Statutory" or "Finance & Tax" or "Statutory" => 30,
                "Deployment & Organization" or "Organization & Roles" => 40,
                "Schedules & Timeline" or "Timeline" => 50,
                "System & Settings" or "Audit & Settings" => 60,
                _ => 100
            };
        }

        private static string HumanizeIdentifier(string name)
        {
            if (string.IsNullOrWhiteSpace(name)) return string.Empty;

            var upper = name.ToUpperInvariant();
            if (upper == "GST" || upper == "GSTIN" || upper == "GSTNUMBER") return "GSTIN";
            if (upper == "PAN" || upper == "PANNUMBER") return "PAN Card";
            if (upper == "UAN" || upper == "UANNUMBER") return "UAN Number";
            if (upper == "IFSC" || upper == "BANKIFSC") return "IFSC Code";
            if (upper == "SKU") return "SKU Barcode";
            if (upper == "UOM") return "Unit of Measure";
            if (upper == "CTC") return "Cost to Company (CTC)";

            // Normalize underscores and clean prefixes
            var cleaned = name.Replace('_', ' ').Trim();
            var words = System.Text.RegularExpressions.Regex.Replace(
                cleaned,
                @"(?<=[a-z])(?=[A-Z])|(?<=[A-Z]+)(?=[A-Z][a-z])",
                " "
            );

            // Clean up acronyms like "H R" -> "HR", "P A N" -> "PAN"
            words = System.Text.RegularExpressions.Regex.Replace(words, @"\bH\s+R\b", "HR", System.Text.RegularExpressions.RegexOptions.IgnoreCase);
            words = System.Text.RegularExpressions.Regex.Replace(words, @"\bI\s+D\b", "ID", System.Text.RegularExpressions.RegexOptions.IgnoreCase);
            words = System.Text.RegularExpressions.Regex.Replace(words, @"\bU\s+R\s+L\b", "URL", System.Text.RegularExpressions.RegexOptions.IgnoreCase);
            words = System.Text.RegularExpressions.Regex.Replace(words, @"\s+", " ").Trim();

            return words;
        }

        private static string InferIconForCategory(string category)
        {
            return category switch
            {
                "HRMS" => "Users",
                "Finance" => "Receipt",
                "Sales" => "ShoppingCart",
                "Procurement" => "Truck",
                "Inventory" => "Package",
                "Manufacturing" => "Factory",
                "Projects" => "Briefcase",
                "Payroll" => "Calculator",
                "Assets" => "Cpu",
                "CRM" => "Target",
                "Compliance" => "ShieldCheck",
                "Organization" => "Building2",
                _ => "Layers"
            };
        }

        private static string NormalizeFieldType(string rawType)
        {
            return rawType.ToLowerInvariant() switch
            {
                "text" or "string" => "text",
                "textarea" or "multiline" => "textarea",
                "number" or "int" or "integer" => "number",
                "decimal" or "currency" => "currency",
                "date" => "date",
                "datetime" => "datetime",
                "bool" or "boolean" or "checkbox" => "boolean",
                "select" or "dropdown" => "select",
                "lookup" => "lookup",
                "status" or "badge" => "status",
                _ => "text"
            };
        }
    }
}
