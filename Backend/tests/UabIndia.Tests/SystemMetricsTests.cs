using System;
using UabIndia.Core.Services;
using Xunit;

namespace UabIndia.Tests
{
    public class SystemMetricsTests
    {
        [Fact]
        public void PlatformMetrics_RecordsRequestsAndAttributionCorrectly()
        {
            using var metrics = new PlatformMetrics();

            metrics.RecordTenantRequest("tenant-alpha", "GET", "/api/v1/employees", 200, 15.5);
            metrics.RecordTenantRequest("tenant-alpha", "POST", "/api/v1/employees", 201, 24.2);
            metrics.RecordTenantRequest("tenant-beta", "GET", "/api/v1/invoices", 500, 45.0);
            metrics.RecordTenantRequest(null!, "GET", "/api/v1/public/status", 200, 5.0);

            var summary = metrics.GetSummary();

            Assert.Equal(4, summary.TotalRequests);
            Assert.Equal(3, summary.SuccessfulRequests);
            Assert.Equal(1, summary.FailedRequests);
            Assert.True(summary.AverageLatencyMs > 0);

            Assert.Equal(2, summary.RequestsByTenant["tenant-alpha"]);
            Assert.Equal(1, summary.RequestsByTenant["tenant-beta"]);
            Assert.Equal(1, summary.RequestsByTenant["global"]);
        }

        [Fact]
        public void PlatformMetrics_RecordsAuthEventsCorrectly()
        {
            using var metrics = new PlatformMetrics();

            metrics.RecordAuthEvent("login_success", "tenant-alpha");
            metrics.RecordAuthEvent("login_success", "tenant-alpha");
            metrics.RecordAuthEvent("token_reuse_detected", "tenant-beta");

            var summary = metrics.GetSummary();

            Assert.Equal(2, summary.AuthEvents["login_success"]);
            Assert.Equal(1, summary.AuthEvents["token_reuse_detected"]);
        }

        [Fact]
        public void PlatformMetrics_RecordsStatutoryCalculationsCorrectly()
        {
            using var metrics = new PlatformMetrics();

            metrics.RecordStatutoryCalculation("tds_194c", 50000m);
            metrics.RecordStatutoryCalculation("tds_194j", 120000m);
            metrics.RecordStatutoryCalculation("gst_rcm", 18000m);

            var summary = metrics.GetSummary();

            Assert.Equal(1, summary.StatutoryCalculations["tds_194c"]);
            Assert.Equal(1, summary.StatutoryCalculations["tds_194j"]);
            Assert.Equal(1, summary.StatutoryCalculations["gst_rcm"]);
        }
    }
}
