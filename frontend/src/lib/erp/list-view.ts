export type ListFilterOperator =
  | "eq"
  | "neq"
  | "like"
  | "nlike"
  | "contains"
  | "ncontains"
  | "gt"
  | "lt"
  | "gte"
  | "lte"
  | "empty"
  | "nempty"
  | "starts"
  | "ends";

export const LIST_FILTER_OPERATORS: { value: ListFilterOperator; label: string }[] = [
  { value: "eq", label: "Equals" },
  { value: "neq", label: "Not equals" },
  { value: "like", label: "Like" },
  { value: "nlike", label: "Not like" },
  { value: "contains", label: "Contains" },
  { value: "ncontains", label: "Does not contain" },
  { value: "starts", label: "Starts with" },
  { value: "ends", label: "Ends with" },
  { value: "gt", label: "Greater than" },
  { value: "lt", label: "Less than" },
  { value: "gte", label: "Greater or equal" },
  { value: "lte", label: "Less or equal" },
  { value: "empty", label: "Is empty" },
  { value: "nempty", label: "Is not empty" },
];

export type ErpListColumn = {
  key: string;
  label: string;
  className?: string;
  defaultVisible?: boolean;
  filterable?: boolean;
  locked?: boolean;
  dataType?: "string" | "number" | "date" | "boolean" | "currency";
};

export type ErpListFilterRule = {
  id: string;
  columnKey: string;
  operator: ListFilterOperator;
  value: string;
};

export type ErpListBulkAction = {
  key: string;
  label: string;
  category?: "data" | "change" | "danger";
  disabled?: boolean;
  onClick: (rowIds: string[]) => void;
};

const SKIP_DISCOVER = new Set(["id", "key", "tenantId", "companyId", "projectId", "isDeleted", "createdBy", "updatedBy"]);

export function slugListColumnKey(label: string) {
  const words = label
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .split(" ")
    .filter(Boolean);
  if (words.length === 0) return "field";
  return words
    .map((word, index) => {
      const lower = word.toLowerCase();
      return index === 0 ? lower : lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join("");
}

export function humanizeListColumnKey(key: string) {
  return key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/^\w/, (char) => char.toUpperCase());
}

export function normalizeListColumns(columns: Array<ErpListColumn | { label: string; className?: string; key?: string }>): ErpListColumn[] {
  return columns.map((column, index) => {
    const label = column.label;
    const key = "key" in column && column.key ? column.key : slugListColumnKey(label) || `col-${index}`;
    const locked = "locked" in column && column.locked ? true : /action/i.test(label);
    return {
      key,
      label,
      className: column.className,
      defaultVisible: "defaultVisible" in column ? column.defaultVisible !== false : true,
      filterable: locked ? false : "filterable" in column ? column.filterable !== false : true,
      locked,
      dataType: "dataType" in column ? column.dataType : "string",
    };
  });
}

export function discoverRowColumns<T>(rows: T[], declared: ErpListColumn[]): ErpListColumn[] {
  const known = new Set(declared.map((column) => column.key.toLowerCase()));
  const extras: ErpListColumn[] = [];
  const sample = rows.find((row) => row && typeof row === "object") as Record<string, unknown> | undefined;
  if (!sample) return declared;

  for (const key of Object.keys(sample)) {
    if (SKIP_DISCOVER.has(key) || known.has(key.toLowerCase())) continue;
    const value = sample[key];
    if (value != null && typeof value === "object" && !Array.isArray(value) && !(value instanceof Date)) continue;
    extras.push({
      key,
      label: humanizeListColumnKey(key),
      defaultVisible: false,
      filterable: true,
      locked: false,
      dataType: typeof value === "number" ? "number" : typeof value === "boolean" ? "boolean" : "string",
    });
    known.add(key.toLowerCase());
  }
  return extras.length ? [...declared, ...extras] : declared;
}

export function getRowFieldValue<T>(row: T, key: string): unknown {
  if (!row || typeof row !== "object") return undefined;
  const record = row as Record<string, unknown>;
  if (key in record) return record[key];
  const lower = key.toLowerCase();
  const match = Object.keys(record).find((item) => item.toLowerCase() === lower);
  return match ? record[match] : undefined;
}

export function formatListCell(value: unknown, dataType?: ErpListColumn["dataType"]): string {
  if (value == null || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (dataType === "currency" && typeof value === "number") return `₹${value.toLocaleString("en-IN")}`;
  if (dataType === "date" || (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value))) {
    const date = new Date(String(value));
    return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString("en-IN");
  }
  if (Array.isArray(value)) return value.map((item) => String(item)).join(", ");
  return String(value);
}

function asComparable(value: unknown): { text: string; number: number | null } {
  if (value == null) return { text: "", number: null };
  if (typeof value === "number") return { text: String(value), number: value };
  if (typeof value === "boolean") return { text: value ? "true" : "false", number: value ? 1 : 0 };
  const text = String(value).trim();
  const number = Number(text.replace(/[,₹%\s]/g, ""));
  return { text, number: Number.isFinite(number) && text !== "" ? number : null };
}

export function matchListFilter(value: unknown, rule: ErpListFilterRule): boolean {
  const { text, number } = asComparable(value);
  const needle = rule.value.trim();
  const textLower = text.toLowerCase();
  const needleLower = needle.toLowerCase();

  switch (rule.operator) {
    case "empty":
      return text === "";
    case "nempty":
      return text !== "";
    case "eq":
      return textLower === needleLower;
    case "neq":
      return textLower !== needleLower;
    case "like":
    case "contains":
      return needleLower.length === 0 || textLower.includes(needleLower);
    case "nlike":
    case "ncontains":
      return needleLower.length === 0 || !textLower.includes(needleLower);
    case "starts":
      return textLower.startsWith(needleLower);
    case "ends":
      return textLower.endsWith(needleLower);
    case "gt":
      return number != null && Number(needle) === Number(needle) && number > Number(needle);
    case "lt":
      return number != null && Number(needle) === Number(needle) && number < Number(needle);
    case "gte":
      return number != null && Number(needle) === Number(needle) && number >= Number(needle);
    case "lte":
      return number != null && Number(needle) === Number(needle) && number <= Number(needle);
    default:
      return true;
  }
}

export function applyListFilters<T>(rows: T[], rules: ErpListFilterRule[]): T[] {
  const usable = rules.filter(
    (rule) => rule.columnKey && (rule.operator === "empty" || rule.operator === "nempty" || rule.value.trim() !== ""),
  );
  if (usable.length === 0) return rows;
  return rows.filter((row) => usable.every((rule) => matchListFilter(getRowFieldValue(row, rule.columnKey), rule)));
}

export function createListFilterRule(columnKey: string): ErpListFilterRule {
  return {
    id: `f-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    columnKey,
    operator: "contains",
    value: "",
  };
}

export function defaultVisibleKeys(columns: ErpListColumn[]): string[] {
  return columns.filter((column) => column.locked || column.defaultVisible !== false).map((column) => column.key);
}

const storagePrefix = "uab.erp-list.";

export function loadListPreferences(listKey: string): { visibleKeys?: string[]; filters?: ErpListFilterRule[] } {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(`${storagePrefix}${listKey}`);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as { visibleKeys?: string[]; filters?: ErpListFilterRule[] };
    return {
      visibleKeys: Array.isArray(parsed.visibleKeys) ? parsed.visibleKeys.filter((key) => typeof key === "string") : undefined,
      filters: Array.isArray(parsed.filters) ? parsed.filters : undefined,
    };
  } catch {
    return {};
  }
}

export function saveListPreferences(listKey: string, value: { visibleKeys: string[]; filters: ErpListFilterRule[] }) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(`${storagePrefix}${listKey}`, JSON.stringify(value));
  } catch {
    /* ignore quota */
  }
}

export function exportListCsv<T>(
  rows: T[],
  columns: ErpListColumn[],
  filename: string,
) {
  const header = columns.map((column) => `"${column.label.replace(/"/g, '""')}"`).join(",");
  const body = rows
    .map((row) =>
      columns
        .map((column) => {
          const cell = formatListCell(getRowFieldValue(row, column.key), column.dataType).replace(/"/g, '""');
          return `"${cell}"`;
        })
        .join(",")
    )
    .join("\n");
  const blob = new Blob([`${header}\n${body}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
