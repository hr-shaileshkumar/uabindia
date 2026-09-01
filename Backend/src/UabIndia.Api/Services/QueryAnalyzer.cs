using System.Collections.Generic;
using System.Data.Common;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Logging;

namespace UabIndia.Api.Services
{
    public class QueryAnalyzer : DbCommandInterceptor, IQueryAnalyzer
    {
        private readonly ILogger<QueryAnalyzer> _logger;
        private readonly Dictionary<string, int> _queryCounts = new();

        public QueryAnalyzer(ILogger<QueryAnalyzer> logger)
        {
            _logger = logger;
        }

        public void Record(string commandText)
        {
            if (string.IsNullOrWhiteSpace(commandText))
                return;

            if (_queryCounts.ContainsKey(commandText))
                _queryCounts[commandText]++;
            else
                _queryCounts[commandText] = 1;

            if (_queryCounts[commandText] > 5)
            {
                _logger.LogWarning("Potential N+1 query detected: same command executed {Count} times. Command: {Command}", _queryCounts[commandText], commandText);
            }
        }

        public override InterceptionResult<int> NonQueryExecuting(DbCommand command, CommandEventData eventData, InterceptionResult<int> result)
        {
            Record(command.CommandText);
            return base.NonQueryExecuting(command, eventData, result);
        }

        public override InterceptionResult<DbDataReader> ReaderExecuting(DbCommand command, CommandEventData eventData, InterceptionResult<DbDataReader> result)
        {
            Record(command.CommandText);
            return base.ReaderExecuting(command, eventData, result);
        }

        public override InterceptionResult<object> ScalarExecuting(DbCommand command, CommandEventData eventData, InterceptionResult<object> result)
        {
            Record(command.CommandText);
            return base.ScalarExecuting(command, eventData, result);
        }
    }
}
