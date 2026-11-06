import { describe, it, expect } from "vitest";
import {
  evaluateFilterAst,
  filterAstToHumanReadable,
  convertFlatRulesToAst,
  type FilterGroup,
} from "../filter-ast";

describe("Universal Filter AST Evaluator", () => {
  const records = [
    {
      id: "1",
      fullName: "Aarav Sharma",
      department: "Engineering",
      status: "Active",
      salary: 60000,
      notes: "Senior Dev",
    },
    {
      id: "2",
      fullName: "Diya Patel",
      department: "Engineering",
      status: "Probation",
      salary: 45000,
      notes: null,
    },
    {
      id: "3",
      fullName: "Rohan Verma",
      department: "Sales",
      status: "Active",
      salary: 55000,
      notes: "Lead Sales",
    },
    {
      id: "4",
      fullName: "Vikram Singh",
      department: "Sales",
      status: "Terminated",
      salary: 40000,
      notes: "",
    },
  ];

  it("evaluates simple AND conditions", () => {
    const ast: FilterGroup = {
      combinator: "AND",
      rules: [
        { field: "department", operator: "eq", value: "Engineering" },
        { field: "status", operator: "eq", value: "Active" },
      ],
    };

    const matches = records.filter((r) => evaluateFilterAst(r, ast));
    expect(matches).toHaveLength(1);
    expect(matches[0].fullName).toBe("Aarav Sharma");
  });

  it("evaluates compound (A AND B) OR (C AND D) conditions", () => {
    const ast: FilterGroup = {
      combinator: "OR",
      rules: [
        {
          combinator: "AND",
          rules: [
            { field: "department", operator: "eq", value: "Engineering" },
            { field: "salary", operator: "gte", value: 50000 },
          ],
        },
        {
          combinator: "AND",
          rules: [
            { field: "department", operator: "eq", value: "Sales" },
            { field: "status", operator: "eq", value: "Active" },
          ],
        },
      ],
    };

    const matches = records.filter((r) => evaluateFilterAst(r, ast));
    // Matches Aarav Sharma (Engineering & 60k) + Rohan Verma (Sales & Active)
    expect(matches).toHaveLength(2);
    expect(matches.map((m) => m.fullName)).toEqual(["Aarav Sharma", "Rohan Verma"]);
  });

  it("evaluates empty and non-empty operators", () => {
    const emptyAst: FilterGroup = {
      combinator: "AND",
      rules: [{ field: "notes", operator: "empty", value: "" }],
    };

    // Diya Patel (null) and Vikram Singh ("") have empty notes
    const emptyMatches = records.filter((r) => evaluateFilterAst(r, emptyAst));
    expect(emptyMatches).toHaveLength(2);
    expect(emptyMatches.map((m) => m.fullName)).toEqual(["Diya Patel", "Vikram Singh"]);

    const nemptyAst: FilterGroup = {
      combinator: "AND",
      rules: [{ field: "notes", operator: "nempty", value: "" }],
    };

    const nemptyMatches = records.filter((r) => evaluateFilterAst(r, nemptyAst));
    expect(nemptyMatches).toHaveLength(2);
    expect(nemptyMatches.map((m) => m.fullName)).toEqual(["Aarav Sharma", "Rohan Verma"]);
  });

  it("generates clean human-readable summaries", () => {
    const ast: FilterGroup = {
      combinator: "OR",
      rules: [
        {
          combinator: "AND",
          rules: [
            { field: "dept", operator: "eq", value: "Eng" },
            { field: "active", operator: "eq", value: "true" },
          ],
        },
        { field: "salary", operator: "gt", value: 50000 },
      ],
    };

    const summary = filterAstToHumanReadable(ast, { dept: "Department", active: "Status", salary: "Salary" });
    expect(summary).toBe('(Department = "Eng" AND Status = "true") OR Salary > "50000"');
  });

  it("converts legacy flat rules to AST", () => {
    const legacyRules = [
      { columnKey: "department", operator: "eq", value: "Engineering" },
      { columnKey: "status", operator: "eq", value: "Active" },
    ];

    const ast = convertFlatRulesToAst(legacyRules);
    expect(ast.combinator).toBe("AND");
    expect(ast.rules).toHaveLength(2);
    const matches = records.filter((r) => evaluateFilterAst(r, ast));
    expect(matches).toHaveLength(1);
    expect(matches[0].fullName).toBe("Aarav Sharma");
  });
});
