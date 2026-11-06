import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  printRecordDocument,
  printTabularReport,
  type PrintDocumentOptions,
  type PrintReportOptions,
} from "../document-print-engine";

describe("document-print-engine", () => {
  let mockWindow: {
    document: {
      write: ReturnType<typeof vi.fn>;
      close: ReturnType<typeof vi.fn>;
    };
  };

  beforeEach(() => {
    mockWindow = {
      document: {
        write: vi.fn(),
        close: vi.fn(),
      },
    };
    vi.spyOn(window, "open").mockImplementation(() => mockWindow as any);
  });

  describe("printRecordDocument", () => {
    it("renders document with standard header, party details, line items, and totals", () => {
      const opts: PrintDocumentOptions = {
        title: "Tax Invoice",
        documentNumber: "INV-2026-001",
        date: "25 Sep 2026",
        watermarkText: "ORIGINAL FOR RECIPIENT",
        partyName: "Acme Global Solutions Ltd",
        partyAddress: "45 Business Bay, Mumbai, MH",
        partyGstin: "27AAACA1234A1Z5",
        lineItems: [
          {
            description: "ERP Implementation & Consulting Services",
            hsnCode: "998313",
            quantity: 2,
            unitPrice: 50000,
            taxRate: 18,
            lineTotal: 100000,
          },
        ],
        subTotal: 100000,
        taxAmount: 18000,
        grandTotal: 118000,
        notes: "Payment due within 30 days.",
        includeSignatureBlock: true,
      };

      printRecordDocument(opts);

      expect(window.open).toHaveBeenCalledWith("", "_blank", expect.stringContaining("width=920"));
      expect(mockWindow.document.write).toHaveBeenCalledTimes(1);
      const html = mockWindow.document.write.mock.calls[0][0] as string;

      expect(html).toContain("Tax Invoice");
      expect(html).toContain("INV-2026-001");
      expect(html).toContain("ORIGINAL FOR RECIPIENT");
      expect(html).toContain("Acme Global Solutions Ltd");
      expect(html).toContain("45 Business Bay, Mumbai, MH");
      expect(html).toContain("27AAACA1234A1Z5");
      expect(html).toContain("ERP Implementation &amp; Consulting Services");
      expect(html).toContain("998313");
      expect(html).toContain("Payment due within 30 days.");
      expect(html).toContain("Authorized Signatory");
      expect(mockWindow.document.close).toHaveBeenCalledTimes(1);
    });

    it("escapes dangerous HTML characters to prevent XSS injection", () => {
      const opts: PrintDocumentOptions = {
        title: "<script>alert('xss')</script>",
        partyName: "<b>Hacked</b> & Co",
      };

      printRecordDocument(opts);

      const html = mockWindow.document.write.mock.calls[0][0] as string;
      expect(html).not.toContain("<script>alert('xss')</script>");
      expect(html).toContain("&lt;script&gt;alert('xss')&lt;/script&gt;");
      expect(html).toContain("&lt;b&gt;Hacked&lt;/b&gt; &amp; Co");
    });

    it("renders document with custom brand color, accent color, and centered banner layout", () => {
      const opts: PrintDocumentOptions = {
        title: "Commercial Quotation",
        companyName: "Acme Industrial Technologies Ltd",
        brandColor: "#064e3b",
        accentColor: "#f59e0b",
        headerLayout: "centered-banner",
        stampUrl: "https://example.com/stamp.png",
        signatoryName: "Vikram Rathore",
        signatoryDesignation: "Vice President - Operations",
        includeSignatureBlock: true,
      };

      printRecordDocument(opts);

      const html = mockWindow.document.write.mock.calls[0][0] as string;
      expect(html).toContain("--brand-primary: #064e3b");
      expect(html).toContain("--brand-accent: #f59e0b");
      expect(html).toContain("Acme Industrial Technologies Ltd");
      expect(html).toContain("Vikram Rathore");
      expect(html).toContain("Vice President - Operations");
      expect(html).toContain("https://example.com/stamp.png");
    });

    it("does not render popup if window.open returns null", () => {
      vi.spyOn(window, "open").mockReturnValue(null);
      expect(() => printRecordDocument({})).not.toThrow();
    });
  });

  describe("printTabularReport", () => {
    it("renders A4 landscape tabular report with column headers, formatted rows, and summary", () => {
      const opts: PrintReportOptions = {
        title: "Sales Orders Register",
        reportNumber: "REP-20260925",
        filterSummary: "Status: Approved | Region: West",
        columns: [
          { key: "code", label: "Order #" },
          { key: "customer", label: "Customer Name" },
          { key: "amount", label: "Amount (₹)" },
        ],
        rows: [
          { code: "SO-101", customer: "Apex Industries", amount: "250000" },
          { code: "SO-102", customer: "Zenith Retailers", amount: "120000" },
        ],
      };

      printTabularReport(opts);

      expect(mockWindow.document.write).toHaveBeenCalledTimes(1);
      const html = mockWindow.document.write.mock.calls[0][0] as string;

      expect(html).toContain("A4 landscape");
      expect(html).toContain("Sales Orders Register");
      expect(html).toContain("REP-20260925");
      expect(html).toContain("Status: Approved | Region: West");
      expect(html).toContain("Order #");
      expect(html).toContain("Customer Name");
      expect(html).toContain("Apex Industries");
      expect(html).toContain("Zenith Retailers");
      expect(html).toContain("Total Records: <strong>2</strong>");
    });
  });
});
