using System;

namespace UabIndia.Billing.Dtos;

/// <summary>
/// Data transfer object representing an invoice.
/// </summary>
public class InvoiceDto
{
    public Guid Id { get; set; }
    public string CustomerId { get; set; } = default!;
    public long AmountCents { get; set; }
    public string Currency { get; set; } = default!;
    public DateTime CreatedAt { get; set; }
    public string Status { get; set; } = default!;
}
