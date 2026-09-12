using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using UabIndia.Billing.Dtos;
using UabIndia.Billing.Services;

namespace UabIndia.Api.Modules.Administration.Controllers;

/// <summary>
/// Exposes billing‑related endpoints.
/// </summary>
[ApiController]
[Route("api/billing")]
public class BillingController : ControllerBase
{
    private readonly IBillingService _billingService;

    public BillingController(IBillingService billingService)
    {
        _billingService = billingService;
    }

    /// <summary>
    /// Creates a new invoice.
    /// </summary>
    [HttpPost("invoice")]
    public async Task<ActionResult<InvoiceDto>> CreateInvoice([FromBody] CreateInvoiceDto request)
    {
        var invoice = await _billingService.CreateInvoiceAsync(request);
        return CreatedAtAction(nameof(GetInvoice), new { id = invoice.Id }, invoice);
    }

    /// <summary>
    /// Retrieves an invoice (placeholder).
    /// </summary>
    [HttpGet("invoice/{id:guid}")]
    public ActionResult<InvoiceDto> GetInvoice([FromRoute] Guid id)
    {
        return NotFound();
    }

    /// <summary>
    /// Creates a new subscription.
    /// </summary>
    [HttpPost("subscription")]
    public async Task<ActionResult<SubscriptionDto>> CreateSubscription([FromBody] CreateSubscriptionDto request)
    {
        var sub = await _billingService.CreateSubscriptionAsync(request);
        return CreatedAtAction(nameof(GetSubscription), new { id = sub.Id }, sub);
    }

    /// <summary>
    /// Retrieves a subscription (placeholder).
    /// </summary>
    [HttpGet("subscription/{id:guid}")]
    public ActionResult<SubscriptionDto> GetSubscription([FromRoute] Guid id)
    {
        return NotFound();
    }
}
