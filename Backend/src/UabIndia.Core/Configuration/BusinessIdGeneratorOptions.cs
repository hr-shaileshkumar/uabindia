using System;
using System.Collections.Generic;

namespace UabIndia.Core.Configuration
{
    public class BusinessIdGeneratorOptions
    {
        public int DefaultPadding { get; set; } = 6;
        public string DefaultPrefix { get; set; } = "REC";
        public Dictionary<string, BusinessIdFormat> Formats { get; set; } = new(StringComparer.OrdinalIgnoreCase);
    }

    public class BusinessIdFormat
    {
        public string Prefix { get; set; } = string.Empty;
        public int Padding { get; set; } = 6;
    }
}
