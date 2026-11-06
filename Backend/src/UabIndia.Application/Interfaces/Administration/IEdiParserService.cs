using System;
using System.Collections.Generic;

namespace UabIndia.Application.Interfaces
{
    public class EdiLineItem
    {
        public int LineNumber { get; set; }
        public string ItemCode { get; set; } = string.Empty;
        public decimal Quantity { get; set; }
        public string UnitOfMeasure { get; set; } = "EA";
        public decimal UnitPrice { get; set; }
        public string Description { get; set; } = string.Empty;
    }

    public class ParsedEdiDocument
    {
        public string DocumentType { get; set; } = "EDI850"; // EDI850, EDI810, EDI856
        public string SenderId { get; set; } = string.Empty;
        public string ReceiverId { get; set; } = string.Empty;
        public string ControlNumber { get; set; } = string.Empty;
        public string DocumentNumber { get; set; } = string.Empty;
        public DateTime DocumentDate { get; set; } = DateTime.UtcNow;
        public decimal TotalAmount { get; set; }
        public string Currency { get; set; } = "USD";
        public string? BuyerName { get; set; }
        public string? ShipToAddress { get; set; }
        public List<EdiLineItem> Items { get; set; } = new();
    }

    public interface IEdiParserService
    {
        ParsedEdiDocument ParseX12Document(string x12Content);
        string GenerateX12Edi810(string invoiceNumber, DateTime invoiceDate, decimal totalAmount, string currency, List<EdiLineItem> items, string senderId = "UABINDIA", string receiverId = "PARTNER");
        string GenerateX12Edi856(string shipmentNumber, DateTime shipDate, string trackingNumber, List<EdiLineItem> items, string senderId = "UABINDIA", string receiverId = "PARTNER");
    }
}
