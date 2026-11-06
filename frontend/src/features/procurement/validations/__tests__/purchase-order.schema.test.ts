import { describe, expect, it } from "vitest";
import {
  calculateDocumentTotals,
  calculateLineAmounts,
  validatePurchaseOrder,
} from "../purchase-order.schema";

describe("purchaseOrderSchema - Procurement & Calculations Validation", () => {
  it("should calculate line amounts with discount and tax correctly", () => {
    // 10 units @ 100 with 10% discount = 90 * 10 = 900 taxable
    // 18% tax on 900 = 162
    // total = 1062
    const line = {
      quantity: 10,
      unitPrice: 100,
      discountPercent: 10,
      taxRate: 18,
    };

    const amounts = calculateLineAmounts(line);
    expect(amounts.taxable).toBe(900);
    expect(amounts.tax).toBe(162);
    expect(amounts.total).toBe(1062);
  });

  it("should validate a complete purchase order and return computed totals", () => {
    const validPO = {
      vendorId: "vnd-acme-corp",
      orderDate: "2026-09-08",
      expectedDeliveryDate: "2026-09-20",
      currency: "INR",
      lines: [
        {
          itemId: "itm-laptop-01",
          description: "Dell Latitude 5520",
          quantity: 2,
          unitPrice: 50000,
          discountPercent: 5,
          taxRate: 18,
        },
        {
          itemId: "itm-monitor-02",
          description: "Dell 27-inch 4K Monitor",
          quantity: 4,
          unitPrice: 15000,
          discountPercent: 0,
          taxRate: 18,
        },
      ],
    };

    const result = validatePurchaseOrder(validPO);
    expect(result.success).toBe(true);
    expect(result.data?.lines.length).toBe(2);

    // Line 1: 2 * 50000 * 0.95 = 95,000; Tax 18% = 17,100; Total = 112,100
    // Line 2: 4 * 15000 = 60,000; Tax 18% = 10,800; Total = 70,800
    // Subtotal: 155,000; Tax Total: 27,900; Grand Total: 182,900
    expect(result.totals?.subtotal).toBe(155000);
    expect(result.totals?.taxTotal).toBe(27900);
    expect(result.totals?.grandTotal).toBe(182900);
  });

  it("should reject purchase orders with non-positive quantities", () => {
    const invalidPO = {
      vendorId: "vnd-acme-corp",
      orderDate: "2026-09-08",
      lines: [
        {
          itemId: "itm-1",
          quantity: 0,
          unitPrice: 100,
        },
      ],
    };

    const result = validatePurchaseOrder(invalidPO);
    expect(result.success).toBe(false);
    expect(result.error).toContain("Quantity must be greater than zero");
  });

  it("should reject purchase orders with negative unit price", () => {
    const invalidPO = {
      vendorId: "vnd-acme-corp",
      orderDate: "2026-09-08",
      lines: [
        {
          itemId: "itm-1",
          quantity: 5,
          unitPrice: -50,
        },
      ],
    };

    const result = validatePurchaseOrder(invalidPO);
    expect(result.success).toBe(false);
    expect(result.error).toContain("Unit price cannot be negative");
  });

  it("should reject purchase orders with discount exceeding 100%", () => {
    const invalidPO = {
      vendorId: "vnd-acme-corp",
      orderDate: "2026-09-08",
      lines: [
        {
          itemId: "itm-1",
          quantity: 1,
          unitPrice: 100,
          discountPercent: 120,
        },
      ],
    };

    const result = validatePurchaseOrder(invalidPO);
    expect(result.success).toBe(false);
    expect(result.error).toContain("Discount cannot exceed 100%");
  });

  it("should reject purchase orders with no line items", () => {
    const invalidPO = {
      vendorId: "vnd-acme-corp",
      orderDate: "2026-09-08",
      lines: [],
    };

    const result = validatePurchaseOrder(invalidPO);
    expect(result.success).toBe(false);
    expect(result.error).toContain("At least one order line item is required");
  });

  it("should reject purchase orders with missing vendorId", () => {
    const invalidPO = {
      vendorId: "",
      orderDate: "2026-09-08",
      lines: [
        {
          itemId: "itm-1",
          quantity: 1,
          unitPrice: 100,
        },
      ],
    };

    const result = validatePurchaseOrder(invalidPO);
    expect(result.success).toBe(false);
    expect(result.error).toContain("Vendor selection is required");
  });
});
