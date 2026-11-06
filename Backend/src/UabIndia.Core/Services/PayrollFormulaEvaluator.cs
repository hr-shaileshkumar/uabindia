using System;
using System.Collections.Generic;
using System.Globalization;

namespace UabIndia.Core.Services
{
    /// <summary>
    /// Evaluates user-defined salary component formulas (e.g., "BASIC * 0.12", "(BASIC + HRA) * 0.05", "GROSS * 0.02").
    /// Uses a safe, zero-dependency recursive descent mathematical parser.
    /// </summary>
    public static class PayrollFormulaEvaluator
    {
        public static decimal Evaluate(
            string? formula,
            IReadOnlyDictionary<string, decimal> variables)
        {
            if (string.IsNullOrWhiteSpace(formula))
                return 0m;

            try
            {
                var normalizedVars = new Dictionary<string, decimal>(StringComparer.OrdinalIgnoreCase);
                foreach (var kvp in variables)
                {
                    normalizedVars[kvp.Key] = kvp.Value;
                }

                var tokens = Tokenize(formula);
                if (tokens.Count == 0)
                    return 0m;

                var parser = new Parser(tokens, normalizedVars);
                var result = parser.Parse();
                return IndiaStatutoryCalculator.RoundMoney(result);
            }
            catch
            {
                // Safe fallback on malformed user formulas
                return 0m;
            }
        }

        private static List<string> Tokenize(string text)
        {
            var tokens = new List<string>();
            var i = 0;
            while (i < text.Length)
            {
                var c = text[i];
                if (char.IsWhiteSpace(c))
                {
                    i++;
                    continue;
                }

                if (c is '+' or '-' or '*' or '/' or '(' or ')')
                {
                    tokens.Add(c.ToString());
                    i++;
                    continue;
                }

                if (char.IsDigit(c) || c == '.')
                {
                    var start = i;
                    while (i < text.Length && (char.IsDigit(text[i]) || text[i] == '.'))
                    {
                        i++;
                    }
                    tokens.Add(text[start..i]);
                    continue;
                }

                if (char.IsLetter(c) || c == '_')
                {
                    var start = i;
                    while (i < text.Length && (char.IsLetterOrDigit(text[i]) || text[i] == '_'))
                    {
                        i++;
                    }
                    tokens.Add(text[start..i]);
                    continue;
                }

                i++;
            }

            return tokens;
        }

        private class Parser
        {
            private readonly List<string> _tokens;
            private readonly IReadOnlyDictionary<string, decimal> _vars;
            private int _pos;

            public Parser(List<string> tokens, IReadOnlyDictionary<string, decimal> vars)
            {
                _tokens = tokens;
                _vars = vars;
                _pos = 0;
            }

            public decimal Parse()
            {
                var result = ParseExpression();
                return result;
            }

            private decimal ParseExpression()
            {
                var left = ParseTerm();

                while (_pos < _tokens.Count)
                {
                    var op = _tokens[_pos];
                    if (op == "+")
                    {
                        _pos++;
                        left += ParseTerm();
                    }
                    else if (op == "-")
                    {
                        _pos++;
                        left -= ParseTerm();
                    }
                    else
                    {
                        break;
                    }
                }

                return left;
            }

            private decimal ParseTerm()
            {
                var left = ParseFactor();

                while (_pos < _tokens.Count)
                {
                    var op = _tokens[_pos];
                    if (op == "*")
                    {
                        _pos++;
                        left *= ParseFactor();
                    }
                    else if (op == "/")
                    {
                        _pos++;
                        var right = ParseFactor();
                        left = right == 0 ? 0 : left / right;
                    }
                    else
                    {
                        break;
                    }
                }

                return left;
            }

            private decimal ParseFactor()
            {
                if (_pos >= _tokens.Count)
                    return 0m;

                var token = _tokens[_pos++];

                if (token == "+")
                {
                    return ParseFactor();
                }

                if (token == "-")
                {
                    return -ParseFactor();
                }

                if (token == "(")
                {
                    var inner = ParseExpression();
                    if (_pos < _tokens.Count && _tokens[_pos] == ")")
                    {
                        _pos++;
                    }
                    return inner;
                }

                if (decimal.TryParse(token, NumberStyles.Any, CultureInfo.InvariantCulture, out var num))
                {
                    return num;
                }

                if (_vars.TryGetValue(token, out var val))
                {
                    return val;
                }

                return 0m;
            }
        }
    }
}
