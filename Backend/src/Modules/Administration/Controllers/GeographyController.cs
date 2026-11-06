using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using UabIndia.Api.Models;
using UabIndia.Application.Interfaces;
using UabIndia.Core.Entities;
using UabIndia.Infrastructure.Data;

namespace UabIndia.Api.Modules.Administration.Controllers
{
    [ApiController]
    [Route("api/v1/geo")]
    [Authorize]
    public class GeographyController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly ITenantAccessor _tenantAccessor;

        public GeographyController(ApplicationDbContext db, ITenantAccessor tenantAccessor)
        {
            _db = db;
            _tenantAccessor = tenantAccessor;
        }

        private Guid TenantId => _tenantAccessor.GetTenantId();

        // ── Countries ─────────────────────────────────────────────────────────

        [HttpGet("countries")]
        public async Task<IActionResult> ListCountries()
        {
            var countries = await _db.GeoCountries.AsNoTracking()
                .OrderBy(c => c.Name)
                .Select(c => new GeoCountryDto
                {
                    Id = c.Id,
                    Code = c.Code,
                    Iso2Code = c.Iso2Code,
                    Name = c.Name,
                    CurrencyCode = c.CurrencyCode,
                    PhoneCode = c.PhoneCode,
                    IsActive = c.IsActive
                })
                .ToListAsync();

            // Auto-seed base countries if none exist
            if (countries.Count == 0)
            {
                await SeedDefaultCountriesAsync();
                return await ListCountries();
            }

            return Ok(new { countries, total = countries.Count });
        }

        // ── States ───────────────────────────────────────────────────────────

        [HttpGet("states")]
        public async Task<IActionResult> ListStates([FromQuery] Guid? countryId)
        {
            var query = _db.GeoStates.AsNoTracking();
            if (countryId.HasValue && countryId.Value != Guid.Empty)
            {
                query = query.Where(s => s.CountryId == countryId.Value);
            }

            var states = await query
                .OrderBy(s => s.Name)
                .Select(s => new GeoStateDto
                {
                    Id = s.Id,
                    CountryId = s.CountryId,
                    StateCode = s.StateCode,
                    Name = s.Name,
                    CapitalCity = s.CapitalCity,
                    IsActive = s.IsActive
                })
                .ToListAsync();

            return Ok(new { states, total = states.Count });
        }

        // ── Districts ────────────────────────────────────────────────────────

        [HttpGet("districts")]
        public async Task<IActionResult> ListDistricts([FromQuery] Guid? stateId)
        {
            var query = _db.GeoDistricts.AsNoTracking();
            if (stateId.HasValue && stateId.Value != Guid.Empty)
            {
                query = query.Where(d => d.StateId == stateId.Value);
            }

            var districts = await query
                .OrderBy(d => d.Name)
                .Select(d => new GeoDistrictDto
                {
                    Id = d.Id,
                    StateId = d.StateId,
                    Name = d.Name,
                    DistrictCode = d.DistrictCode,
                    IsActive = d.IsActive
                })
                .ToListAsync();

            return Ok(new { districts, total = districts.Count });
        }

        // ── Cities ───────────────────────────────────────────────────────────

        [HttpGet("cities")]
        public async Task<IActionResult> ListCities([FromQuery] Guid? districtId)
        {
            var query = _db.GeoCities.AsNoTracking();
            if (districtId.HasValue && districtId.Value != Guid.Empty)
            {
                query = query.Where(c => c.DistrictId == districtId.Value);
            }

            var cities = await query
                .OrderBy(c => c.Name)
                .Select(c => new GeoCityDto
                {
                    Id = c.Id,
                    DistrictId = c.DistrictId,
                    Name = c.Name,
                    PostalCode = c.PostalCode,
                    IsActive = c.IsActive
                })
                .ToListAsync();

            return Ok(new { cities, total = cities.Count });
        }

        // ── Seeder Helper ────────────────────────────────────────────────────

        [HttpPost("seed-india")]
        [Authorize(Policy = "Module:platform")]
        public async Task<IActionResult> SeedIndiaMasterData()
        {
            await SeedDefaultCountriesAsync();
            var india = await _db.GeoCountries.FirstOrDefaultAsync(c => c.Code == "IND");
            if (india == null) return BadRequest("India country record not found.");

            // Seed key Indian States if not existing
            var existingStates = await _db.GeoStates.Where(s => s.CountryId == india.Id).ToListAsync();
            var statesToSeed = new (string Code, string Name, string Capital)[]
            {
                ("BR", "Bihar", "Patna"),
                ("JH", "Jharkhand", "Ranchi"),
                ("UP", "Uttar Pradesh", "Lucknow"),
                ("WB", "West Bengal", "Kolkata"),
                ("DL", "Delhi", "New Delhi"),
                ("MH", "Maharashtra", "Mumbai"),
                ("KA", "Karnataka", "Bengaluru"),
                ("TN", "Tamil Nadu", "Chennai"),
                ("GJ", "Gujarat", "Gandhinagar"),
                ("RJ", "Rajasthan", "Jaipur"),
                ("MP", "Madhya Pradesh", "Bhopal"),
                ("OD", "Odisha", "Bhubaneswar")
            };

            var addedStates = 0;
            foreach (var s in statesToSeed)
            {
                if (!existingStates.Any(x => x.StateCode == s.Code || x.Name == s.Name))
                {
                    _db.GeoStates.Add(new GeoState
                    {
                        TenantId = TenantId,
                        CountryId = india.Id,
                        StateCode = s.Code,
                        Name = s.Name,
                        CapitalCity = s.Capital,
                        IsActive = true
                    });
                    addedStates++;
                }
            }
            await _db.SaveChangesAsync();

            // Seed Bihar Districts (Patna, Gaya, Muzaffarpur, Bhagalpur, Nalanda, etc.)
            var bihar = await _db.GeoStates.FirstOrDefaultAsync(s => s.CountryId == india.Id && s.StateCode == "BR");
            if (bihar != null)
            {
                var existingDistricts = await _db.GeoDistricts.Where(d => d.StateId == bihar.Id).ToListAsync();
                var biharDistricts = new[]
                {
                    "Patna", "Gaya", "Muzaffarpur", "Bhagalpur", "Nalanda", "Darbhanga",
                    "Purnia", "Rohtas", "Vaishali", "Saran", "Samastipur", "Begusarai"
                };

                foreach (var distName in biharDistricts)
                {
                    if (!existingDistricts.Any(d => d.Name.Equals(distName, StringComparison.OrdinalIgnoreCase)))
                    {
                        _db.GeoDistricts.Add(new GeoDistrict
                        {
                            TenantId = TenantId,
                            StateId = bihar.Id,
                            Name = distName,
                            DistrictCode = distName.ToUpperInvariant().Substring(0, Math.Min(3, distName.Length)),
                            IsActive = true
                        });
                    }
                }
                await _db.SaveChangesAsync();

                // Seed key Patna Cities/Areas
                var patnaDist = await _db.GeoDistricts.FirstOrDefaultAsync(d => d.StateId == bihar.Id && d.Name == "Patna");
                if (patnaDist != null)
                {
                    var existingCities = await _db.GeoCities.Where(c => c.DistrictId == patnaDist.Id).ToListAsync();
                    var patnaTowns = new (string Name, string Pin)[]
                    {
                        ("Patna Town", "800001"),
                        ("Danapur", "801503"),
                        ("Phulwari Sharif", "801505"),
                        ("Patna City", "800008"),
                        ("Bihta", "801103"),
                        ("Fatwah", "803201")
                    };

                    foreach (var town in patnaTowns)
                    {
                        if (!existingCities.Any(c => c.Name.Equals(town.Name, StringComparison.OrdinalIgnoreCase)))
                        {
                            _db.GeoCities.Add(new GeoCity
                            {
                                TenantId = TenantId,
                                DistrictId = patnaDist.Id,
                                Name = town.Name,
                                PostalCode = town.Pin,
                                IsActive = true
                            });
                        }
                    }
                    await _db.SaveChangesAsync();
                }
            }

            return Ok(new { message = "Indian administrative geography seeded successfully." });
        }

        private async Task SeedDefaultCountriesAsync()
        {
            if (await _db.GeoCountries.AnyAsync()) return;

            var countries = new[]
            {
                new GeoCountry { TenantId = TenantId, Code = "IND", Iso2Code = "IN", Name = "India", CurrencyCode = "INR", PhoneCode = "+91", IsActive = true },
                new GeoCountry { TenantId = TenantId, Code = "ARE", Iso2Code = "AE", Name = "United Arab Emirates", CurrencyCode = "AED", PhoneCode = "+971", IsActive = true },
                new GeoCountry { TenantId = TenantId, Code = "USA", Iso2Code = "US", Name = "United States", CurrencyCode = "USD", PhoneCode = "+1", IsActive = true },
                new GeoCountry { TenantId = TenantId, Code = "GBR", Iso2Code = "GB", Name = "United Kingdom", CurrencyCode = "GBP", PhoneCode = "+44", IsActive = true },
                new GeoCountry { TenantId = TenantId, Code = "SAU", Iso2Code = "SA", Name = "Saudi Arabia", CurrencyCode = "SAR", PhoneCode = "+966", IsActive = true },
                new GeoCountry { TenantId = TenantId, Code = "KEN", Iso2Code = "KE", Name = "Kenya", CurrencyCode = "KES", PhoneCode = "+254", IsActive = true }
            };

            _db.GeoCountries.AddRange(countries);
            await _db.SaveChangesAsync();
        }
    }
}
