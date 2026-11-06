// ─── Filter AST Specification & Evaluator ─────────────────────────────────────

export type FilterOperator =
  | "eq"
  | "neq"
  | "contains"
  | "ncontains"
  | "starts"
  | "ends"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "empty"
  | "nempty"
  | "in";

export type FilterCombinator = "AND" | "OR";

export interface FilterCondition {
  id?: string;
  field: string;
  operator: FilterOperator;
  value: any;
}

export interface FilterGroup {
  id?: string;
  combinator: FilterCombinator;
  rules: (FilterCondition | FilterGroup)[];
}

export type FilterAstNode = FilterCondition | FilterGroup;

export function isFilterGroup(node: any): node is FilterGroup {
  return (
    node != null &&
    typeof node === "object" &&
    Array.isArray(node.rules) &&
    (node.combinator === "AND" || node.combinator === "OR")
  );
}

export function isFilterCondition(node: any): node is FilterCondition {
  return node != null && typeof node === "object" && typeof node.field === "string" && !Array.isArray(node.rules);
}

// ─── Value Comparison Helpers ───────────────────────────────────────────────

function asComparable(val: unknown): { text: string; num: number | null; bool: boolean | null } {
  if (val == null) return { text: "", num: null, bool: null };
  if (typeof val === "boolean") return { text: val ? "true" : "false", num: val ? 1 : 0, bool: val };
  if (typeof val === "number") return { text: String(val), num: val, bool: null };

  const text = String(val).trim();
  const num = Number(text.replace(/[,₹$€%\s]/g, ""));
  return {
    text,
    num: Number.isFinite(num) && text !== "" ? num : null,
    bool: text.toLowerCase() === "true" ? true : text.toLowerCase() === "false" ? false : null,
  };
}

export function evaluateCondition(record: Record<string, any>, condition: FilterCondition): boolean {
  if (!condition.field) return true;

  // Resolve nested field paths like "department.name" or "manager.email"
  const parts = condition.field.split(".");
  let rawValue: any = record;
  for (const part of parts) {
    if (rawValue == null) break;
    rawValue = rawValue[part];
  }

  const { text, num } = asComparable(rawValue);
  const targetStr = condition.value == null ? "" : String(condition.value).trim();
  const textLower = text.toLowerCase();
  const targetLower = targetStr.toLowerCase();

  switch (condition.operator) {
    case "empty":
      return text === "" || rawValue == null;
    case "nempty":
      return text !== "" && rawValue != null;
    case "eq":
      return textLower === targetLower;
    case "neq":
      return textLower !== targetLower;
    case "contains":
      return targetLower.length === 0 || textLower.includes(targetLower);
    case "ncontains":
      return targetLower.length === 0 || !textLower.includes(targetLower);
    case "starts":
      return textLower.startsWith(targetLower);
    case "ends":
      return textLower.endsWith(targetLower);
    case "gt": {
      const targetNum = Number(targetStr);
      return num != null && !Number.isNaN(targetNum) && num > targetNum;
    }
    case "gte": {
      const targetNum = Number(targetStr);
      return num != null && !Number.isNaN(targetNum) && num >= targetNum;
    }
    case "lt": {
      const targetNum = Number(targetStr);
      return num != null && !Number.isNaN(targetNum) && num < targetNum;
    }
    case "lte": {
      const targetNum = Number(targetStr);
      return num != null && !Number.isNaN(targetNum) && num <= targetNum;
    }
    case "in": {
      if (Array.isArray(condition.value)) {
        return condition.value.some((v) => String(v).trim().toLowerCase() === textLower);
      }
      const splitValues = targetStr.split(",").map((s) => s.trim().toLowerCase());
      return splitValues.includes(textLower);
    }
    default:
      return true;
  }
}

/**
 * Recursively evaluates a FilterGroup AST against a data record.
 * Supports arbitrary depth of nested (AND / OR) groups.
 */
export function evaluateFilterAst(record: Record<string, any>, group: FilterGroup): boolean {
  if (!group || !Array.isArray(group.rules) || group.rules.length === 0) {
    return true;
  }

  const evaluateNode = (node: FilterAstNode): boolean => {
    if (isFilterGroup(node)) {
      return evaluateFilterAst(record, node);
    }
    if (isFilterCondition(node)) {
      return evaluateCondition(record, node);
    }
    return true;
  };

  if (group.combinator === "OR") {
    return group.rules.some(evaluateNode);
  }

  // Default combinator: AND
  return group.rules.every(evaluateNode);
}

/**
 * Converts a Filter AST into a human-readable display string.
 * Example: "(Department = 'Engineering' AND Status = 'Active') OR (Salary > 50000)"
 */
export function filterAstToHumanReadable(
  node: FilterAstNode,
  fieldLabels: Record<string, string> = {},
  isRoot: boolean = true
): string {
  if (isFilterCondition(node)) {
    const label = fieldLabels[node.field] || node.field;
    const opLabel =
      node.operator === "eq"
        ? "="
        : node.operator === "neq"
        ? "≠"
        : node.operator === "gt"
        ? ">"
        : node.operator === "gte"
        ? "≥"
        : node.operator === "lt"
        ? "<"
        : node.operator === "lte"
        ? "≤"
        : node.operator === "contains"
        ? "contains"
        : node.operator === "empty"
        ? "is empty"
        : node.operator === "nempty"
        ? "is not empty"
        : node.operator;

    if (node.operator === "empty" || node.operator === "nempty") {
      return `${label} ${opLabel}`;
    }
    return `${label} ${opLabel} "${node.value}"`;
  }

  if (isFilterGroup(node)) {
    if (node.rules.length === 0) return "";
    const inner = node.rules
      .map((r) => filterAstToHumanReadable(r, fieldLabels, false))
      .filter(Boolean)
      .join(` ${node.combinator} `);

    return !isRoot && node.rules.length > 1 ? `(${inner})` : inner;
  }

  return "";
}

/**
 * Creates an empty root FilterGroup.
 */
export function createEmptyFilterGroup(combinator: FilterCombinator = "AND"): FilterGroup {
  return {
    id: `grp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    combinator,
    rules: [],
  };
}

/**
 * Converts flat legacy FilterRule[] into an equivalent FilterGroup AST.
 */
export function convertFlatRulesToAst(
  rules: Array<{ columnKey: string; operator: string; value: string }>
): FilterGroup {
  const group = createEmptyFilterGroup("AND");
  group.rules = rules
    .filter((r) => r.columnKey)
    .map((r) => ({
      id: `cond_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      field: r.columnKey,
      operator: (r.operator as FilterOperator) || "eq",
      value: r.value,
    }));
  return group;
}
