using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Diagnostics.Metrics;
using System.Threading;

namespace UabIndia.Core.Services
{
    public class PlatformMetrics : IPlatformMetrics, IDisposable
    {
        private readonly Meter _meter;
        private readonly Counter<long> _requestCounter;
        private readonly Counter<long> _authCounter;
        private readonly Counter<long> _statutoryCounter;
        private readonly Histogram<double> _latencyHistogram;

        private long _totalRequests;
        private long _successfulRequests;
        private long _failedRequests;
        private double _totalDurationMs;
        private readonly DateTime _startedUtc = DateTime.UtcNow;

        private readonly ConcurrentDictionary<string, long> _tenantRequests = new(StringComparer.OrdinalIgnoreCase);
        private readonly ConcurrentDictionary<string, long> _authEvents = new(StringComparer.OrdinalIgnoreCase);
        private readonly ConcurrentDictionary<string, long> _statutoryCalculations = new(StringComparer.OrdinalIgnoreCase);

        public PlatformMetrics()
        {
            _meter = new Meter("UabIndia.Platform", "1.0.0");
            _requestCounter = _meter.CreateCounter<long>("uabindia_requests_total", "requests", "Total incoming HTTP requests");
            _authCounter = _meter.CreateCounter<long>("uabindia_auth_events_total", "events", "Total authentication & security events");
            _statutoryCounter = _meter.CreateCounter<long>("uabindia_statutory_calculations_total", "calculations", "Total statutory compliance calculations");
            _latencyHistogram = _meter.CreateHistogram<double>("uabindia_request_duration_ms", "ms", "HTTP request processing latency in milliseconds");
        }

        public void RecordTenantRequest(string tenantId, string method, string route, int statusCode, double durationMs)
        {
            Interlocked.Increment(ref _totalRequests);

            if (statusCode < 400)
            {
                Interlocked.Increment(ref _successfulRequests);
            }
            else
            {
                Interlocked.Increment(ref _failedRequests);
            }

            // Lock-free duration addition
            lock (_tenantRequests)
            {
                _totalDurationMs += durationMs;
            }

            var safeTenant = string.IsNullOrWhiteSpace(tenantId) ? "global" : tenantId.Trim();
            _tenantRequests.AddOrUpdate(safeTenant, 1, (_, current) => current + 1);

            _requestCounter.Add(1,
                new KeyValuePair<string, object?>("tenant_id", safeTenant),
                new KeyValuePair<string, object?>("method", method),
                new KeyValuePair<string, object?>("route", route),
                new KeyValuePair<string, object?>("status_code", statusCode));

            _latencyHistogram.Record(durationMs,
                new KeyValuePair<string, object?>("tenant_id", safeTenant),
                new KeyValuePair<string, object?>("status_code", statusCode));
        }

        public void RecordAuthEvent(string eventType, string tenantId)
        {
            var safeType = string.IsNullOrWhiteSpace(eventType) ? "unknown" : eventType.Trim();
            var safeTenant = string.IsNullOrWhiteSpace(tenantId) ? "global" : tenantId.Trim();

            _authEvents.AddOrUpdate(safeType, 1, (_, current) => current + 1);

            _authCounter.Add(1,
                new KeyValuePair<string, object?>("event_type", safeType),
                new KeyValuePair<string, object?>("tenant_id", safeTenant));
        }

        public void RecordStatutoryCalculation(string calculationType, decimal amount)
        {
            var safeType = string.IsNullOrWhiteSpace(calculationType) ? "general" : calculationType.Trim();
            _statutoryCalculations.AddOrUpdate(safeType, 1, (_, current) => current + 1);

            _statutoryCounter.Add(1,
                new KeyValuePair<string, object?>("calculation_type", safeType));
        }

        public PlatformMetricsSummary GetSummary()
        {
            var total = Interlocked.Read(ref _totalRequests);
            double avgLatency = 0;
            lock (_tenantRequests)
            {
                avgLatency = total > 0 ? Math.Round(_totalDurationMs / total, 2) : 0;
            }

            return new PlatformMetricsSummary
            {
                TotalRequests = total,
                SuccessfulRequests = Interlocked.Read(ref _successfulRequests),
                FailedRequests = Interlocked.Read(ref _failedRequests),
                AverageLatencyMs = avgLatency,
                RequestsByTenant = new Dictionary<string, long>(_tenantRequests),
                AuthEvents = new Dictionary<string, long>(_authEvents),
                StatutoryCalculations = new Dictionary<string, long>(_statutoryCalculations),
                UptimeStartedUtc = _startedUtc
            };
        }

        public void Dispose()
        {
            _meter.Dispose();
        }
    }
}
