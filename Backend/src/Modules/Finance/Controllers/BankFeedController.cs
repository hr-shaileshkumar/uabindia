using System;
using System.IO;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using UabIndia.Application.Interfaces;

namespace UabIndia.Api.Modules.Finance.Controllers
{
    [ApiController]
    [Route("api/v1/finance/bank-feed")]
    [Authorize]
    public class BankFeedController : ControllerBase
    {
        private readonly IBankFeedParserService _parserService;

        public BankFeedController(IBankFeedParserService parserService)
        {
            _parserService = parserService;
        }

        public class RawPayloadApiRequest
        {
            public string FileContent { get; set; } = string.Empty;
            public string Currency { get; set; } = "USD";
        }

        [HttpPost("parse-ofx")]
        public IActionResult ParseOfx([FromBody] RawPayloadApiRequest req)
        {
            if (string.IsNullOrWhiteSpace(req.FileContent))
                return BadRequest(new { success = false, message = "File content is required." });

            var result = _parserService.ParseOfxStatement(req.FileContent);
            return Ok(new { success = true, data = result });
        }

        [HttpPost("parse-mt940")]
        public IActionResult ParseMt940([FromBody] RawPayloadApiRequest req)
        {
            if (string.IsNullOrWhiteSpace(req.FileContent))
                return BadRequest(new { success = false, message = "File content is required." });

            var result = _parserService.ParseMt940Statement(req.FileContent);
            return Ok(new { success = true, data = result });
        }

        [HttpPost("parse-csv")]
        public IActionResult ParseCsv([FromBody] RawPayloadApiRequest req)
        {
            if (string.IsNullOrWhiteSpace(req.FileContent))
                return BadRequest(new { success = false, message = "File content is required." });

            var result = _parserService.ParseCsvStatement(req.FileContent, req.Currency);
            return Ok(new { success = true, data = result });
        }
    }
}
