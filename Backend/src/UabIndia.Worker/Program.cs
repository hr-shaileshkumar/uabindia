using System;
using System.Threading;
using System.Threading.Tasks;
using Hangfire;
using Hangfire.SqlServer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Serilog;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Services;
using UabIndia.Infrastructure.Data;
using UabIndia.Infrastructure.Services;

namespace UabIndia.Worker
{
    public class Program
    {
        public static async Task Main(string[] args)
        {
            Log.Logger = new LoggerConfiguration()
                .Enrich.FromLogContext()
                .WriteTo.Console()
                .CreateLogger();

            try
            {
                Log.Information("Starting UABIndia Dedicated ERP Background Worker...");
                var host = CreateHostBuilder(args).Build();
                await host.RunAsync();
            }
            catch (Exception ex)
            {
                Log.Fatal(ex, "UABIndia Background Worker terminated unexpectedly.");
            }
            finally
            {
                await Log.CloseAndFlushAsync();
            }
        }

        public static IHostBuilder CreateHostBuilder(string[] args) =>
            Host.CreateDefaultBuilder(args)
                .UseSerilog((context, services, configuration) => configuration
                    .ReadFrom.Configuration(context.Configuration)
                    .ReadFrom.Services(services)
                    .Enrich.FromLogContext()
                    .WriteTo.Console())
                .ConfigureServices((hostContext, services) =>
                {
                    var configuration = hostContext.Configuration;
                    var connectionString = configuration.GetConnectionString("DefaultConnection") ?? string.Empty;

                    // Core Infrastructure & Persistence
                    services.AddDbContext<ApplicationDbContext>(options =>
                    {
                        if (!string.IsNullOrWhiteSpace(connectionString))
                        {
                            options.UseSqlServer(connectionString);
                        }
                    });

                    // Common Application Services
                    services.AddScoped<ITenantAccessor, TenantAccessor>();
                    services.AddSingleton<IEncryptionService, AesEncryptionService>();
                    services.AddScoped<IStorageProvider, LocalStorageProvider>();
                    services.AddScoped<IDataScopeEvaluator, DataScopeEvaluator>();
                    services.AddSingleton<IBusinessRuleEvaluator, BusinessRuleEvaluator>();
                    services.AddScoped<HangfireJobService>();

                    // Configure Hangfire Storage and Server
                    if (!string.IsNullOrWhiteSpace(connectionString))
                    {
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
                            options.WorkerCount = Math.Max(2, Environment.ProcessorCount * 2);
                            options.SchedulePollingInterval = TimeSpan.FromSeconds(15);
                            options.Queues = new[]
                            {
                                "critical",
                                "payroll",
                                "reports",
                                "import-export",
                                "tenant-provisioning",
                                "default"
                            };
                        });
                    }

                    // Background Hosted Services
                    services.AddHostedService<WorkerHeartbeatService>();
                });
    }

    public class WorkerHeartbeatService : BackgroundService
    {
        private readonly ILogger<WorkerHeartbeatService> _logger;

        public WorkerHeartbeatService(ILogger<WorkerHeartbeatService> logger)
        {
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("UABIndia ERP Worker Heartbeat active. Processing queued jobs...");

            while (!stoppingToken.IsCancellationRequested)
            {
                await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken);
                _logger.LogInformation("Worker liveness check: operational at {UtcTime}", DateTime.UtcNow);
            }
        }
    }
}
