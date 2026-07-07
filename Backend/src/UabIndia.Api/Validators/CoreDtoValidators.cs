using FluentValidation;
using UabIndia.Api.Models;
using UabIndia.Core.Authorization;

namespace UabIndia.Api.Validators
{
    public sealed class CreateTenantDtoValidator : AbstractValidator<CreateTenantDto>
    {
        public CreateTenantDtoValidator()
        {
            RuleFor(x => x.Name)
                .NotEmpty()
                .MaximumLength(100);

            RuleFor(x => x.Subdomain)
                .NotEmpty()
                .MaximumLength(60)
                .Matches("^[a-z0-9-]+$")
                .WithMessage("Subdomain can only contain lowercase letters, numbers, and hyphens.");

            RuleFor(x => x.AdminEmail)
                .NotEmpty()
                .EmailAddress()
                .MaximumLength(200);

            RuleFor(x => x.AdminName)
                .NotEmpty()
                .MaximumLength(150);

            RuleFor(x => x.AdminRole)
                .NotEmpty()
                .MaximumLength(50)
                .Must(r =>
                {
                    var parsed = RoleCatalog.Parse(r);
                    return parsed == SystemRole.Admin || parsed == SystemRole.SuperAdmin;
                })
                .WithMessage("Admin role must be Admin or SuperAdmin.");

            RuleFor(x => x.SubscriptionPlan)
                .NotEmpty()
                .MaximumLength(50);

            RuleFor(x => x.Status)
                .NotEmpty()
                .Must(s => AllowedStatuses.Contains((s ?? string.Empty).Trim().ToLowerInvariant()))
                .WithMessage("Status must be one of: active, inactive, suspended, trial.");

            RuleFor(x => x.SelectedModules)
                .NotNull()
                .Must(m => m is { Length: > 0 })
                .WithMessage("At least one module must be selected.");

            RuleForEach(x => x.SelectedModules)
                .NotEmpty()
                .MaximumLength(64)
                .Matches("^[a-z0-9-]+$")
                .WithMessage("Module keys can only contain lowercase letters, numbers, and hyphens.");

            RuleFor(x => x)
                .Must(x => x.SendInviteLink || !string.IsNullOrWhiteSpace(x.AdminPassword))
                .WithMessage("Admin password is required when invite flow is not enabled.");

            RuleFor(x => x.AdminPassword)
                .NotEmpty()
                .MinimumLength(8)
                .MaximumLength(200)
                .When(x => !x.SendInviteLink);

            RuleFor(x => x.Timezone)
                .NotEmpty()
                .MaximumLength(100);

            RuleFor(x => x.Currency)
                .NotEmpty()
                .MaximumLength(10);

            RuleFor(x => x.Language)
                .NotEmpty()
                .MaximumLength(20);

            RuleFor(x => x.EmployeeLimit)
                .GreaterThan(0)
                .When(x => x.EmployeeLimit.HasValue);

            RuleFor(x => x.StorageLimitGb)
                .GreaterThan(0)
                .When(x => x.StorageLimitGb.HasValue);

            RuleFor(x => x.SmsCredits)
                .GreaterThanOrEqualTo(0)
                .When(x => x.SmsCredits.HasValue);

            RuleFor(x => x.SmtpPort)
                .InclusiveBetween(1, 65535)
                .When(x => x.SmtpPort.HasValue);

            RuleFor(x => x.SmtpPassword)
                .MaximumLength(256)
                .When(x => !string.IsNullOrWhiteSpace(x.SmtpPassword));

            RuleFor(x => x.SmtpFromEmail)
                .EmailAddress()
                .When(x => !string.IsNullOrWhiteSpace(x.SmtpFromEmail));
        }

        private static readonly HashSet<string> AllowedStatuses = new(StringComparer.OrdinalIgnoreCase)
        {
            "active",
            "inactive",
            "suspended",
            "trial"
        };
    }

    public sealed class UpdateTenantDtoValidator : AbstractValidator<UpdateTenantDto>
    {
        public UpdateTenantDtoValidator()
        {
            RuleFor(x => x.Name)
                .MaximumLength(100)
                .When(x => x.Name is not null);

            RuleFor(x => x.Subdomain)
                .MaximumLength(60)
                .Matches("^[a-z0-9-]+$")
                .WithMessage("Subdomain can only contain lowercase letters, numbers, and hyphens.")
                .When(x => !string.IsNullOrWhiteSpace(x.Subdomain));

            RuleFor(x => x.Status)
                .Must(s => string.IsNullOrWhiteSpace(s) || AllowedStatuses.Contains(s.Trim().ToLowerInvariant()))
                .WithMessage("Status must be one of: active, inactive, suspended, trial.");

            RuleForEach(x => x.SelectedModules!)
                .NotEmpty()
                .MaximumLength(64)
                .Matches("^[a-z0-9-]+$")
                .WithMessage("Module keys can only contain lowercase letters, numbers, and hyphens.")
                .When(x => x.SelectedModules is { Length: > 0 });

            RuleFor(x => x.SmtpPort)
                .InclusiveBetween(1, 65535)
                .When(x => x.SmtpPort.HasValue);

            RuleFor(x => x.SmtpPassword)
                .MaximumLength(256)
                .When(x => !string.IsNullOrWhiteSpace(x.SmtpPassword));

            RuleFor(x => x.SmtpFromEmail)
                .EmailAddress()
                .When(x => !string.IsNullOrWhiteSpace(x.SmtpFromEmail));

            RuleFor(x => x.EmployeeLimit)
                .GreaterThan(0)
                .When(x => x.EmployeeLimit.HasValue);

            RuleFor(x => x.StorageLimitGb)
                .GreaterThan(0)
                .When(x => x.StorageLimitGb.HasValue);

            RuleFor(x => x.SmsCredits)
                .GreaterThanOrEqualTo(0)
                .When(x => x.SmsCredits.HasValue);
        }

        private static readonly HashSet<string> AllowedStatuses = new(StringComparer.OrdinalIgnoreCase)
        {
            "active",
            "inactive",
            "suspended",
            "trial"
        };
    }

    public sealed class CreateCompanyDtoValidator : AbstractValidator<CreateCompanyDto>
    {
        public CreateCompanyDtoValidator()
        {
            Include(new CompanyDtoRuleSet<CreateCompanyDto>());

            RuleFor(x => x.Name)
                .NotEmpty()
                .MaximumLength(200);
        }
    }

    public sealed class UpdateCompanyDtoValidator : AbstractValidator<UpdateCompanyDto>
    {
        public UpdateCompanyDtoValidator()
        {
            Include(new CompanyDtoRuleSet<UpdateCompanyDto>());

            RuleFor(x => x.Name)
                .NotEmpty()
                .MaximumLength(200)
                .When(x => x.Name is not null);
        }
    }

    internal sealed class CompanyDtoRuleSet<T> : AbstractValidator<T>
        where T : class
    {
        public CompanyDtoRuleSet()
        {
            RuleForString("LegalName", 200);
            RuleForString("Code", 50);
            RuleForString("RegistrationNumber", 100);
            RuleForString("TaxId", 100);
            RuleForEmail("Email");
            RuleForString("PhoneNumber", 30);
            RuleForString("WebsiteUrl", 200);
            RuleForString("LogoUrl", 500);
            RuleForString("Industry", 100);
            RuleForString("CompanySize", 50);
            RuleForString("RegistrationAddress", 500);
            RuleForString("OperationalAddress", 500);
            RuleForString("City", 100);
            RuleForString("State", 100);
            RuleForString("PostalCode", 20);
            RuleForString("Country", 100);
            RuleForString("BankAccountNumber", 50);
            RuleForString("BankName", 100);
            RuleForString("BankBranch", 100);
            RuleForString("IFSCCode", 20);
            RuleForString("ContactPersonName", 150);
            RuleForString("ContactPersonPhone", 30);
            RuleForEmail("ContactPersonEmail");
            RuleForString("HR_PersonName", 150);
            RuleForEmail("HR_PersonEmail");
            RuleForString("Notes", 2000);

            RuleForDynamic("FinancialYearStart")
                .Matches("^\\d{2}-\\d{2}$")
                .WithMessage("FinancialYearStart must use MM-DD format.")
                .When(x => HasValue(x, "FinancialYearStart"));

            RuleForDynamic("FinancialYearEnd")
                .Matches("^\\d{2}-\\d{2}$")
                .WithMessage("FinancialYearEnd must use MM-DD format.")
                .When(x => HasValue(x, "FinancialYearEnd"));

            RuleForNullableInt("MaxEmployees")
                .GreaterThanOrEqualTo(1)
                .When(x => HasNumericValue(x, "MaxEmployees"));
        }

        private IRuleBuilderOptions<T, string?> RuleForString(string propertyName, int maxLength)
        {
            return RuleForDynamic(propertyName)
                .MaximumLength(maxLength)
                .When(x => HasValue(x, propertyName));
        }

        private IRuleBuilderOptions<T, string?> RuleForEmail(string propertyName)
        {
            return RuleForDynamic(propertyName)
                .EmailAddress()
                .When(x => HasValue(x, propertyName));
        }

        private IRuleBuilderInitial<T, string?> RuleForDynamic(string propertyName)
        {
            return RuleFor(x => GetStringValue(x, propertyName));
        }

        private IRuleBuilderInitial<T, int?> RuleForNullableInt(string propertyName)
        {
            return RuleFor(x => GetIntValue(x, propertyName));
        }

        private static string? GetStringValue(T target, string propertyName)
        {
            var property = typeof(T).GetProperty(propertyName);
            return property?.GetValue(target) as string;
        }

        private static bool HasValue(T target, string propertyName)
        {
            return !string.IsNullOrWhiteSpace(GetStringValue(target, propertyName));
        }

        private static bool HasNumericValue(T target, string propertyName)
        {
            return GetIntValue(target, propertyName).HasValue;
        }

        private static int? GetIntValue(T target, string propertyName)
        {
            var property = typeof(T).GetProperty(propertyName);
            var value = property?.GetValue(target);

            return value switch
            {
                int intValue => intValue,
                _ => null
            };
        }
    }
}
