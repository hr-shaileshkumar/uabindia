using System;
using System.Collections.Generic;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UabIndia.Application.Interfaces;

namespace UabIndia.Api.Modules.Platform.Controllers
{
    [ApiController]
    [Route("api/v1/integrations/edi")]
    [Authorize]
    public class EdiController : ControllerBase
    {
        private readonly IEdiParserService _ediParser;

        public EdiController(IEdiParserService ediParser)
        {
            _ediParser = ediParser;
        }

        public class RawEdiPayloadRequest
        {
            public string EdiContent { get; set; } = string.Empty;
        }

        public class GenerateEdi810Request
        {
            public string InvoiceNumber { get; set; } = string.Empty;
            public DateTime InvoiceDate { get; set; } = DateTime.UtcNow;
            public decimal TotalAmount { get; set; }
            public string Currency { get; set; } = "USD";
            public string SenderId { get; set; } = "UABINDIA";
            public string ReceiverId { get; set; } = "PARTNER";
            public List<EdiLineItem> Items { get; set; } = new();
        }

        public class GenerateEdi856Request
        {
            public string ShipmentNumber { get; set; } = string.Empty;
            public DateTime ShipDate { get; set; } = DateTime.UtcNow;
            public string TrackingNumber { get; set; } = string.Empty;
            public string SenderId { get; set; } = "UABINDIA";
            public string ReceiverId { get; set; } = "PARTNER";
            public List<EdiLineItem> Items { get; set; } = new();
        }

        [HttpPost("parse")]
        public IActionResult ParseEdi([FromBody] RawEdiPayloadRequest req)
        {
            if (string.IsNullOrWhiteSpace(req.EdiContent))
            {
                return BadRequest(new { success = false, message = "EDI X12 content is required." });
            }

            var parsed = _ediParser.ParseX12Document(req.EdiContent);
            return Ok(new { success = true, data = parsed });
        }

        [HttpPost("generate-810")]
        public IActionResult Generate810([FromBody] GenerateEdi810Request req)
        {
            if (string.IsNullOrWhiteSpace(req.InvoiceNumber))
            {
                return BadRequest(new { success = false, message = "Invoice Number is required." });
            }

            var x12 = _ediParser.GenerateX12Edi810(
                req.InvoiceNumber,
                req.InvoiceDate,
                req.TotalAmount,
                req.Currency,
                req.Items,
                req.SenderId,
                req.ReceiverId);

            return Ok(new { success = true, x12Content = x12 });
        }

        [HttpPost("generate-856")]
        public IActionResult Generate856([FromBody] GenerateEdi856Request req)
        {
            if (string.IsNullOrWhiteSpace(req.ShipmentNumber))
            {
                return BadRequest(new { success = false, message = "Shipment Number is required." });
            }

            var x12 = _ediParser.GenerateX12Edi856(
                req.ShipmentNumber,
                req.ShipDate,
                req.TrackingNumber,
                req.Items,
                req.SenderId,
                req.ReceiverId);

            return Ok(new { success = true, x12Content = x12 });
        }
    }
}
