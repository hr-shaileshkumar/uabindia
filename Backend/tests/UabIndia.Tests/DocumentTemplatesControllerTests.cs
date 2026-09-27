using System;
using System.Collections.Generic;
using Microsoft.AspNetCore.Mvc;
using UabIndia.Api.Modules.Administration.Controllers;
using Xunit;

namespace UabIndia.Tests
{
    public class DocumentTemplatesControllerTests
    {
        [Fact]
        public void GetTemplates_ReturnsStandardDocumentTemplates()
        {
            var controller = new DocumentTemplatesController();
            var result = controller.GetTemplates();

            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.NotNull(okResult.Value);
        }

        [Fact]
        public void RenderDocument_GeneratesValidHtmlWithWatermarkAndTotals()
        {
            var controller = new DocumentTemplatesController();

            var request = new DocumentTemplatesController.RenderDocumentRequest
            {
                TemplateKey = "tax_invoice",
                Title = "Tax Invoice",
                DocumentNumber = "INV-2026-001",
                WatermarkText = "ORIGINAL FOR RECIPIENT",
                CompanyName = "Acme Corp India",
                CompanyGstin = "29AABCU9603R1ZM",
                PartyName = "Global Logistics Ltd",
                SubTotal = 100000m,
                TaxAmount = 18000m,
                GrandTotal = 118000m,
                LineItems = new List<DocumentTemplatesController.RenderLineItemDto>
                {
                    new()
                    {
                        Description = "Enterprise SaaS Subscription",
                        HsnCode = "998313",
                        Quantity = 1,
                        UnitPrice = 100000m,
                        TaxRate = 18,
                        LineTotal = 118000m
                    }
                }
            };

            var result = controller.RenderDocument(request);

            var contentResult = Assert.IsType<ContentResult>(result);
            Assert.StartsWith("text/html", contentResult.ContentType);
            Assert.Contains("Acme Corp India", contentResult.Content);
            Assert.Contains("ORIGINAL FOR RECIPIENT", contentResult.Content);
            Assert.Contains("INV-2026-001", contentResult.Content);
            Assert.Contains("Enterprise SaaS Subscription", contentResult.Content);
            Assert.Contains("Grand Total", contentResult.Content);
            Assert.Contains("118", contentResult.Content);
        }

        [Fact]
        public void RenderPdf_GeneratesValidPdfFileResult()
        {
            var controller = new DocumentTemplatesController();

            var request = new DocumentTemplatesController.RenderDocumentRequest
            {
                TemplateKey = "tax_invoice",
                Title = "Tax Invoice",
                DocumentNumber = "INV-2026-PDF-01",
                CompanyName = "Acme Corp India",
                PartyName = "Global Logistics Ltd",
                SubTotal = 50000m,
                TaxAmount = 9000m,
                GrandTotal = 59000m,
                Currency = "INR",
                LineItems = new List<DocumentTemplatesController.RenderLineItemDto>
                {
                    new()
                    {
                        Description = "Cloud Hosting",
                        Quantity = 1,
                        UnitPrice = 50000m,
                        LineTotal = 59000m
                    }
                }
            };

            var result = controller.RenderPdf(request);

            var fileResult = Assert.IsType<FileContentResult>(result);
            Assert.Equal("application/pdf", fileResult.ContentType);
            Assert.Contains("INV-2026-PDF-01", fileResult.FileDownloadName);
            Assert.NotNull(fileResult.FileContents);
            Assert.True(fileResult.FileContents.Length > 0);

            // Verify standard PDF header %PDF-1.4
            var header = System.Text.Encoding.ASCII.GetString(fileResult.FileContents, 0, 8);
            Assert.StartsWith("%PDF-1.4", header);
        }
    }
}
