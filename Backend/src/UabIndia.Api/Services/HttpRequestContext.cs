using Microsoft.AspNetCore.Http;
using UabIndia.Application.Interfaces;

namespace UabIndia.Api.Services
{
    public sealed class HttpRequestContext : IRequestContext
    {
        private readonly IHttpContextAccessor _httpContextAccessor;

        public HttpRequestContext(IHttpContextAccessor httpContextAccessor)
        {
            _httpContextAccessor = httpContextAccessor;
        }

        public bool IsHttpRequest => _httpContextAccessor.HttpContext != null;
    }
}
