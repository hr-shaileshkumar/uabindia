using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Text;
using UabIndia.Application.Interfaces;

namespace UabIndia.Infrastructure.Services
{
    public class EdiParserService : IEdiParserService
    {
        public ParsedEdiDocument ParseX12Document(string x12Content)
        {
            var result = new ParsedEdiDocument();
            if (string.IsNullOrWhiteSpace(x12Content)) return result;

            // X12 segments are separated by '~' or '\n'
            var cleanText = x12Content.Replace("\r\n", "~").Replace("\n", "~");
            var segments = cleanText.Split('~', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

            int currentLine = 1;

            foreach (var rawSeg in segments)
            {
                var elements = rawSeg.Split('*');
                if (elements.Length == 0) continue;
                var tag = elements[0].ToUpperInvariant();

                switch (tag)
                {
                    case "ISA":
                        if (elements.Length > 6) result.SenderId = elements[6].Trim();
                        if (elements.Length > 8) result.ReceiverId = elements[8].Trim();
                        if (elements.Length > 13) result.ControlNumber = elements[13].Trim();
                        break;

                    case "ST":
                        if (elements.Length > 1)
                        {
                            var txSet = elements[1].Trim();
                            result.DocumentType = txSet switch
                            {
                                "850" => "EDI850",
                                "810" => "EDI810",
                                "856" => "EDI856",
                                _ => $"EDI{txSet}"
                            };
                        }
                        if (elements.Length > 2) result.ControlNumber = elements[2].Trim();
                        break;

                    // Purchase Order Beginning Segment
                    case "BEG":
                        if (elements.Length > 3) result.DocumentNumber = elements[3].Trim();
                        if (elements.Length > 5 && DateTime.TryParseExact(elements[5].Trim(), "yyyyMMdd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var begDate))
                        {
                            result.DocumentDate = begDate;
                        }
                        break;

                    // Invoice Beginning Segment
                    case "BIG":
                        if (elements.Length > 2 && DateTime.TryParseExact(elements[2].Trim(), "yyyyMMdd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var bigDate))
                        {
                            result.DocumentDate = bigDate;
                        }
                        if (elements.Length > 3) result.DocumentNumber = elements[3].Trim();
                        break;

                    // Currency
                    case "CUR":
                        if (elements.Length > 2) result.Currency = elements[2].Trim().ToUpperInvariant();
                        break;

                    // Party Identification
                    case "N1":
                        if (elements.Length > 2)
                        {
                            var role = elements[1].Trim().ToUpperInvariant();
                            if (role == "BY" || role == "BT") // Buyer / Bill To
                            {
                                result.BuyerName = elements[2].Trim();
                            }
                            else if (role == "ST") // Ship To
                            {
                                result.ShipToAddress = elements[2].Trim();
                            }
                        }
                        break;

                    // PO Line Item
                    case "PO1":
                        if (elements.Length > 4)
                        {
                            decimal.TryParse(elements[2].Trim(), NumberStyles.Any, CultureInfo.InvariantCulture, out var poQty);
                            decimal.TryParse(elements[4].Trim(), NumberStyles.Any, CultureInfo.InvariantCulture, out var poPrice);
                            var itemCode = elements.Length > 7 ? elements[7].Trim() : (elements.Length > 6 ? elements[6].Trim() : $"ITEM-{currentLine}");
                            var uom = elements.Length > 3 ? elements[3].Trim() : "EA";

                            result.Items.Add(new EdiLineItem
                            {
                                LineNumber = currentLine++,
                                ItemCode = itemCode,
                                Quantity = poQty,
                                UnitOfMeasure = uom,
                                UnitPrice = poPrice,
                                Description = itemCode
                            });
                        }
                        break;

                    // Invoice Line Item
                    case "IT1":
                        if (elements.Length > 4)
                        {
                            decimal.TryParse(elements[2].Trim(), NumberStyles.Any, CultureInfo.InvariantCulture, out var itQty);
                            decimal.TryParse(elements[4].Trim(), NumberStyles.Any, CultureInfo.InvariantCulture, out var itPrice);
                            var itemCode = elements.Length > 7 ? elements[7].Trim() : (elements.Length > 6 ? elements[6].Trim() : $"ITEM-{currentLine}");
                            var uom = elements.Length > 3 ? elements[3].Trim() : "EA";

                            result.Items.Add(new EdiLineItem
                            {
                                LineNumber = currentLine++,
                                ItemCode = itemCode,
                                Quantity = itQty,
                                UnitOfMeasure = uom,
                                UnitPrice = itPrice,
                                Description = itemCode
                            });
                        }
                        break;

                    // Total Monies Amount
                    case "TDS":
                        if (elements.Length > 1 && decimal.TryParse(elements[1].Trim(), NumberStyles.Any, CultureInfo.InvariantCulture, out var totalCents))
                        {
                            // In EDI TDS, total is typically formatted in cents or standard decimal
                            result.TotalAmount = totalCents > 100 && !elements[1].Contains('.') ? totalCents / 100m : totalCents;
                        }
                        break;
                }
            }

            if (result.TotalAmount == 0 && result.Items.Count > 0)
            {
                result.TotalAmount = result.Items.Sum(i => i.Quantity * i.UnitPrice);
            }

            return result;
        }

        public string GenerateX12Edi810(string invoiceNumber, DateTime invoiceDate, decimal totalAmount, string currency, List<EdiLineItem> items, string senderId = "UABINDIA", string receiverId = "PARTNER")
        {
            var sb = new StringBuilder();
            var now = DateTime.UtcNow;
            var ctrl = "000000001";
            var dateStr = invoiceDate.ToString("yyyyMMdd");
            var timeStr = now.ToString("HHmm");

            // Interchange Header (ISA)
            sb.Append($"ISA*00*          *00*          *ZZ*{senderId.PadRight(15)}*ZZ*{receiverId.PadRight(15)}*{now:yyMMdd}*{timeStr}*U*00401*{ctrl}*0*P*>~");
            // Functional Group Header (GS)
            sb.Append($"GS*IN*{senderId}*{receiverId}*{now:yyyyMMdd}*{timeStr}*1*X*004010~");
            // Transaction Set Header (ST - 810 Invoice)
            sb.Append($"ST*810*0001~");
            // Beginning Segment for Invoice (BIG)
            sb.Append($"BIG*{dateStr}*{invoiceNumber}*~");
            // Currency (CUR)
            sb.Append($"CUR*BY*{currency.ToUpperInvariant()}~");

            // Line Items (IT1)
            int lineNo = 1;
            foreach (var item in items)
            {
                sb.Append($"IT1*{lineNo}*{item.Quantity:0.##}*{item.UnitOfMeasure}*{item.UnitPrice:0.00}**VN*{item.ItemCode}~");
                lineNo++;
            }

            // Total Monies Summary (TDS)
            sb.Append($"TDS*{(long)(totalAmount * 100)}~");
            // Transaction Set Trailer (SE)
            sb.Append($"SE*{items.Count + 5}*0001~");
            // Functional Group Trailer (GE)
            sb.Append($"GE*1*1~");
            // Interchange Trailer (IEA)
            sb.Append($"IEA*1*{ctrl}~");

            return sb.ToString();
        }

        public string GenerateX12Edi856(string shipmentNumber, DateTime shipDate, string trackingNumber, List<EdiLineItem> items, string senderId = "UABINDIA", string receiverId = "PARTNER")
        {
            var sb = new StringBuilder();
            var now = DateTime.UtcNow;
            var ctrl = "000000001";
            var dateStr = shipDate.ToString("yyyyMMdd");
            var timeStr = now.ToString("HHmm");

            sb.Append($"ISA*00*          *00*          *ZZ*{senderId.PadRight(15)}*ZZ*{receiverId.PadRight(15)}*{now:yyMMdd}*{timeStr}*U*00401*{ctrl}*0*P*>~");
            sb.Append($"GS*SH*{senderId}*{receiverId}*{now:yyyyMMdd}*{timeStr}*1*X*004010~");
            sb.Append($"ST*856*0001~");
            sb.Append($"BSN*00*{shipmentNumber}*{dateStr}*{timeStr}~");

            // Carrier Tracking Segment (REF)
            if (!string.IsNullOrWhiteSpace(trackingNumber))
            {
                sb.Append($"REF*CN*{trackingNumber}~");
            }

            // Line Items
            int lineNo = 1;
            foreach (var item in items)
            {
                sb.Append($"LIN*{lineNo}*VN*{item.ItemCode}~");
                sb.Append($"SN1*{lineNo}*{item.Quantity:0.##}*{item.UnitOfMeasure}~");
                lineNo++;
            }

            sb.Append($"SE*{items.Count * 2 + 4}*0001~");
            sb.Append($"GE*1*1~");
            sb.Append($"IEA*1*{ctrl}~");

            return sb.ToString();
        }
    }
}
