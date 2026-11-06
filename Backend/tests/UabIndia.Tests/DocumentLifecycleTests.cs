using UabIndia.Core.Services;
using Xunit;

namespace UabIndia.Tests
{
    public class DocumentLifecycleTests
    {
        [Theory]
        [InlineData("Accepted", true)]
        [InlineData("Rejected", true)]
        [InlineData("Expired", true)]
        [InlineData("Draft", false)]
        [InlineData("Sent", false)]
        public void QuotationLockMatchesStatus(string status, bool locked) =>
            Assert.Equal(locked, DocumentLifecycle.IsLockedQuotation(status));

        [Fact]
        public void RejectedQuotationCannotConvert()
        {
            Assert.False(DocumentLifecycle.CanConvertQuotation("Rejected"));
            Assert.False(DocumentLifecycle.CanConvertQuotation("Expired"));
            Assert.True(DocumentLifecycle.CanConvertQuotation("Sent"));
        }

        [Fact]
        public void InvoicedOrderIsLockedAndCancelledCannotConvert()
        {
            Assert.True(DocumentLifecycle.IsLockedSalesOrder("Invoiced"));
            Assert.False(DocumentLifecycle.CanConvertSalesOrder("Cancelled"));
            Assert.True(DocumentLifecycle.CanConvertSalesOrder("Confirmed"));
        }

        [Fact]
        public void PostedInvoiceIsFrozenWhenJournalExists()
        {
            Assert.True(DocumentLifecycle.IsPostedInvoice(Guid.NewGuid()));
            Assert.False(DocumentLifecycle.IsPostedInvoice(null));
        }

        [Fact]
        public void EnsureMutableThrowsOnLockedDocument()
        {
            var ex = Assert.Throws<InvalidOperationException>(() =>
                DocumentLifecycle.EnsureMutable("Posted invoice", true));
            Assert.Contains("locked", ex.Message, StringComparison.OrdinalIgnoreCase);
        }
    }
}
