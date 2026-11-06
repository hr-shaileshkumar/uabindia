using System.Linq;
using UabIndia.Core.Entities;

namespace UabIndia.Core.Security
{
    public static class PasswordComplexity
    {
        public static string? Validate(string password, SecurityPolicy? policy)
        {
            var minLength = policy?.MinLength > 0 ? policy.MinLength : 8;
            if (string.IsNullOrEmpty(password) || password.Length < minLength)
                return $"Password must be at least {minLength} characters.";

            if (policy == null) return null;

            if (policy.RequireUppercase && !password.Any(char.IsUpper))
                return "Password must include at least one uppercase letter.";
            if (policy.RequireLowercase && !password.Any(char.IsLower))
                return "Password must include at least one lowercase letter.";
            if (policy.RequireNumber && !password.Any(char.IsDigit))
                return "Password must include at least one number.";
            if (policy.RequireSpecial && password.All(char.IsLetterOrDigit))
                return "Password must include at least one special character.";

            return null;
        }
    }
}
