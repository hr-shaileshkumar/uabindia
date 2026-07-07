using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using UabIndia.Api.Models;

namespace UabIndia.Api.Modules.Platform.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    [Authorize]
    [Authorize(Policy = "Module:licensing")]
    public class IntegrationsController : ControllerBase
    {
        [HttpGet("api-keys")]
        public IActionResult ApiKeys()
        {
            // Placeholder until API key entity is implemented
            var data = new List<ApiKeyDto>();
            return Ok(new { apiKeys = data });
        }

        [HttpGet]
        public IActionResult List()
        {
            // Placeholder until integration entities are implemented
            var data = new List<IntegrationDto>();
            return Ok(new { integrations = data });
        }
    }
}
