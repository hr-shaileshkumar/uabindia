using System;
using System.Collections.Generic;

namespace UabIndia.Api.Exceptions
{
    public sealed class ApiException : Exception
    {
        public ApiException(int statusCode, string message, string code, IDictionary<string, string[]>? errors = null)
            : base(message)
        {
            StatusCode = statusCode;
            Code = code;
            Errors = errors;
        }

        public int StatusCode { get; }

        public string Code { get; }

        public IDictionary<string, string[]>? Errors { get; }
    }
}
