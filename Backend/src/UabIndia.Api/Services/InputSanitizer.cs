using Ganss.Xss;

namespace UabIndia.Api.Services
{
    /// <summary>
    /// Input sanitization service to prevent XSS attacks
    /// Cleans all user-provided string inputs before processing
    /// </summary>
    public class InputSanitizer
    {
        private readonly HtmlSanitizer _sanitizer;

        public InputSanitizer()
        {
            _sanitizer = new HtmlSanitizer();
            
            // Configure allowed tags and attributes (very restrictive for data fields)
            _sanitizer.AllowedTags.Clear();
            _sanitizer.AllowedAttributes.Clear();
            _sanitizer.AllowedCssProperties.Clear();
            
            // For rich text fields, you can selectively allow safe tags
            // _sanitizer.AllowedTags.Add("b");
            // _sanitizer.AllowedTags.Add("i");
            // _sanitizer.AllowedTags.Add("p");
        }

        /// <summary>
        /// Sanitize a single string input
        /// </summary>
        public string? Sanitize(string? input)
        {
            if (string.IsNullOrWhiteSpace(input))
                return input;
            
            return _sanitizer.Sanitize(input);
        }

        /// <summary>
        /// Sanitize multiple string inputs
        /// </summary>
        public string?[] Sanitize(params string?[] inputs)
        {
            return inputs.Select(i => Sanitize(i)).ToArray();
        }
    }
}
