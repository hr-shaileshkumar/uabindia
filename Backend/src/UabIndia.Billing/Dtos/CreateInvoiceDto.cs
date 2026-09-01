namespace UabIndia.Billing.Dtos;

/// <summary>
/// Payload for creating a new invoice.
/// </summary>
public class CreateInvoiceDto
{
    public string CustomerId { get; set; } = default!;
    public long AmountCents { get; set; }
    public string? Currency { get; set; }
}
