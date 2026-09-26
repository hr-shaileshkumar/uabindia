using System.Collections.Generic;
using UabIndia.Core.Metadata;

namespace UabIndia.Application.Interfaces
{
    public class RuleEvaluationResult
    {
        public bool IsConditionMet { get; set; }
        public string ActionType { get; set; } = string.Empty;
        public string TargetField { get; set; } = string.Empty;
        public object? ActionValue { get; set; }
    }

    public interface IBusinessRuleEvaluator
    {
        bool EvaluateCondition(string conditionExpression, IReadOnlyDictionary<string, object?> fieldValues);

        IReadOnlyList<RuleEvaluationResult> EvaluateRules(
            IEnumerable<RuleDefinition> rules,
            IReadOnlyDictionary<string, object?> fieldValues);
    }
}
