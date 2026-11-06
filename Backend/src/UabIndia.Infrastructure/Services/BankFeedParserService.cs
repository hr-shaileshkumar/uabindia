using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Text.RegularExpressions;
using UabIndia.Application.Interfaces;

namespace UabIndia.Infrastructure.Services
{
    public class BankFeedParserService : IBankFeedParserService
    {
        public ParsedBankStatement ParseOfxStatement(string ofxContent)
        {
            var statement = new ParsedBankStatement
            {
                Currency = "USD",
                StatementDate = DateTime.UtcNow
            };

            if (string.IsNullOrWhiteSpace(ofxContent)) return statement;

            // Extract Account ID
            var acctMatch = Regex.Match(ofxContent, @"<ACCTID>([^<\r\n]+)", RegexOptions.IgnoreCase);
            if (acctMatch.Success) statement.AccountNumber = acctMatch.Groups[1].Value.Trim();

            // Extract Currency
            var curMatch = Regex.Match(ofxContent, @"<CURDEF>([^<\r\n]+)", RegexOptions.IgnoreCase);
            if (curMatch.Success) statement.Currency = curMatch.Groups[1].Value.Trim().ToUpperInvariant();

            // Extract Balances
            var balMatch = Regex.Match(ofxContent, @"<BALAMT>([^<\r\n]+)", RegexOptions.IgnoreCase);
            if (balMatch.Success && decimal.TryParse(balMatch.Groups[1].Value, NumberStyles.Any, CultureInfo.InvariantCulture, out var bal))
            {
                statement.ClosingBalance = bal;
            }

            // Extract Transactions (<STMTTRN>...</STMTTRN>)
            var trnMatches = Regex.Matches(ofxContent, @"<STMTTRN>(.*?)</STMTTRN>", RegexOptions.Singleline | RegexOptions.IgnoreCase);
            foreach (Match trn in trnMatches)
            {
                var trnText = trn.Groups[1].Value;

                var typeMatch = Regex.Match(trnText, @"<TRNTYPE>([^<\r\n]+)", RegexOptions.IgnoreCase);
                var dtMatch = Regex.Match(trnText, @"<DTPOSTED>([0-9]{8})", RegexOptions.IgnoreCase);
                var amtMatch = Regex.Match(trnText, @"<TRNAMT>([^<\r\n]+)", RegexOptions.IgnoreCase);
                var idMatch = Regex.Match(trnText, @"<FITID>([^<\r\n]+)", RegexOptions.IgnoreCase);
                var nameMatch = Regex.Match(trnText, @"<NAME>([^<\r\n]+)", RegexOptions.IgnoreCase);

                decimal amt = 0;
                if (amtMatch.Success) decimal.TryParse(amtMatch.Groups[1].Value, NumberStyles.Any, CultureInfo.InvariantCulture, out amt);

                var date = DateTime.UtcNow;
                if (dtMatch.Success && DateTime.TryParseExact(dtMatch.Groups[1].Value, "yyyyMMdd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var parsedDate))
                {
                    date = parsedDate;
                }

                statement.Transactions.Add(new ParsedBankTransaction
                {
                    TransactionDate = date,
                    Amount = Math.Abs(amt),
                    TransactionType = amt >= 0 ? "Credit" : "Debit",
                    ReferenceNumber = idMatch.Success ? idMatch.Groups[1].Value.Trim() : Guid.NewGuid().ToString("N")[..8],
                    Description = nameMatch.Success ? nameMatch.Groups[1].Value.Trim() : (typeMatch.Success ? typeMatch.Groups[1].Value.Trim() : "Bank Transfer"),
                    PayeePayer = nameMatch.Success ? nameMatch.Groups[1].Value.Trim() : null
                });
            }

            return statement;
        }

        public ParsedBankStatement ParseMt940Statement(string mt940Content)
        {
            var statement = new ParsedBankStatement
            {
                Currency = "EUR",
                StatementDate = DateTime.UtcNow
            };

            if (string.IsNullOrWhiteSpace(mt940Content)) return statement;

            using var reader = new StringReader(mt940Content);
            string? line;
            while ((line = reader.ReadLine()) != null)
            {
                line = line.Trim();
                if (line.StartsWith(":25:")) // Account identification
                {
                    statement.AccountNumber = line[4..].Trim();
                }
                else if (line.StartsWith(":62F:") || line.StartsWith(":62M:")) // Closing Balance (e.g. :62F:C260824EUR150000,00)
                {
                    var balPart = line[5..];
                    if (balPart.Length > 10)
                    {
                        var curr = balPart.Substring(7, 3);
                        statement.Currency = curr;
                    }
                }
                else if (line.StartsWith(":61:")) // Statement Line (e.g. :61:2608240824CR1500,00NTRFNONREF//REF123)
                {
                    var val = line[4..];
                    if (val.Length >= 15)
                    {
                        var isCredit = val.Contains("CR") || val.Contains("C");
                        var amtMatch = Regex.Match(val, @"[C|D|CR|DR]([0-9]+[,\.][0-9]{2})");
                        decimal amt = 0;
                        if (amtMatch.Success)
                        {
                            var numStr = amtMatch.Groups[1].Value.Replace(',', '.');
                            decimal.TryParse(numStr, NumberStyles.Any, CultureInfo.InvariantCulture, out amt);
                        }

                        statement.Transactions.Add(new ParsedBankTransaction
                        {
                            TransactionDate = DateTime.UtcNow,
                            Amount = amt,
                            TransactionType = isCredit ? "Credit" : "Debit",
                            ReferenceNumber = Guid.NewGuid().ToString("N")[..8].ToUpperInvariant(),
                            Description = "SWIFT MT940 Transaction"
                        });
                    }
                }
            }

            return statement;
        }

        public ParsedBankStatement ParseCsvStatement(string csvContent, string currency = "USD")
        {
            var statement = new ParsedBankStatement
            {
                Currency = currency.ToUpperInvariant(),
                StatementDate = DateTime.UtcNow
            };

            if (string.IsNullOrWhiteSpace(csvContent)) return statement;

            using var reader = new StringReader(csvContent);
            string? line;
            bool isFirst = true;

            while ((line = reader.ReadLine()) != null)
            {
                if (string.IsNullOrWhiteSpace(line)) continue;
                if (isFirst) { isFirst = false; continue; } // Skip header

                var cols = line.Split(',');
                if (cols.Length >= 3)
                {
                    DateTime.TryParse(cols[0].Trim(), out var dt);
                    var desc = cols[1].Trim().Trim('"');
                    decimal.TryParse(cols[2].Trim().Trim('"'), NumberStyles.Any, CultureInfo.InvariantCulture, out var amt);

                    var type = cols.Length >= 4 ? cols[3].Trim() : (amt >= 0 ? "Credit" : "Debit");

                    statement.Transactions.Add(new ParsedBankTransaction
                    {
                        TransactionDate = dt == DateTime.MinValue ? DateTime.UtcNow : dt,
                        Amount = Math.Abs(amt),
                        TransactionType = type.Equals("Debit", StringComparison.OrdinalIgnoreCase) || amt < 0 ? "Debit" : "Credit",
                        ReferenceNumber = cols.Length >= 5 ? cols[4].Trim() : Guid.NewGuid().ToString("N")[..8],
                        Description = desc
                    });
                }
            }

            return statement;
        }
    }
}
