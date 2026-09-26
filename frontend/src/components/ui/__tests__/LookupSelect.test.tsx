import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { LookupSelect } from "../LookupSelect";

// Mock @/services/lookup
const mockUseLookup = vi.fn((type: string, query?: any) => {
  if (type === "departments") {
    return {
      items: [
        { id: "dept-1", name: "Human Resources", code: "HR" },
        { id: "dept-2", name: "Information Technology", code: "IT" },
      ],
      loading: false,
      error: null,
    };
  }
  if (type === "states" && query?.parentId === "IND") {
    return {
      items: [
        { id: "KA", name: "Karnataka", code: "KA" },
        { id: "MH", name: "Maharashtra", code: "MH" },
      ],
      loading: false,
      error: null,
    };
  }
  return { items: [], loading: false, error: null };
});

vi.mock("@/services/lookup", () => ({
  useLookup: (type: string, query?: any) => mockUseLookup(type, query),
}));

describe("LookupSelect Component", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders with placeholder and loaded options", () => {
    render(<LookupSelect dictionary="departments" placeholder="Choose department" />);
    expect(screen.getByRole("combobox")).toBeDefined();
    expect(screen.getByText("Choose department")).toBeDefined();
    expect(screen.getByText("Human Resources")).toBeDefined();
    expect(screen.getByText("Information Technology")).toBeDefined();
  });

  it("shows code when showCode is true", () => {
    render(<LookupSelect dictionary="departments" showCode={true} />);
    expect(screen.getByText("Human Resources (HR)")).toBeDefined();
    expect(screen.getByText("Information Technology (IT)")).toBeDefined();
  });

  it("calls onChange with selected value and item", () => {
    const handleChange = vi.fn();
    render(<LookupSelect dictionary="departments" onChange={handleChange} />);
    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "dept-1" } });
    expect(handleChange).toHaveBeenCalledWith("dept-1", expect.objectContaining({ name: "Human Resources" }));
  });

  it("passes parentId to lookup query for cascading lookups", () => {
    render(<LookupSelect dictionary="states" parentId="IND" placeholder="Select state" />);
    expect(mockUseLookup).toHaveBeenCalledWith("states", { parentId: "IND", companyId: undefined });
    expect(screen.getByText("Karnataka")).toBeDefined();
    expect(screen.getByText("Maharashtra")).toBeDefined();
  });
});

