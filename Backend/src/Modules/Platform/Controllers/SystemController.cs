using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;

namespace UabIndia.Api.Modules.Platform.Controllers
{
    [ApiController]
    [Route("api/v1/system")]
    [Authorize]
    public class SystemController : ControllerBase
    {
        [HttpGet("financial-years")]
        public IActionResult GetFinancialYears()
        {
            var today = DateTime.UtcNow.Date;
            var startYear = today.Month >= 4 ? today.Year : today.Year - 1;
            var years = new List<object>();

            for (var y = startYear - 2; y <= startYear + 1; y++)
            {
                var fyStart = new DateTime(y, 4, 1);
                var fyEnd = new DateTime(y + 1, 3, 31);
                var label = $"{y}-{(y + 1).ToString().Substring(2)}";

                years.Add(new
                {
                    key = $"{y}-{y + 1}",
                    label,
                    startDate = fyStart,
                    endDate = fyEnd,
                    isCurrent = y == startYear
                });
            }

            return Ok(years);
        }
    }
}
