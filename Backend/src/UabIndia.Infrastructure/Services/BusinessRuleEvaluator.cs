using System;
using System.Collections.Generic;
using System.Globalization;
using System.Text.RegularExpressions;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Metadata;

namespace UabIndia.Infrastructure.Services
{
    public class BusinessRuleEvaluator : IBusinessRuleEvaluator
    {
        // Safe regex pattern: "fieldName == 'value'" or "amount > 5000"
        private static readonly Regex BinaryConditionRegex = new(
            @"^\s*([\w\.\-]+)\s*(==|!=|>=|<=|>|<|contains|in)\s*(.+?)\s*$",
            RegexOptions.Compiled | RegexOptions.IgnoreCase);

        public bool EvaluateCondition(string conditionExpression, IReadOnlyDictionary<string, object?> fieldValues)
        {
            if (string.IsNullOrWhiteSpace(conditionExpression))
            {
                return true;
            }

            var match = BinaryConditionRegex.Match(conditionExpression.Trim());
            if (!match.Success)
            {
                // Fallback: evaluate boolean flag in dictionary if condition is just a field name
                var trimmed = conditionExpression.Trim();
                if (fieldValues.TryGetValue(trimmed, out var val) && val is bool b)
                {
                    return b;
                }
                return false;
            }

            var fieldName = match.Groups[1].Value;
            var op = match.Groups[2].Value.ToLowerInvariant();
            var rawExpected = match.Groups[3].Value.Trim('\'', '"', ' ');

            if (!fieldValues.TryGetValue(fieldName, out var actualVal) || actualVal == null)
            {
                return op switch
                {
                    "==" => rawExpected.Equals("null", StringComparison.OrdinalIgnoreCase) || string.IsNullOrEmpty(rawExpected),
                    "!=" => !rawExpected.Equals("null", StringComparison.OrdinalIgnoreCase) && !string.IsNullOrEmpty(rawExpected),
                    _ => false
                };
            }

            var actualStr = actualVal.ToString() ?? string.Empty;

            // Numeric comparison
            if (double.TryParse(actualStr, NumberStyles.Any, CultureInfo.InvariantCulture, out var actualNum) &&
                double.TryParse(rawExpected, NumberStyles.Any, CultureInfo.InvariantCulture, out var expectedNum))
            {
                return op switch
                {
                    "==" => Math.Abs(actualNum - expectedNum) < 0.0001,
                    "!=" => Math.Abs(actualNum - expectedNum) >= 0.0001,
                    ">" => actualNum > expectedNum,
                    ">=" => actualNum >= expectedNum,
                    "<" => actualNum < expectedNum,
                    "<=" => actualNum <= expectedNum,
                    _ => false
                };
            }

            // String comparison
            return op switch
            {
                "==" => string.Equals(actualStr, rawExpected, StringComparison.OrdinalIgnoreCase),
                "!=" => !string.Equals(actualStr, rawExpected, StringComparison.OrdinalIgnoreCase),
                "contains" => actualStr.Contains(rawExpected, StringComparison.OrdinalIgnoreCase),
                _ => false
            };
        }

        public IReadOnlyList<RuleEvaluationResult> EvaluateRules(
            IEnumerable<RuleDefinition> rules,
            IReadOnlyDictionary<string, object?> fieldValues)
        {
            var results = new List<RuleEvaluationResult>();

            foreach (var rule in rules)
            {
                var isMet = EvaluateCondition(rule.Condition, fieldValues);
                results.Add(new RuleEvaluationResult
                {
                    IsConditionMet = isMet,
                    ActionType = rule.ActionType,
                    TargetField = rule.TargetField,
                    ActionValue = isMet ? rule.ActionValue : null
                });
            }

            return results;
        }
    }
}
