using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;
using UabIndia.Infrastructure.Services;
using UabIndia.Infrastructure.Services.Payments;
using UabIndia.Tests.TestUtilities;
using Xunit;

namespace UabIndia.Tests;

public class PaymentGatewayTests : IDisposable
{
    private readonly ApplicationDbContext _db;
    private readonly PaymentGatewayFactory _factory;
    private readonly SubscriptionBillingService _billingService;
    private readonly Guid _tenantId = Guid.NewGuid();

    public PaymentGatewayTests()
    {
        var inMemorySettings = new Dictionary<string, string?>
        {
            { "Encryption:Key", "payment-tests-key-32-chars-min-ok!!" },
            { "Payments:Stripe:ApiKey", "sk_test_12345" },
            { "Payments:Stripe:WebhookSecret", "whsec_12345" }
        };

        IConfiguration configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(inMemorySettings)
            .Build();

        var encryption = new AesEncryptionService(configuration);
        var tenantAccessor = new TestTenantAccessor();
        tenantAccessor.SetTenantId(_tenantId);

        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        _db = new ApplicationDbContext(options, tenantAccessor, encryption);
        _factory = new PaymentGatewayFactory(configuration);
        _billingService = new SubscriptionBillingService(_db);
    }

    [Fact]
    public void PaymentGatewayFactory_ReturnsSupportedGateways()
    {
        var supported = _factory.GetSupportedProviders();

        Assert.Contains("Stripe", supported);
        Assert.Contains("Razorpay", supported);
        Assert.Contains("PayPal", supported);
    }

    [Fact]
    public void PaymentGatewayFactory_SelectsRazorpayForInr()
    {
        var provider = _factory.GetProviderForCurrency("INR");
        Assert.Equal("Razorpay", provider.ProviderName);
    }

    [Fact]
    public void PaymentGatewayFactory_SelectsStripeForUsd()
    {
        var provider = _factory.GetProviderForCurrency("USD");
        Assert.Equal("Stripe", provider.ProviderName);
    }

    [Fact]
    public async Task StripePaymentProvider_CreatesPaymentIntentAndCapture()
    {
        var stripe = _factory.GetProvider("Stripe");
        var req = new PaymentIntentRequest
        {
            Amount = 150.00m,
            Currency = "USD",
            CustomerEmail = "customer@globalcorp.com"
        };

        var intent = await stripe.CreatePaymentIntentAsync(req);
        Assert.True(intent.Success);
        Assert.StartsWith("pi_stripe_", intent.PaymentIntentId);

        var capture = await stripe.CapturePaymentAsync(intent.PaymentIntentId, 150.00m, "USD");
        Assert.True(capture.Success);
        Assert.Equal("Succeeded", capture.Status);
    }

    [Fact]
    public async Task RazorpayPaymentProvider_CreatesOrderAndRefund()
    {
        var razorpay = _factory.GetProvider("Razorpay");
        var req = new PaymentIntentRequest
        {
            Amount = 5000m,
            Currency = "INR"
        };

        var intent = await razorpay.CreatePaymentIntentAsync(req);
        Assert.True(intent.Success);
        Assert.StartsWith("order_rzp_", intent.PaymentIntentId);

        var refund = await razorpay.RefundPaymentAsync(intent.PaymentIntentId, 5000m, "Customer cancelled");
        Assert.True(refund.Success);
        Assert.Equal("Processed", refund.Status);
    }

    [Fact]
    public async Task StripeWebhook_ValidatesAndParsesPayload()
    {
        var stripe = _factory.GetProvider("Stripe");
        var payload = "{\"id\":\"evt_test_123\",\"type\":\"payment_intent.succeeded\"}";

        var result = await stripe.VerifyAndParseWebhookAsync(payload, "t=12345,v1=sig", "whsec_mock");

        Assert.True(result.IsValid);
        Assert.Equal("evt_test_123", result.EventId);
        Assert.Equal("payment_intent.succeeded", result.EventType);
    }

    [Fact]
    public async Task SubscriptionBillingService_GeneratesMonthlyInvoicesForActiveCustomers()
    {
        var customer1 = new Customer
        {
            TenantId = _tenantId,
            CustomerName = "Enterprise Client A",
            CustomerCode = "CUST-001",
            CreditLimit = 400m,
            Status = "Active"
        };
        var customer2 = new Customer
        {
            TenantId = _tenantId,
            CustomerName = "Enterprise Client B",
            CustomerCode = "CUST-002",
            CreditLimit = 250m,
            Status = "Active"
        };

        _db.Customers.AddRange(customer1, customer2);
        await _db.SaveChangesAsync();

        var billingResult = await _billingService.ProcessRecurringBillingCycleAsync(_tenantId, DateTime.UtcNow);

        Assert.Equal(2, billingResult.TotalSubscriptionsEvaluated);
        Assert.Equal(2, billingResult.InvoicesGeneratedCount);
        Assert.Equal(650m, billingResult.TotalAmountBilled);
    }

    public void Dispose() => _db.Dispose();
}
