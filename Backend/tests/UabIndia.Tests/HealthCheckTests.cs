using System.Net.Http;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace UabIndia.Tests;

public class HealthCheckTests : IClassFixture<WebApplicationFactory<UabIndia.Api.Program>>
{
    private readonly HttpClient _client;

    public HealthCheckTests(WebApplicationFactory<UabIndia.Api.Program> factory)
    {
        // Use the test server without HTTPS (it will use the default test server settings)
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task HealthEndpoint_ReturnsHealthy()
    {
        var response = await _client.GetAsync("/healthz");
        response.EnsureSuccessStatusCode();
        var body = await response.Content.ReadAsStringAsync();
        Assert.Contains("Healthy", body);
    }
}

