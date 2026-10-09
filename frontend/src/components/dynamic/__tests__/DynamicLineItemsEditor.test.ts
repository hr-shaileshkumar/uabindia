import { describe, it, expect } from "vitest";
import { evaluateLineFormula } from "../DynamicLineItemsEditor";

describe("DynamicLineItemsEditor Formula Evaluator", () => {
  it("evaluates simple multiplication: quantity * unitPrice", () => {
    const row = { quantity: 5, unitPrice: 200 };
    const result = evaluateLineFormula("quantity * unitPrice", row);
    expect(result).toBe(1000);
  });

  it("evaluates discount formula: (quantity * unitPrice) - discount", () => {
    const row = { quantity: 10, unitPrice: 50, discount: 25 };
    const result = evaluateLineFormula("(quantity * unitPrice) - discount", row);
    expect(result).toBe(475);
  });

  it("evaluates special withTax keyword", () => {
    const row = { quantity: 2, unitPrice: 100, discount: 0, taxRate: 18 };
    const result = evaluateLineFormula("withTax", row);
    expect(result).toBe(236);
  });

  it("handles missing variables and division by zero safely", () => {
    const row = {};
    const result = evaluateLineFormula("quantity * unitPrice", row);
    expect(result).toBe(0);

    const divZero = evaluateLineFormula("10 / 0", row);
    expect(divZero).toBe(0);
  });
});
