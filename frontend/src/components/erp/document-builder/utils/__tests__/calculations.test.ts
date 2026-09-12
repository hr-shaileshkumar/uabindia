import { describe, expect, it } from "vitest";
import {
  billDiscountAmount,
  docLinesFromApi,
  documentTotals,
  emptyBillDiscount,
  emptyDocLine,
  formatInr,
  formatSchemeDiscount,
  hasUsableLine,
  lineAmounts,
  netLineRate,
  payloadLines,
  withBillDiscount,
} from "../calculations";
import type { DocLine } from "../../types";

describe("document-builder calculations", () => {
  it("computes netLineRate accurately for standard, percent, amount, and special discounts", () => {
    const baseLine: DocLine = {
      ...emptyDocLine(),
      unitPrice: 1000,
    };

    // No discount
    expect(netLineRate(baseLine)).toBe(1000);

    // 10% discount
    expect(
      netLineRate({
        ...baseLine,
        discountType: "Percent",
        discountValue: 10,
      }),
    ).toBe(900);

    // Fixed Rs 150 discount
    expect(
      netLineRate({
        ...baseLine,
        discountType: "Amount",
        discountValue: 150,
      }),
    ).toBe(850);

    // Special Price Rs 799
    expect(
      netLineRate({
        ...baseLine,
        discountType: "SpecialPrice",
        discountValue: 799,
      }),
    ).toBe(799);
  });

  it("calculates taxable amount and GST tax in lineAmounts", () => {
    const line: DocLine = {
      ...emptyDocLine(),
      quantity: 2,
      unitPrice: 500,
      taxRate: 18,
    };

    const amounts = lineAmounts(line);
    expect(amounts.taxable).toBe(1000);
    expect(amounts.tax).toBe(180);
    expect(amounts.total).toBe(1180);
  });

  it("aggregates document totals and filters unusable lines", () => {
    const lines: DocLine[] = [
      {
        ...emptyDocLine(),
        itemId: "item-1",
        quantity: 2,
        unitPrice: 100,
        taxRate: 18,
      },
      {
        ...emptyDocLine(),
        itemId: "item-2",
        quantity: 1,
        unitPrice: 200,
        taxRate: 18,
      },
      {
        ...emptyDocLine(),
        itemId: "", // Unusable (no item selected)
        quantity: 5,
        unitPrice: 100,
      },
      {
        ...emptyDocLine(),
        itemId: "item-3",
        quantity: 0, // Unusable (0 qty)
        unitPrice: 100,
      },
    ];

    expect(hasUsableLine(lines[0])).toBe(true);
    expect(hasUsableLine(lines[2])).toBe(false);
    expect(hasUsableLine(lines[3])).toBe(false);

    const totals = documentTotals(lines);
    // Line 1: taxable 200, tax 36, total 236
    // Line 2: taxable 200, tax 36, total 236
    expect(totals.subTotal).toBe(400);
    expect(totals.taxAmount).toBe(72);
    expect(totals.total).toBe(472);
  });

  it("applies bill-level discounts correctly with withBillDiscount", () => {
    const totals = { subTotal: 1000, taxAmount: 180, total: 1180 };

    // No discount
    const noneResult = withBillDiscount(totals, emptyBillDiscount());
    expect(noneResult.discountAmount).toBe(0);
    expect(noneResult.netTotal).toBe(1180);

    // 10% Bill Discount
    const percentResult = withBillDiscount(totals, { kind: "percent", percent: 10, amount: 0 });
    expect(percentResult.discountAmount).toBe(118);
    expect(percentResult.netTotal).toBe(1062);

    // Fixed Rs 200 Bill Discount
    const fixedResult = withBillDiscount(totals, { kind: "amount", percent: 0, amount: 200 });
    expect(fixedResult.discountAmount).toBe(200);
    expect(fixedResult.netTotal).toBe(980);

    // Discount exceeding total is capped at total
    const excessDiscount = billDiscountAmount(500, { kind: "amount", percent: 0, amount: 800 });
    expect(excessDiscount).toBe(500);
  });

  it("correctly maps API lines to DocLine and vice versa", () => {
    const apiLines = [
      { itemId: "sku-1", description: "Widget A", quantity: 3, unitPrice: 45, taxRate: 18 },
    ];

    const docLines = docLinesFromApi(apiLines);
    expect(docLines.length).toBe(1);
    expect(docLines[0].itemId).toBe("sku-1");
    expect(docLines[0].quantity).toBe(3);
    expect(docLines[0].unitPrice).toBe(45);

    const payload = payloadLines(docLines);
    expect(payload.length).toBe(1);
    expect(payload[0]).toEqual({
      itemId: "sku-1",
      description: "Widget A",
      quantity: 3,
      unitPrice: 45,
      taxRate: 18,
    });
  });

  it("formats scheme discounts and INR currency values", () => {
    expect(formatSchemeDiscount("Percent", 15)).toBe("15% off");
    expect(formatSchemeDiscount("Amount", 250)).toBe("Rs 250 off");
    expect(formatSchemeDiscount("SpecialPrice", 999)).toBe("Special Rs 999");
    expect(formatSchemeDiscount(undefined, 0)).toBe("—");

    expect(formatInr(12500)).toContain("12,500");
  });
});
