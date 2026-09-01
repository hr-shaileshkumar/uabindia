using System;
using System.Collections.Generic;

namespace UabIndia.Core.Services
{
    public interface IPlatformMetrics
    {
        void RecordTenantRequest(string tenantId, string method, string route, int statusCode, double durationMs);
        void RecordAuthEvent(string eventType, string tenantId);
        void RecordStatutoryCalculation(string calculationType, decimal amount);
        PlatformMetricsSummary GetSummary();
    }

    public class PlatformMetricsSummary
    {
        public long TotalRequests { get; set; }
        public long SuccessfulRequests { get; set; }
        public long FailedRequests { get; set; }
        public double AverageLatencyMs { get; set; }
        public Dictionary<string, long> RequestsByTenant { get; set; } = new();
        public Dictionary<string, long> AuthEvents { get; set; } = new();
        public Dictionary<string, long> StatutoryCalculations { get; set; } = new();
        public DateTime UptimeStartedUtc { get; set; }
    }
}
