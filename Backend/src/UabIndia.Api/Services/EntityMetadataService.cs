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
    public class EntityMetadataService : IEntityMetadataService
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;

        public EntityMetadataService(ApplicationDbContext db, ITenantAccessor tenantAccessor)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
        }

        private static readonly List<EntitySummaryDto> SystemEntities = new()
        {
            new EntitySummaryDto
            {
                Name = "Employee",
                DisplayName = "Employee Master",
                Category = "HRMS",
                Description = "Workforce profiles, employment contracts, and statutory identity records.",
                Table = "Employees",
                ApiEndpoint = "/api/v1/hrms/employees",
                Icon = "Users",
                KeyField = "id",
            },
            new EntitySummaryDto
            {
                Name = "Department",
                DisplayName = "Departments",
                Category = "Organization",
                Description = "Organizational business units, divisions, and cost centers.",
                Table = "Departments",
                ApiEndpoint = "/api/v1/platform/org/departments",
                Icon = "Building2",
                KeyField = "id",
            },
            new EntitySummaryDto
            {
                Name = "Designation",
                DisplayName = "Designations & Roles",
                Category = "Organization",
                Description = "Job titles, hierarchy bands, and organizational designations.",
                Table = "Designations",
                ApiEndpoint = "/api/v1/platform/org/designations",
                Icon = "Tag",
                KeyField = "id",
            },
            new EntitySummaryDto
            {
                Name = "Project",
                DisplayName = "Projects",
                Category = "Projects",
                Description = "Client projects, operational milestones, and resource tracking.",
                Table = "Projects",
                ApiEndpoint = "/api/v1/projects",
                Icon = "Briefcase",
                KeyField = "id",
            },
            new EntitySummaryDto
            {
                Name = "Customer",
                DisplayName = "Customers (CRM / Sales)",
                Category = "Sales",
                Description = "Client accounts, billing addresses, and GST profiles.",
                Table = "Customers",
                ApiEndpoint = "/api/v1/sales/customers",
                Icon = "Building",
                KeyField = "id",
            },
            new EntitySummaryDto
            {
                Name = "Vendor",
                DisplayName = "Vendors (Suppliers)",
                Category = "Procurement",
                Description = "Vendor directory, GST numbers, payment terms, and vendor ledgers.",
                Table = "Vendors",
                ApiEndpoint = "/api/v1/procurement/vendors",
                Icon = "Truck",
                KeyField = "id",
            },
            new EntitySummaryDto
            {
                Name = "Shift",
                DisplayName = "Work Shifts",
                Category = "HRMS",
                Description = "Work rosters, shift timings, grace periods, and break rules.",
                Table = "Shifts",
                ApiEndpoint = "/api/v1/hrms/shifts",
                Icon = "Clock",
                KeyField = "id",
            },
            new EntitySummaryDto
            {
                Name = "Leave",
                DisplayName = "Leave Allocations & Requests",
                Category = "HRMS",
                Description = "Paid, sick, casual, and statutory leave balance and approval requests.",
                Table = "LeaveRequests",
                ApiEndpoint = "/api/v1/hrms/leave",
                Icon = "Calendar",
                KeyField = "id",
            },
            new EntitySummaryDto
            {
                Name = "Attendance",
                DisplayName = "Attendance & Punches",
                Category = "HRMS",
                Description = "Daily biometric and geofenced check-in/out records.",
                Table = "AttendanceRecords",
                ApiEndpoint = "/api/v1/hrms/attendance",
                Icon = "UserCheck",
                KeyField = "id",
            },
            new EntitySummaryDto
            {
                Name = "Branch",
                DisplayName = "Operating Branches",
                Category = "Organization",
                Description = "Regional offices, plants, and operational branches.",
                Table = "Branches",
                ApiEndpoint = "/api/v1/platform/org/branches",
                Icon = "Building",
                KeyField = "id",
            },
            new EntitySummaryDto
            {
                Name = "BusinessUnit",
                DisplayName = "Business Units",
                Category = "Organization",
                Description = "Strategic business units, product lines, and divisions.",
                Table = "BusinessUnits",
                ApiEndpoint = "/api/v1/platform/org/business-units",
                Icon = "Layers",
                KeyField = "id",
            },
            new EntitySummaryDto
            {
                Name = "CostCenter",
                DisplayName = "Cost Centers",
                Category = "Organization",
                Description = "Accounting cost allocation and budget monitoring units.",
                Table = "CostCenters",
                ApiEndpoint = "/api/v1/platform/org/cost-centers",
                Icon = "PieChart",
                KeyField = "id",
            },
            new EntitySummaryDto
            {
                Name = "Company",
                DisplayName = "Companies",
                Category = "Organization",
                Description = "Legal registered corporate entities, GSTINs, and PAN details.",
                Table = "Companies",
                ApiEndpoint = "/api/v1/companies",
                Icon = "Landmark",
                KeyField = "id",
            },
            new EntitySummaryDto
            {
                Name = "Item",
                DisplayName = "Inventory Items (SKU)",
                Category = "Inventory",
                Description = "Product catalog, SKU numbers, valuation rates, and HSN codes.",
                Table = "Items",
                ApiEndpoint = "/api/v1/inventory/items",
                Icon = "Package",
                KeyField = "id",
            },
            new EntitySummaryDto
            {
                Name = "Warehouse",
                DisplayName = "Warehouses & Depots",
                Category = "Inventory",
                Description = "Storage facilities, bin locations, and inventory holding sites.",
                Table = "Warehouses",
                ApiEndpoint = "/api/v1/inventory/warehouses",
                Icon = "Warehouse",
                KeyField = "id",
            },
            new EntitySummaryDto
            {
                Name = "Invoice",
                DisplayName = "Customer Invoices",
                Category = "Finance",
                Description = "Commercial tax invoices, billing schedules, and GST e-invoices.",
                Table = "Invoices",
                ApiEndpoint = "/api/v1/invoices",
                Icon = "Receipt",
                KeyField = "id",
            },
            new EntitySummaryDto
            {
                Name = "SalaryStructure",
                DisplayName = "Salary Structures",
                Category = "Payroll",
                Description = "CTC salary breakdown, earnings, deductions, and PF/ESI calculations.",
                Table = "SalaryStructures",
                ApiEndpoint = "/api/v1/payroll/structures",
                Icon = "Calculator",
                KeyField = "id",
            },
        };

        public Task<List<EntitySummaryDto>> GetDiscoverableEntitiesAsync(CancellationToken ct = default)
        {
            return Task.FromResult(SystemEntities.ToList());
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
                        // Fallback ignore invalid options
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

        public async Task<string> SynthesizePageSchemaJsonAsync(string entityName, string pageKey, Guid? companyId = null, Guid? projectId = null, CancellationToken ct = default)
        {
            var fields = await GetEntityFieldsAsync(entityName, companyId, projectId, ct);
            var summary = SystemEntities.FirstOrDefault(e => e.Name.Equals(entityName, StringComparison.OrdinalIgnoreCase));

            var title = summary?.DisplayName ?? HumanizeIdentifier(entityName);
            var subTitle = summary?.Description ?? $"Dynamic, database-governed registry for {title}.";
            var apiEndpoint = summary?.ApiEndpoint ?? $"/api/v1/{entityName.ToLowerInvariant()}s";
            var icon = summary?.Icon ?? "Layers";

            // 1. Synthesize Columns (select top 8 non-textarea fields for default table visibility)
            var columns = fields
                .Where(f => f.Type != "textarea" && f.Type != "password")
                .Take(10)
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

            // 3. Synthesize Form Sections
            var groupedSections = fields
                .GroupBy(f => string.IsNullOrWhiteSpace(f.Section) ? "General Details" : f.Section)
                .Select(g => new
                {
                    title = g.Key,
                    description = $"Configure {g.Key.ToLowerInvariant()} for this record.",
                    fields = g.Select(f => new
                    {
                        key = f.Key,
                        label = f.Label,
                        fieldType = f.Type,
                        required = f.IsRequired,
                        placeholder = f.Placeholder ?? $"Enter {f.Label.ToLowerInvariant()}…",
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
            // 1. Inspect EF Core relational model directly
            var efEntityType = _db.Model.GetEntityTypes()
                .FirstOrDefault(t => t.ClrType.Name.Equals(entityName, StringComparison.OrdinalIgnoreCase));

            if (efEntityType != null)
            {
                var discovered = new List<EntityFieldMetaDto>();
                int sortIndex = 1;

                var excludedNames = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
                {
                    "Id", "TenantId", "IsDeleted", "CreatedAt", "CreatedBy", "UpdatedAt", "UpdatedBy",
                    "RowVersion", "PasswordHash", "SecurityStamp", "ConcurrencyStamp"
                };

                foreach (var prop in efEntityType.GetProperties())
                {
                    if (excludedNames.Contains(prop.Name)) continue;

                    var clrType = Nullable.GetUnderlyingType(prop.ClrType) ?? prop.ClrType;
                    var nameLower = prop.Name.ToLowerInvariant();

                    string fieldType;
                    List<SelectOptionDto>? options = null;

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
                        // Check if foreign key
                        fieldType = prop.IsForeignKey() ? "lookup" : "text";
                    }
                    else
                    {
                        // String
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
                    if (fieldType == "currency" || nameLower.Contains("gst") || nameLower.Contains("pan") || nameLower.Contains("bank") || nameLower.Contains("tax"))
                    {
                        section = "Financial & Statutory";
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
                    });
                }

                if (discovered.Count > 0)
                {
                    return discovered;
                }
            }

            // 2. Fallback to hardcoded core catalog
            return GetCoreFieldsForEntity(entityName);
        }

        private static string HumanizeIdentifier(string name)
        {
            if (string.IsNullOrWhiteSpace(name)) return string.Empty;

            // Handle common acronyms
            var upper = name.ToUpperInvariant();
            if (upper == "GST" || upper == "GSTIN" || upper == "GSTNUMBER") return "GSTIN";
            if (upper == "PAN" || upper == "PANNUMBER") return "PAN Card";
            if (upper == "UAN" || upper == "UANNUMBER") return "UAN Number";
            if (upper == "IFSC" || upper == "BANKIFSC") return "IFSC Code";
            if (upper == "SKU") return "SKU Barcode";
            if (upper == "UOM") return "Unit of Measure";
            if (upper == "CTC") return "Cost to Company (CTC)";

            var sb = new System.Text.StringBuilder();
            for (int i = 0; i < name.Length; i++)
            {
                if (i > 0 && char.IsUpper(name[i]) && (!char.IsUpper(name[i - 1]) || (i + 1 < name.Length && !char.IsUpper(name[i + 1]))))
                {
                    sb.Append(' ');
                }
                sb.Append(name[i]);
            }
            return sb.ToString().Trim();
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

        private static List<EntityFieldMetaDto> GetCoreFieldsForEntity(string entityName)
        {
            return entityName.ToLowerInvariant() switch
            {
                "employee" => new List<EntityFieldMetaDto>
                {
                    new() { Key = "employeeCode", Label = "Employee Code", Type = "text", IsRequired = true, Section = "Personal Details", SortOrder = 1, Placeholder = "EMP-0001" },
                    new() { Key = "fullName", Label = "Full Name", Type = "text", IsRequired = true, Section = "Personal Details", SortOrder = 2, Placeholder = "First and Last Name" },
                    new() { Key = "workEmail", Label = "Work Email", Type = "email", IsRequired = true, Section = "Personal Details", SortOrder = 3, Placeholder = "employee@company.com" },
                    new() { Key = "phone", Label = "Phone Number", Type = "phone", IsRequired = false, Section = "Personal Details", SortOrder = 4, Placeholder = "+91 9876543210" },
                    new() { Key = "gender", Label = "Gender", Type = "select", IsRequired = false, Section = "Personal Details", SortOrder = 5, Options = new() { new() { Value = "Male", Label = "Male" }, new() { Value = "Female", Label = "Female" }, new() { Value = "Other", Label = "Other" } } },
                    new() { Key = "dateOfBirth", Label = "Date of Birth", Type = "date", IsRequired = false, Section = "Personal Details", SortOrder = 6 },
                    new() { Key = "status", Label = "Employment Status", Type = "status", IsRequired = true, Section = "Employment", SortOrder = 10, DefaultValue = "Active", Options = new() { new() { Value = "Active", Label = "Active" }, new() { Value = "OnLeave", Label = "On Leave" }, new() { Value = "Inactive", Label = "Inactive" }, new() { Value = "Terminated", Label = "Terminated" } } },
                    new() { Key = "employmentType", Label = "Employment Type", Type = "select", IsRequired = true, Section = "Employment", SortOrder = 11, DefaultValue = "Permanent", Options = new() { new() { Value = "Permanent", Label = "Permanent" }, new() { Value = "Contract", Label = "Contract" }, new() { Value = "Intern", Label = "Intern" }, new() { Value = "Probationary", Label = "Probationary" } } },
                    new() { Key = "departmentId", Label = "Department", Type = "lookup", IsRequired = false, Section = "Employment", SortOrder = 12, LookupEndpoint = "/api/v1/lookup?type=departments", LookupValueKey = "id", LookupLabelKey = "name" },
                    new() { Key = "designationId", Label = "Designation", Type = "lookup", IsRequired = false, Section = "Employment", SortOrder = 13, LookupEndpoint = "/api/v1/lookup?type=designations", LookupValueKey = "id", LookupLabelKey = "name" },
                    new() { Key = "dateOfJoining", Label = "Date of Joining", Type = "date", IsRequired = true, Section = "Employment", SortOrder = 14 },
                    new() { Key = "workLocation", Label = "Work Location", Type = "text", IsRequired = false, Section = "Employment", SortOrder = 15, Placeholder = "e.g. Bangalore Campus / Remote" },
                    new() { Key = "monthlyCtc", Label = "Monthly CTC", Type = "currency", IsRequired = false, Section = "Compensation", SortOrder = 20, Placeholder = "₹ Monthly Gross" },
                    new() { Key = "basicSalary", Label = "Basic Salary", Type = "currency", IsRequired = false, Section = "Compensation", SortOrder = 21, Placeholder = "₹ Basic Monthly" },
                    new() { Key = "pan", Label = "PAN Card", Type = "text", IsRequired = false, Section = "Statutory & Compliance", SortOrder = 30, Placeholder = "ABCDE1234F" },
                    new() { Key = "uan", Label = "UAN Number", Type = "text", IsRequired = false, Section = "Statutory & Compliance", SortOrder = 31, Placeholder = "Universal Account Number" },
                    new() { Key = "esiNumber", Label = "ESI Number", Type = "text", IsRequired = false, Section = "Statutory & Compliance", SortOrder = 32 },
                    new() { Key = "bankName", Label = "Bank Name", Type = "text", IsRequired = false, Section = "Banking Details", SortOrder = 40, Placeholder = "e.g. HDFC Bank" },
                    new() { Key = "bankAccountNumber", Label = "Bank Account No.", Type = "text", IsRequired = false, Section = "Banking Details", SortOrder = 41 },
                    new() { Key = "bankIfsc", Label = "IFSC Code", Type = "text", IsRequired = false, Section = "Banking Details", SortOrder = 42, Placeholder = "HDFC0001234" },
                },

                "department" => new List<EntityFieldMetaDto>
                {
                    new() { Key = "code", Label = "Department Code", Type = "text", IsRequired = true, Section = "General", SortOrder = 1, Placeholder = "DEP-01" },
                    new() { Key = "name", Label = "Department Name", Type = "text", IsRequired = true, Section = "General", SortOrder = 2, Placeholder = "e.g. Engineering, Sales" },
                    new() { Key = "description", Label = "Description", Type = "textarea", IsRequired = false, Section = "General", SortOrder = 3 },
                    new() { Key = "isActive", Label = "Active Status", Type = "boolean", IsRequired = true, Section = "General", SortOrder = 4, DefaultValue = "true" },
                },

                "designation" => new List<EntityFieldMetaDto>
                {
                    new() { Key = "code", Label = "Designation Code", Type = "text", IsRequired = true, Section = "General", SortOrder = 1, Placeholder = "DES-01" },
                    new() { Key = "name", Label = "Designation Title", Type = "text", IsRequired = true, Section = "General", SortOrder = 2, Placeholder = "e.g. Senior Software Engineer" },
                    new() { Key = "level", Label = "Job Band / Level", Type = "text", IsRequired = false, Section = "General", SortOrder = 3, Placeholder = "L3 / Mid-Senior" },
                    new() { Key = "description", Label = "Description", Type = "textarea", IsRequired = false, Section = "General", SortOrder = 4 },
                    new() { Key = "isActive", Label = "Active Status", Type = "boolean", IsRequired = true, Section = "General", SortOrder = 5, DefaultValue = "true" },
                },

                "project" => new List<EntityFieldMetaDto>
                {
                    new() { Key = "code", Label = "Project Code", Type = "text", IsRequired = true, Section = "General", SortOrder = 1, Placeholder = "PRJ-001" },
                    new() { Key = "name", Label = "Project Name", Type = "text", IsRequired = true, Section = "General", SortOrder = 2, Placeholder = "Client Implementation" },
                    new() { Key = "clientName", Label = "Client Name", Type = "text", IsRequired = false, Section = "General", SortOrder = 3 },
                    new() { Key = "status", Label = "Status", Type = "status", IsRequired = true, Section = "Schedule & Budget", SortOrder = 10, DefaultValue = "Active", Options = new() { new() { Value = "Planning", Label = "Planning" }, new() { Value = "Active", Label = "Active" }, new() { Value = "OnHold", Label = "On Hold" }, new() { Value = "Completed", Label = "Completed" } } },
                    new() { Key = "startDate", Label = "Start Date", Type = "date", IsRequired = false, Section = "Schedule & Budget", SortOrder = 11 },
                    new() { Key = "endDate", Label = "End Date", Type = "date", IsRequired = false, Section = "Schedule & Budget", SortOrder = 12 },
                    new() { Key = "budget", Label = "Project Budget", Type = "currency", IsRequired = false, Section = "Schedule & Budget", SortOrder = 13 },
                },

                "shift" => new List<EntityFieldMetaDto>
                {
                    new() { Key = "code", Label = "Shift Code", Type = "text", IsRequired = true, Section = "General", SortOrder = 1, Placeholder = "SH-MORNING" },
                    new() { Key = "name", Label = "Shift Name", Type = "text", IsRequired = true, Section = "General", SortOrder = 2, Placeholder = "General Morning Shift" },
                    new() { Key = "startTime", Label = "Start Time", Type = "text", IsRequired = true, Section = "Timing & Rules", SortOrder = 3, Placeholder = "09:00" },
                    new() { Key = "endTime", Label = "End Time", Type = "text", IsRequired = true, Section = "Timing & Rules", SortOrder = 4, Placeholder = "18:00" },
                    new() { Key = "gracePeriodMinutes", Label = "Grace Period (Mins)", Type = "number", IsRequired = false, Section = "Timing & Rules", SortOrder = 5, DefaultValue = "15" },
                    new() { Key = "isActive", Label = "Active Status", Type = "boolean", IsRequired = true, Section = "General", SortOrder = 6, DefaultValue = "true" },
                },

                "leave" => new List<EntityFieldMetaDto>
                {
                    new() { Key = "employeeId", Label = "Employee", Type = "lookup", IsRequired = true, Section = "Request Details", SortOrder = 1, LookupEndpoint = "/api/v1/lookup?type=employees", LookupValueKey = "id", LookupLabelKey = "name" },
                    new() { Key = "leaveType", Label = "Leave Type", Type = "select", IsRequired = true, Section = "Request Details", SortOrder = 2, Options = new() { new() { Value = "Paid", Label = "Paid / Privilege Leave" }, new() { Value = "Casual", Label = "Casual Leave" }, new() { Value = "Sick", Label = "Sick Leave" }, new() { Value = "Unpaid", Label = "Leave Without Pay" } } },
                    new() { Key = "startDate", Label = "Start Date", Type = "date", IsRequired = true, Section = "Request Details", SortOrder = 3 },
                    new() { Key = "endDate", Label = "End Date", Type = "date", IsRequired = true, Section = "Request Details", SortOrder = 4 },
                    new() { Key = "reason", Label = "Reason for Leave", Type = "textarea", IsRequired = false, Section = "Request Details", SortOrder = 5 },
                    new() { Key = "status", Label = "Status", Type = "status", IsRequired = true, Section = "Approval", SortOrder = 10, DefaultValue = "Pending", Options = new() { new() { Value = "Pending", Label = "Pending" }, new() { Value = "Approved", Label = "Approved" }, new() { Value = "Rejected", Label = "Rejected" } } },
                },

                "attendance" => new List<EntityFieldMetaDto>
                {
                    new() { Key = "employeeId", Label = "Employee", Type = "lookup", IsRequired = true, Section = "Punch Record", SortOrder = 1, LookupEndpoint = "/api/v1/lookup?type=employees", LookupValueKey = "id", LookupLabelKey = "name" },
                    new() { Key = "punchDate", Label = "Punch Date", Type = "date", IsRequired = true, Section = "Punch Record", SortOrder = 2 },
                    new() { Key = "checkInTime", Label = "Check-In Time", Type = "text", IsRequired = false, Section = "Punch Record", SortOrder = 3 },
                    new() { Key = "checkOutTime", Label = "Check-Out Time", Type = "text", IsRequired = false, Section = "Punch Record", SortOrder = 4 },
                    new() { Key = "status", Label = "Day Status", Type = "status", IsRequired = true, Section = "Punch Record", SortOrder = 5, DefaultValue = "Present", Options = new() { new() { Value = "Present", Label = "Present" }, new() { Value = "Absent", Label = "Absent" }, new() { Value = "Late", Label = "Late" }, new() { Value = "HalfDay", Label = "Half Day" } } },
                },

                "branch" => new List<EntityFieldMetaDto>
                {
                    new() { Key = "code", Label = "Branch Code", Type = "text", IsRequired = true, Section = "General", SortOrder = 1, Placeholder = "BR-01" },
                    new() { Key = "name", Label = "Branch Name", Type = "text", IsRequired = true, Section = "General", SortOrder = 2, Placeholder = "Mumbai Regional Office" },
                    new() { Key = "city", Label = "City", Type = "text", IsRequired = false, Section = "Location", SortOrder = 3 },
                    new() { Key = "state", Label = "State", Type = "text", IsRequired = false, Section = "Location", SortOrder = 4 },
                    new() { Key = "gstin", Label = "Branch GSTIN", Type = "text", IsRequired = false, Section = "Location", SortOrder = 5 },
                    new() { Key = "isActive", Label = "Is Active", Type = "boolean", IsRequired = true, Section = "General", SortOrder = 6, DefaultValue = "true" },
                },

                "businessunit" => new List<EntityFieldMetaDto>
                {
                    new() { Key = "code", Label = "BU Code", Type = "text", IsRequired = true, Section = "General", SortOrder = 1, Placeholder = "BU-TECH" },
                    new() { Key = "name", Label = "Business Unit Title", Type = "text", IsRequired = true, Section = "General", SortOrder = 2, Placeholder = "Cloud Solutions" },
                    new() { Key = "description", Label = "Description", Type = "textarea", IsRequired = false, Section = "General", SortOrder = 3 },
                    new() { Key = "isActive", Label = "Is Active", Type = "boolean", IsRequired = true, Section = "General", SortOrder = 4, DefaultValue = "true" },
                },

                "costcenter" => new List<EntityFieldMetaDto>
                {
                    new() { Key = "code", Label = "Cost Center Code", Type = "text", IsRequired = true, Section = "General", SortOrder = 1, Placeholder = "CC-RND" },
                    new() { Key = "name", Label = "Cost Center Name", Type = "text", IsRequired = true, Section = "General", SortOrder = 2, Placeholder = "R&D Software Labs" },
                    new() { Key = "costCenterType", Label = "Type", Type = "select", IsRequired = false, Section = "General", SortOrder = 3, Options = new() { new() { Value = "Cost Center", Label = "Cost Center" }, new() { Value = "Profit Center", Label = "Profit Center" }, new() { Value = "Revenue Center", Label = "Revenue Center" } } },
                    new() { Key = "isActive", Label = "Is Active", Type = "boolean", IsRequired = true, Section = "General", SortOrder = 4, DefaultValue = "true" },
                },

                "company" => new List<EntityFieldMetaDto>
                {
                    new() { Key = "name", Label = "Company Name", Type = "text", IsRequired = true, Section = "Corporate Identity", SortOrder = 1, Placeholder = "UAB India Private Limited" },
                    new() { Key = "legalName", Label = "Legal Registered Name", Type = "text", IsRequired = false, Section = "Corporate Identity", SortOrder = 2 },
                    new() { Key = "gstin", Label = "Corporate GSTIN", Type = "text", IsRequired = false, Section = "Statutory", SortOrder = 3, Placeholder = "27AAAAA0000A1Z5" },
                    new() { Key = "pan", Label = "Company PAN", Type = "text", IsRequired = false, Section = "Statutory", SortOrder = 4 },
                    new() { Key = "cin", Label = "Corporate CIN", Type = "text", IsRequired = false, Section = "Statutory", SortOrder = 5 },
                    new() { Key = "city", Label = "City", Type = "text", IsRequired = false, Section = "Registered Address", SortOrder = 6 },
                    new() { Key = "state", Label = "State", Type = "text", IsRequired = false, Section = "Registered Address", SortOrder = 7 },
                },

                "customer" => new List<EntityFieldMetaDto>
                {
                    new() { Key = "code", Label = "Customer Code", Type = "text", IsRequired = true, Section = "Account Details", SortOrder = 1, Placeholder = "CUST-001" },
                    new() { Key = "name", Label = "Customer Name / Org", Type = "text", IsRequired = true, Section = "Account Details", SortOrder = 2, Placeholder = "Acme Corp Ltd" },
                    new() { Key = "email", Label = "Billing Email", Type = "email", IsRequired = false, Section = "Account Details", SortOrder = 3 },
                    new() { Key = "phone", Label = "Contact Phone", Type = "phone", IsRequired = false, Section = "Account Details", SortOrder = 4 },
                    new() { Key = "gstin", Label = "GST Number", Type = "text", IsRequired = false, Section = "Billing & Tax", SortOrder = 5, Placeholder = "GSTIN" },
                    new() { Key = "city", Label = "City", Type = "text", IsRequired = false, Section = "Billing & Tax", SortOrder = 6 },
                    new() { Key = "status", Label = "Account Status", Type = "status", IsRequired = true, Section = "Account Details", SortOrder = 7, DefaultValue = "Active", Options = new() { new() { Value = "Active", Label = "Active" }, new() { Value = "Inactive", Label = "Inactive" } } },
                },

                "vendor" => new List<EntityFieldMetaDto>
                {
                    new() { Key = "code", Label = "Vendor Code", Type = "text", IsRequired = true, Section = "Vendor Profile", SortOrder = 1, Placeholder = "VEND-001" },
                    new() { Key = "name", Label = "Vendor Name", Type = "text", IsRequired = true, Section = "Vendor Profile", SortOrder = 2, Placeholder = "Supplier Enterprises" },
                    new() { Key = "email", Label = "Contact Email", Type = "email", IsRequired = false, Section = "Vendor Profile", SortOrder = 3 },
                    new() { Key = "phone", Label = "Phone", Type = "phone", IsRequired = false, Section = "Vendor Profile", SortOrder = 4 },
                    new() { Key = "gstin", Label = "Vendor GSTIN", Type = "text", IsRequired = false, Section = "Commercial & Terms", SortOrder = 5 },
                    new() { Key = "paymentTerms", Label = "Payment Terms", Type = "select", IsRequired = false, Section = "Commercial & Terms", SortOrder = 6, Options = new() { new() { Value = "Net 15", Label = "Net 15 Days" }, new() { Value = "Net 30", Label = "Net 30 Days" }, new() { Value = "Immediate", Label = "Immediate / Advance" } } },
                    new() { Key = "status", Label = "Status", Type = "status", IsRequired = true, Section = "Vendor Profile", SortOrder = 7, DefaultValue = "Active", Options = new() { new() { Value = "Active", Label = "Active" }, new() { Value = "Blacklisted", Label = "Blacklisted" } } },
                },

                "item" => new List<EntityFieldMetaDto>
                {
                    new() { Key = "code", Label = "Item SKU Code", Type = "text", IsRequired = true, Section = "Item Master", SortOrder = 1, Placeholder = "SKU-1001" },
                    new() { Key = "name", Label = "Item Name", Type = "text", IsRequired = true, Section = "Item Master", SortOrder = 2, Placeholder = "Office Ergonomic Desk" },
                    new() { Key = "category", Label = "Item Category", Type = "text", IsRequired = false, Section = "Item Master", SortOrder = 3 },
                    new() { Key = "hsnCode", Label = "HSN / SAC Code", Type = "text", IsRequired = false, Section = "Valuation & Tax", SortOrder = 4 },
                    new() { Key = "standardRate", Label = "Standard Unit Price", Type = "currency", IsRequired = false, Section = "Valuation & Tax", SortOrder = 5, Placeholder = "₹ Unit Rate" },
                    new() { Key = "unitOfMeasure", Label = "UOM", Type = "select", IsRequired = true, Section = "Item Master", SortOrder = 6, DefaultValue = "Pcs", Options = new() { new() { Value = "Pcs", Label = "Pieces (Pcs)" }, new() { Value = "Kg", Label = "Kilograms (Kg)" }, new() { Value = "Box", Label = "Boxes (Box)" }, new() { Value = "Meter", Label = "Meters (M)" } } },
                    new() { Key = "isActive", Label = "Is Active", Type = "boolean", IsRequired = true, Section = "Item Master", SortOrder = 7, DefaultValue = "true" },
                },

                "warehouse" => new List<EntityFieldMetaDto>
                {
                    new() { Key = "code", Label = "Warehouse Code", Type = "text", IsRequired = true, Section = "Facility Details", SortOrder = 1, Placeholder = "WH-CENTRAL" },
                    new() { Key = "name", Label = "Warehouse Name", Type = "text", IsRequired = true, Section = "Facility Details", SortOrder = 2, Placeholder = "Central Depot Warehouse" },
                    new() { Key = "city", Label = "City", Type = "text", IsRequired = false, Section = "Location", SortOrder = 3 },
                    new() { Key = "state", Label = "State", Type = "text", IsRequired = false, Section = "Location", SortOrder = 4 },
                    new() { Key = "isActive", Label = "Is Active", Type = "boolean", IsRequired = true, Section = "Facility Details", SortOrder = 5, DefaultValue = "true" },
                },

                "invoice" => new List<EntityFieldMetaDto>
                {
                    new() { Key = "invoiceNumber", Label = "Invoice Number", Type = "text", IsRequired = true, Section = "Invoice Header", SortOrder = 1, Placeholder = "INV-2026-001" },
                    new() { Key = "invoiceDate", Label = "Invoice Date", Type = "date", IsRequired = true, Section = "Invoice Header", SortOrder = 2 },
                    new() { Key = "dueDate", Label = "Due Date", Type = "date", IsRequired = false, Section = "Invoice Header", SortOrder = 3 },
                    new() { Key = "customerName", Label = "Customer", Type = "text", IsRequired = true, Section = "Invoice Header", SortOrder = 4 },
                    new() { Key = "totalAmount", Label = "Total Invoice Amount", Type = "currency", IsRequired = true, Section = "Financials", SortOrder = 5 },
                    new() { Key = "taxAmount", Label = "Tax (GST)", Type = "currency", IsRequired = false, Section = "Financials", SortOrder = 6 },
                    new() { Key = "status", Label = "Invoice Status", Type = "status", IsRequired = true, Section = "Financials", SortOrder = 7, DefaultValue = "Unpaid", Options = new() { new() { Value = "Draft", Label = "Draft" }, new() { Value = "Sent", Label = "Sent" }, new() { Value = "Paid", Label = "Paid" }, new() { Value = "Overdue", Label = "Overdue" } } },
                },

                _ => new List<EntityFieldMetaDto>
                {
                    new() { Key = "code", Label = "Code", Type = "text", IsRequired = true, Section = "General", SortOrder = 1 },
                    new() { Key = "name", Label = "Name", Type = "text", IsRequired = true, Section = "General", SortOrder = 2 },
                    new() { Key = "description", Label = "Description", Type = "textarea", IsRequired = false, Section = "General", SortOrder = 3 },
                    new() { Key = "isActive", Label = "Is Active", Type = "boolean", IsRequired = true, Section = "General", SortOrder = 4, DefaultValue = "true" },
                }
            };
        }
    }
}
