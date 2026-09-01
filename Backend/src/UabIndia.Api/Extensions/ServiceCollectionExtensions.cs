using System;
using Hangfire;
using Hangfire.SqlServer;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using UabIndia.Api.Services;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Authorization;
using UabIndia.Core.Security;
using UabIndia.Core.Services;
using UabIndia.Infrastructure.Data;
using UabIndia.Infrastructure.Repositories;
using UabIndia.Infrastructure.Services;
using UabIndia.Infrastructure.Services.Payments;
using UabIndia.Infrastructure.Services.Payroll;
using UabIndia.Infrastructure.Services.Tax;

namespace UabIndia.Api.Extensions
{
    public static class ServiceCollectionExtensions
    {
        public static IServiceCollection AddEnterprisePersistence(
            this IServiceCollection services,
            IConfiguration configuration,
            IHostEnvironment env)
        {
            var rawConnectionString = configuration.GetConnectionString("DefaultConnection");
            if (string.IsNullOrWhiteSpace(rawConnectionString) && !env.IsEnvironment("Test"))
            {
                throw new InvalidOperationException(
                    "ConnectionStrings:DefaultConnection is not configured. Set it via environment variable or appsettings.json.");
            }

            var sqlServerConnectionString = NormalizeSqlServerConnectionString(rawConnectionString ?? string.Empty, env);
            configuration["ConnectionStrings:DefaultConnection"] = sqlServerConnectionString;

            services.AddDbContext<ApplicationDbContext>(options =>
            {
                options.UseSqlServer(sqlServerConnectionString, sql =>
                {
                    sql.EnableRetryOnFailure(5, TimeSpan.FromSeconds(5), errorNumbersToAdd: null);
                    sql.CommandTimeout(60);
                    sql.UseQuerySplittingBehavior(QuerySplittingBehavior.SplitQuery);
                });
                options.ConfigureWarnings(w => w.Ignore(RelationalEventId.PendingModelChangesWarning));
                options.ReplaceService<IModelCacheKeyFactory, TenantModelCacheKeyFactory>();
            });

            services.AddHostedService<DatabaseInitializationService>();

            return services;
        }

        public static IServiceCollection AddEnterpriseCaching(
            this IServiceCollection services,
            IConfiguration configuration)
        {
            services.AddMemoryCache();

            var redisConnection = configuration.GetConnectionString("Redis") ?? configuration["Redis:Connection"];
            if (!string.IsNullOrEmpty(redisConnection))
            {
                services.AddStackExchangeRedisCache(options =>
                {
                    options.Configuration = redisConnection;
                    options.InstanceName = "hrms_";
                });
            }
            else
            {
                services.AddDistributedMemoryCache();
            }

            services.AddScoped<ICacheService, DistributedCacheService>();
            return services;
        }

        public static IServiceCollection AddEnterpriseBackgroundJobs(
            this IServiceCollection services,
            IConfiguration configuration,
            IHostEnvironment env)
        {
            if (env.IsEnvironment("Test"))
            {
                return services;
            }

            var connectionString = configuration.GetConnectionString("DefaultConnection") ?? string.Empty;
            services.AddHangfire(config =>
            {
                config.UseSqlServerStorage(connectionString, new SqlServerStorageOptions
                {
                    CommandBatchMaxTimeout = TimeSpan.FromSeconds(45),
                    SlidingInvisibilityTimeout = TimeSpan.FromMinutes(5),
                    QueuePollInterval = TimeSpan.FromSeconds(15),
                    UseRecommendedIsolationLevel = true,
                    DisableGlobalLocks = true,
                    PrepareSchemaIfNecessary = true,
                    CommandTimeout = TimeSpan.FromSeconds(45),
                });
            });

            services.AddHangfireServer(options =>
            {
                options.WorkerCount = env.IsDevelopment() ? 2 : Math.Max(2, Environment.ProcessorCount);
                options.SchedulePollingInterval = TimeSpan.FromSeconds(30);
                options.Queues = new[] { "tenant-provisioning", "default" };
            });

            services.AddScoped<HangfireJobService>();
            return services;
        }

        public static IServiceCollection AddEnterpriseBusinessServices(this IServiceCollection services)
        {
            // Context & Tenants
            services.AddScoped<IRequestContext, HttpRequestContext>();
            services.AddScoped<ITenantAccessor, TenantAccessor>();
            services.AddScoped<TenantProvisioningService>();
            services.AddScoped<TenantResolutionService>();
            services.AddScoped<TenantEmailService>();
            services.AddScoped<IUiSchemaService, UiSchemaService>();
            services.AddScoped<IWebsiteContentService, WebsiteContentService>();
            services.AddSingleton<RoleMappingResolver>();
            services.AddScoped<InputSanitizer>();

            // Security & Encryption
            services.AddSingleton<IEncryptionService, AesEncryptionService>();
            services.AddScoped<IPolicyEngine, PolicyEngineService>();

            // Repositories
            services.AddScoped<IRefreshTokenRepository, RefreshTokenRepository>();
            services.AddScoped<IAppraisalRepository, AppraisalRepository>();
            services.AddScoped<IRecruitmentRepository, RecruitmentRepository>();
            services.AddScoped<ITrainingRepository, TrainingRepository>();
            services.AddScoped<IAssetRepository, AssetRepository>();
            services.AddScoped<IFixedAssetDepreciationService, FixedAssetDepreciationService>();
            services.AddScoped<IShiftRepository, ShiftRepository>();
            services.AddScoped<IOvertimeRepository, OvertimeRepository>();
            services.AddScoped<IComplianceRepository, ComplianceRepository>();

            // Finance & Ledger
            services.AddScoped<ILedgerPostingService, LedgerPostingService>();
            services.AddScoped<IJournalEntryService, JournalEntryService>();
            services.AddScoped<IAccountingPeriodService, AccountingPeriodService>();
            services.AddScoped<IFinancialStatementService, FinancialStatementService>();
            services.AddScoped<IChartOfAccountsTemplateService, ChartOfAccountsTemplateService>();
            services.AddScoped<IFinancialConsolidationService, FinancialConsolidationService>();
            services.AddScoped<IBankReconciliationService, BankReconciliationService>();
            services.AddSingleton<IBankFeedParserService, BankFeedParserService>();
            services.AddSingleton<IEdiParserService, EdiParserService>();
            services.AddScoped<IExpenseClaimService, ExpenseClaimService>();
            services.AddScoped<IEInvoiceService, EInvoiceService>();
            services.AddScoped<IBudgetingService, BudgetingService>();

            // Multi-Currency & Localization
            services.AddScoped<ICurrencyConversionService, CurrencyConversionService>();
            services.AddSingleton<ICurrencyExchangeService, CurrencyExchangeService>();
            services.AddScoped<ILocalizationService, GlobalLocalizationService>();
            services.AddScoped<IIndustryExtensionService, GlobalIndustryExtensionService>();
            services.AddSingleton<ITaxCalculationEngine, TaxEngineRouter>();

            // Commercial & Operations
            services.AddScoped<IDocumentNumberService, DocumentNumberService>();
            services.AddScoped<IDocumentSequenceService, DocumentSequenceService>();
            services.AddScoped<IDocumentConversionService, DocumentConversionService>();
            services.AddScoped<ISalesInvoiceService, SalesInvoiceService>();
            services.AddScoped<ISalesReturnService, SalesReturnService>();
            services.AddScoped<IPurchaseInvoiceService, PurchaseInvoiceService>();
            services.AddScoped<IPurchaseRequestService, PurchaseRequestService>();
            services.AddScoped<ICommercialOrderService, CommercialOrderService>();
            services.AddScoped<IGoodsReceiptService, GoodsReceiptService>();
            services.AddScoped<IInventoryStockService, InventoryStockService>();
            services.AddScoped<IStockTransferService, StockTransferService>();
            services.AddScoped<IAutomatedReorderService, AutomatedReorderService>();
            services.AddScoped<IBatchTrackingService, BatchTrackingService>();
            services.AddScoped<IMrpEngineService, MrpEngineService>();
            services.AddScoped<IDemandForecastingService, DemandForecastingService>();
            services.AddScoped<IWorkOrderService, WorkOrderService>();
            services.AddScoped<IB2BPortalService, B2BPortalService>();
            services.AddScoped<IPricingEngineService, PricingEngineService>();
            services.AddScoped<IWmsService, WmsService>();
            services.AddScoped<IFieldServiceDispatchService, FieldServiceDispatchService>();

            // Payments & Subscriptions
            services.AddScoped<IPaymentService, PaymentService>();
            services.AddSingleton<IPaymentGatewayFactory, PaymentGatewayFactory>();
            services.AddScoped<ISubscriptionBillingService, SubscriptionBillingService>();

            // Global HRMS & Payroll
            services.AddScoped<IEmployeeService, EmployeeService>();
            services.AddScoped<IHrLifecycleService, HrLifecycleService>();
            services.AddScoped<ILeaveRequestService, LeaveRequestService>();
            services.AddScoped<ITimesheetService, TimesheetService>();
            services.AddScoped<IAttendanceVerificationService, AttendanceVerificationService>();
            services.AddScoped<IOvertimeApprovalService, OvertimeApprovalService>();
            services.AddScoped<IOvertimeRequestService, OvertimeRequestService>();
            services.AddScoped<IAppraisalCycleService, AppraisalCycleService>();
            services.AddScoped<IAppraisalAssessmentService, AppraisalAssessmentService>();
            services.AddScoped<IRecruitmentLifecycleService, RecruitmentLifecycleService>();
            services.AddScoped<IPayrollEngine, PayrollEngineService>();
            services.AddScoped<IPayrollEmployeeFinanceService, PayrollEmployeeFinanceService>();
            services.AddScoped<IPayrollSettlementService, PayrollSettlementService>();
            services.AddSingleton<IPayrollCalculationEngine, GlobalPayrollRouter>();

            // Workflow, Approvals & Domain Events
            services.AddScoped<IApprovalRequestService, ApprovalRequestService>();
            services.AddScoped<IWorkflowDefinitionService, WorkflowDefinitionService>();
            services.AddScoped<IWorkflowApprovalQueryService, WorkflowApprovalQueryService>();
            services.AddScoped<IWorkflowService, EfWorkflowService>();
            services.AddScoped<INotificationEmitter, NotificationEmitterService>();
            services.AddScoped<IRealtimeNotifier, RealtimeNotifierService>();

            // Domain Event Dispatcher & Handlers
            services.AddScoped<IDomainEventDispatcher, DomainEventDispatcher>();
            services.AddScoped<IDomainEventHandler<SalesOrderConfirmedEvent>, SalesOrderConfirmedHandler>();
            services.AddScoped<IDomainEventHandler<StockDepletedEvent>, StockDepletedHandler>();
            services.AddScoped<IDomainEventHandler<PaymentReceivedEvent>, PaymentReceivedHandler>();

            services.AddHostedService<OutboxProcessorJob>();

            // AI Copilot
            services.AddScoped<IAiCopilotService, AiCopilotService>();

            return services;
        }

        private static string NormalizeSqlServerConnectionString(string connectionString, IHostEnvironment env)
        {
            if (string.IsNullOrWhiteSpace(connectionString))
            {
                return connectionString;
            }

            var builder = new SqlConnectionStringBuilder(connectionString);
            if (env.IsDevelopment())
            {
                builder.TrustServerCertificate = true;
                builder.ConnectTimeout = Math.Max(builder.ConnectTimeout, 45);
                if (builder.MaxPoolSize < 100)
                {
                    builder.MaxPoolSize = 256;
                }
            }

            return builder.ConnectionString;
        }
    }
}
