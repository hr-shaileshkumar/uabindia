using System;
using System.Collections.Generic;

namespace UabIndia.Application.Interfaces
{
    public class ParsedBankStatement
    {
        public string AccountNumber { get; set; } = string.Empty;
        public string Currency { get; set; } = "USD";
        public decimal OpeningBalance { get; set; }
        public decimal ClosingBalance { get; set; }
        public DateTime StatementDate { get; set; }
        public List<ParsedBankTransaction> Transactions { get; set; } = new();
    }

    public class ParsedBankTransaction
    {
        public DateTime TransactionDate { get; set; }
        public decimal Amount { get; set; }
        public string TransactionType { get; set; } = "Credit"; // Credit (Deposit) or Debit (Withdrawal)
        public string ReferenceNumber { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string? PayeePayer { get; set; }
    }

    public interface IBankFeedParserService
    {
        ParsedBankStatement ParseOfxStatement(string ofxContent);
        ParsedBankStatement ParseMt940Statement(string mt940Content);
        ParsedBankStatement ParseCsvStatement(string csvContent, string currency = "USD");
    }
}
