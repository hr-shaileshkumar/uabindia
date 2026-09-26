using System;
using System.Collections;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Linq.Expressions;
using System.Reflection;
using System.Text.Json;

namespace UabIndia.Application.Common
{
    public enum FilterCombinator
    {
        And,
        Or
    }

    public class FilterCondition
    {
        public string Field { get; set; } = string.Empty;
        public string Operator { get; set; } = "eq"; // eq, neq, contains, ncontains, starts, ends, gt, gte, lt, lte, empty, nempty, in
        public object? Value { get; set; }
    }

    public class FilterGroup
    {
        public FilterCombinator Combinator { get; set; } = FilterCombinator.And;
        public List<FilterCondition> Conditions { get; set; } = new();
        public List<FilterGroup> Groups { get; set; } = new();
    }

    /// <summary>
    /// Evaluates nested Filter Abstract Syntax Trees (AST) and compiles them into
    /// strongly-typed LINQ Expressions for EF Core queries or in-memory collections.
    /// Supports compound (A AND B) OR (C AND D) expressions, type coercion, null-checks,
    /// case-insensitivity, and nested relation/property navigation.
    /// </summary>
    public static class FilterAstEvaluator
    {
        public static FilterGroup? ParseFromJson(string? json)
        {
            if (string.IsNullOrWhiteSpace(json)) return null;

            try
            {
                using var doc = JsonDocument.Parse(json);
                return ParseGroup(doc.RootElement);
            }
            catch
            {
                return null;
            }
        }

        private static FilterGroup? ParseGroup(JsonElement element)
        {
            if (element.ValueKind != JsonValueKind.Object) return null;

            var group = new FilterGroup();

            if (element.TryGetProperty("combinator", out var combProp))
            {
                var combStr = combProp.GetString()?.Trim().ToUpperInvariant();
                group.Combinator = combStr == "OR" ? FilterCombinator.Or : FilterCombinator.And;
            }

            // Check if there is a "rules" array (standard AST format)
            if (element.TryGetProperty("rules", out var rulesProp) && rulesProp.ValueKind == JsonValueKind.Array)
            {
                foreach (var item in rulesProp.EnumerateArray())
                {
                    if (item.TryGetProperty("rules", out _) || item.TryGetProperty("combinator", out _))
                    {
                        var nested = ParseGroup(item);
                        if (nested != null && (nested.Conditions.Count > 0 || nested.Groups.Count > 0))
                        {
                            group.Groups.Add(nested);
                        }
                    }
                    else
                    {
                        var condition = ParseCondition(item);
                        if (condition != null)
                        {
                            group.Conditions.Add(condition);
                        }
                    }
                }
            }

            // Also check for separate "conditions" and "groups"
            if (element.TryGetProperty("conditions", out var condProp) && condProp.ValueKind == JsonValueKind.Array)
            {
                foreach (var item in condProp.EnumerateArray())
                {
                    var condition = ParseCondition(item);
                    if (condition != null) group.Conditions.Add(condition);
                }
            }

            if (element.TryGetProperty("groups", out var groupsProp) && groupsProp.ValueKind == JsonValueKind.Array)
            {
                foreach (var item in groupsProp.EnumerateArray())
                {
                    var nested = ParseGroup(item);
                    if (nested != null) group.Groups.Add(nested);
                }
            }

            return group;
        }

        private static FilterCondition? ParseCondition(JsonElement element)
        {
            if (element.ValueKind != JsonValueKind.Object) return null;

            string? field = null;
            if (element.TryGetProperty("field", out var f)) field = f.GetString();
            else if (element.TryGetProperty("columnKey", out var c)) field = c.GetString();
            else if (element.TryGetProperty("key", out var k)) field = k.GetString();

            if (string.IsNullOrWhiteSpace(field)) return null;

            var op = "eq";
            if (element.TryGetProperty("operator", out var o)) op = o.GetString() ?? "eq";

            object? val = null;
            if (element.TryGetProperty("value", out var v))
            {
                val = v.ValueKind switch
                {
                    JsonValueKind.String => v.GetString(),
                    JsonValueKind.Number => v.TryGetInt64(out var l) ? l : v.GetDouble(),
                    JsonValueKind.True => true,
                    JsonValueKind.False => false,
                    JsonValueKind.Array => v.EnumerateArray().Select(x => x.ToString()).ToList(),
                    JsonValueKind.Null => null,
                    _ => v.ToString()
                };
            }

            return new FilterCondition
            {
                Field = field.Trim(),
                Operator = op.Trim().ToLowerInvariant(),
                Value = val
            };
        }

        public static IQueryable<T> ApplyFilterAst<T>(this IQueryable<T> query, FilterGroup? group)
        {
            if (group == null || (group.Conditions.Count == 0 && group.Groups.Count == 0))
                return query;

            var predicate = BuildPredicate<T>(group);
            return predicate != null ? query.Where(predicate) : query;
        }

        public static Expression<Func<T, bool>>? BuildPredicate<T>(FilterGroup group)
        {
            var parameter = Expression.Parameter(typeof(T), "x");
            var body = BuildGroupExpression(parameter, group);
            return body != null ? Expression.Lambda<Func<T, bool>>(body, parameter) : null;
        }

        private static Expression? BuildGroupExpression(ParameterExpression parameter, FilterGroup group)
        {
            var expressions = new List<Expression>();

            foreach (var condition in group.Conditions)
            {
                var condExpr = BuildConditionExpression(parameter, condition);
                if (condExpr != null) expressions.Add(condExpr);
            }

            foreach (var nestedGroup in group.Groups)
            {
                var nestedExpr = BuildGroupExpression(parameter, nestedGroup);
                if (nestedExpr != null) expressions.Add(nestedExpr);
            }

            if (expressions.Count == 0) return null;

            return group.Combinator == FilterCombinator.Or
                ? expressions.Aggregate(Expression.OrElse)
                : expressions.Aggregate(Expression.AndAlso);
        }

        private static Expression? BuildConditionExpression(ParameterExpression parameter, FilterCondition condition)
        {
            if (string.IsNullOrWhiteSpace(condition.Field)) return null;

            var propertyExpr = GetPropertyExpression(parameter, condition.Field);
            if (propertyExpr == null) return null;

            var targetType = propertyExpr.Type;
            var op = NormalizeOperator(condition.Operator);

            // 1. Empty / Non-Empty Checks
            if (op == "empty")
            {
                if (targetType == typeof(string))
                {
                    var isNull = Expression.Equal(propertyExpr, Expression.Constant(null, typeof(string)));
                    var isEmpty = Expression.Equal(propertyExpr, Expression.Constant(string.Empty, typeof(string)));
                    return Expression.OrElse(isNull, isEmpty);
                }
                if (Nullable.GetUnderlyingType(targetType) != null)
                {
                    return Expression.Equal(propertyExpr, Expression.Constant(null, targetType));
                }
                return Expression.Constant(false);
            }

            if (op == "nempty")
            {
                if (targetType == typeof(string))
                {
                    var isNotNull = Expression.NotEqual(propertyExpr, Expression.Constant(null, typeof(string)));
                    var isNotEmpty = Expression.NotEqual(propertyExpr, Expression.Constant(string.Empty, typeof(string)));
                    return Expression.AndAlso(isNotNull, isNotEmpty);
                }
                if (Nullable.GetUnderlyingType(targetType) != null)
                {
                    return Expression.NotEqual(propertyExpr, Expression.Constant(null, targetType));
                }
                return Expression.Constant(true);
            }

            // 2. Coerce constant value to target property type
            var constantValue = CoerceValue(condition.Value, targetType);

            // String operations (case-insensitive)
            if (targetType == typeof(string))
            {
                var strVal = constantValue?.ToString() ?? string.Empty;
                var notNullProp = Expression.Coalesce(propertyExpr, Expression.Constant(string.Empty));
                var toLowerMethod = typeof(string).GetMethod("ToLower", Type.EmptyTypes)!;
                var propLower = Expression.Call(notNullProp, toLowerMethod);
                var constLower = Expression.Constant(strVal.ToLowerInvariant(), typeof(string));

                switch (op)
                {
                    case "eq":
                        return Expression.Equal(propLower, constLower);
                    case "neq":
                        return Expression.NotEqual(propLower, constLower);
                    case "contains":
                    case "like":
                        var containsMethod = typeof(string).GetMethod("Contains", new[] { typeof(string) })!;
                        return Expression.Call(propLower, containsMethod, constLower);
                    case "ncontains":
                    case "nlike":
                        var containsM = typeof(string).GetMethod("Contains", new[] { typeof(string) })!;
                        return Expression.Not(Expression.Call(propLower, containsM, constLower));
                    case "starts":
                        var startsMethod = typeof(string).GetMethod("StartsWith", new[] { typeof(string) })!;
                        return Expression.Call(propLower, startsMethod, constLower);
                    case "ends":
                        var endsMethod = typeof(string).GetMethod("EndsWith", new[] { typeof(string) })!;
                        return Expression.Call(propLower, endsMethod, constLower);
                }
            }

            // Value / Numeric / Boolean / Date / Enum comparison
            var constExpr = Expression.Constant(constantValue, targetType);

            switch (op)
            {
                case "eq":
                    return Expression.Equal(propertyExpr, constExpr);
                case "neq":
                    return Expression.NotEqual(propertyExpr, constExpr);
                case "gt":
                    return Expression.GreaterThan(propertyExpr, constExpr);
                case "gte":
                    return Expression.GreaterThanOrEqual(propertyExpr, constExpr);
                case "lt":
                    return Expression.LessThan(propertyExpr, constExpr);
                case "lte":
                    return Expression.LessThanOrEqual(propertyExpr, constExpr);
                case "in":
                    if (condition.Value is IEnumerable list && !(condition.Value is string))
                    {
                        var containsObjMethod = typeof(Enumerable).GetMethods()
                            .First(m => m.Name == "Contains" && m.GetParameters().Length == 2)
                            .MakeGenericMethod(targetType);
                        var castedList = CreateTypedList(list, targetType);
                        return Expression.Call(null, containsObjMethod, Expression.Constant(castedList), propertyExpr);
                    }
                    return Expression.Equal(propertyExpr, constExpr);
                default:
                    return Expression.Equal(propertyExpr, constExpr);
            }
        }

        private static string NormalizeOperator(string op)
        {
            var clean = op.Trim().ToLowerInvariant();
            return clean switch
            {
                "equals" or "==" => "eq",
                "notequals" or "!=" => "neq",
                "greater_than" or ">" => "gt",
                "greater_than_or_equal" or ">=" => "gte",
                "less_than" or "<" => "lt",
                "less_than_or_equal" or "<=" => "lte",
                "starts_with" => "starts",
                "ends_with" => "ends",
                "is_empty" => "empty",
                "is_not_empty" => "nempty",
                _ => clean
            };
        }

        private static Expression? GetPropertyExpression(ParameterExpression parameter, string propertyPath)
        {
            Expression current = parameter;
            var parts = propertyPath.Split('.', StringSplitOptions.RemoveEmptyEntries);

            foreach (var part in parts)
            {
                var prop = current.Type.GetProperty(part, BindingFlags.IgnoreCase | BindingFlags.Public | BindingFlags.Instance);
                if (prop == null) return null;
                current = Expression.Property(current, prop);
            }

            return current;
        }

        private static object? CoerceValue(object? rawValue, Type targetType)
        {
            if (rawValue == null) return null;

            var nonNullableType = Nullable.GetUnderlyingType(targetType) ?? targetType;

            if (nonNullableType == typeof(string))
                return rawValue.ToString();

            if (nonNullableType == typeof(Guid))
            {
                if (rawValue is Guid g) return g;
                return Guid.TryParse(rawValue.ToString(), out var parsed) ? parsed : Guid.Empty;
            }

            if (nonNullableType == typeof(DateTime))
            {
                if (rawValue is DateTime dt) return dt;
                return DateTime.TryParse(rawValue.ToString(), CultureInfo.InvariantCulture, DateTimeStyles.AdjustToUniversal, out var parsed)
                    ? parsed
                    : DateTime.MinValue;
            }

            if (nonNullableType == typeof(bool))
            {
                if (rawValue is bool b) return b;
                var str = rawValue.ToString()?.Trim().ToLowerInvariant();
                return str == "true" || str == "1" || str == "yes";
            }

            if (nonNullableType.IsEnum)
            {
                if (Enum.TryParse(nonNullableType, rawValue.ToString(), true, out var parsedEnum))
                    return parsedEnum;
                return Activator.CreateInstance(nonNullableType);
            }

            if (nonNullableType == typeof(int))
                return Convert.ToInt32(rawValue, CultureInfo.InvariantCulture);

            if (nonNullableType == typeof(long))
                return Convert.ToInt64(rawValue, CultureInfo.InvariantCulture);

            if (nonNullableType == typeof(decimal))
                return Convert.ToDecimal(rawValue, CultureInfo.InvariantCulture);

            if (nonNullableType == typeof(double))
                return Convert.ToDouble(rawValue, CultureInfo.InvariantCulture);

            return Convert.ChangeType(rawValue, nonNullableType, CultureInfo.InvariantCulture);
        }

        private static IList CreateTypedList(IEnumerable source, Type itemType)
        {
            var listType = typeof(List<>).MakeGenericType(itemType);
            var list = (IList)Activator.CreateInstance(listType)!;

            foreach (var item in source)
            {
                list.Add(CoerceValue(item, itemType));
            }

            return list;
        }
    }
}
