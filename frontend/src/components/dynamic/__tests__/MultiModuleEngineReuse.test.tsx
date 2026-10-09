import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import React from "react";
import {
  renderDynamicTableCell,
  DynamicFieldInput,
} from "../DynamicFieldRegistry";
import { pageSchemaToDynamicSchema } from "../DynamicPage";
import type { PageSchema } from "@/lib/metadata/types";
import type { DynamicColumn, DynamicFormField } from "@/lib/dynamic-schema/types";

describe("Multi-Module Dynamic Engine Reuse & Customization", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  // Module 1 Catalog: Administration - Departments
  const administrationCatalog: PageSchema = {
    pageKey: "administration.departments",
    moduleKey: "administration",
    apiEndpoint: "/api/v1/departments",
    entityName: "Department",
    title: "Departments",
    subTitle: "Manage corporate business units and departmental structures",
    viewType: "table",
    columns: [
      { key: "code", label: "Department Code", type: "text", sortable: true },
      { key: "name", label: "Department Name", type: "text", sortable: true },
      { key: "status", label: "Status", type: "status", sortable: true },
      { key: "budget", label: "Annual Budget", type: "currency", sortable: true },
    ],
    filters: [
      { key: "status", label: "Status", type: "select" },
    ],
  };

  // Module 2 Catalog: Procurement - Vendors
  const procurementCatalog: PageSchema = {
    pageKey: "procurement.vendors",
    moduleKey: "procurement",
    apiEndpoint: "/api/v1/vendors",
    entityName: "Vendor",
    title: "Vendors & Suppliers",
    subTitle: "Approved suppliers, procurement contacts, and payment terms",
    viewType: "table",
    columns: [
      { key: "vendorCode", label: "Vendor Code", type: "text", sortable: true },
      { key: "companyName", label: "Company Name", type: "text", sortable: true },
      { key: "status", label: "Status", type: "status", sortable: true },
      { key: "creditLimit", label: "Credit Limit", type: "currency", sortable: true },
    ],
    filters: [
      { key: "status", label: "Status", type: "select" },
    ],
  };

  it("proves universal schema translation across distinct Administration and Procurement domains", () => {
    const adminSchema = pageSchemaToDynamicSchema(administrationCatalog);
    const procSchema = pageSchemaToDynamicSchema(procurementCatalog);

    // Verify Administration schema conversion
    expect(adminSchema.pageKey).toBe("administration.departments");
    expect(adminSchema.entityName).toBe("Department");
    expect(adminSchema.columns).toHaveLength(4);
    expect(adminSchema.columns[0].key).toBe("code");

    // Verify Procurement schema conversion
    expect(procSchema.pageKey).toBe("procurement.vendors");
    expect(procSchema.entityName).toBe("Vendor");
    expect(procSchema.columns).toHaveLength(4);
    expect(procSchema.columns[0].key).toBe("vendorCode");
  });

  it("reuses the identical renderDynamicTableCell engine across both modules without duplicate code", () => {
    // Administration department row
    const deptRow = {
      code: "DEPT-ENG",
      name: "Engineering Division",
      status: "Active",
      budget: 1500000,
    };
    const deptColBudget: DynamicColumn = { key: "budget", label: "Annual Budget", dataType: "currency" };
    const deptColStatus: DynamicColumn = { key: "status", label: "Status", dataType: "status" };

    const renderedDeptBudget = renderDynamicTableCell(deptColBudget, deptRow.budget, deptRow);
    const renderedDeptStatus = renderDynamicTableCell(deptColStatus, deptRow.status, deptRow);

    const { container: deptContainer } = render(
      <div>
        <div data-testid="dept-budget">{renderedDeptBudget}</div>
        <div data-testid="dept-status">{renderedDeptStatus}</div>
      </div>
    );

    expect(screen.getByTestId("dept-status")).toHaveTextContent("Active");
    expect(screen.getByTestId("dept-budget")).toHaveTextContent("15,00,000");

    cleanup();

    // Procurement vendor row
    const vendorRow = {
      vendorCode: "VEND-001",
      companyName: "Tata Steel Ltd",
      status: "Approved",
      creditLimit: 5000000,
    };
    const vendorColCredit: DynamicColumn = { key: "creditLimit", label: "Credit Limit", dataType: "currency" };
    const vendorColStatus: DynamicColumn = { key: "status", label: "Status", dataType: "status" };

    const renderedVendorCredit = renderDynamicTableCell(vendorColCredit, vendorRow.creditLimit, vendorRow);
    const renderedVendorStatus = renderDynamicTableCell(vendorColStatus, vendorRow.status, vendorRow);

    const { container: vendorContainer } = render(
      <div>
        <div data-testid="vendor-credit">{renderedVendorCredit}</div>
        <div data-testid="vendor-status">{renderedVendorStatus}</div>
      </div>
    );

    expect(screen.getByTestId("vendor-status")).toHaveTextContent("Approved");
    expect(screen.getByTestId("vendor-credit")).toHaveTextContent("50,00,000");
  });

  it("reuses DynamicFieldInput across both modules and adapts to dynamically added fields with zero code changes", () => {
    const onChange = vi.fn();

    // Field 1: Administration field
    const deptCodeField: DynamicFormField = {
      key: "code",
      label: "Department Code",
      fieldType: "text",
      required: true,
    };

    render(
      <DynamicFieldInput
        field={deptCodeField}
        value="DEPT-HR"
        onChange={onChange}
      />
    );

    expect(screen.getByLabelText(/Department Code/i)).toHaveValue("DEPT-HR");

    cleanup();

    // Field 2: Procurement field
    const vendorTaxField: DynamicFormField = {
      key: "taxId",
      label: "GSTIN / Tax ID",
      fieldType: "text",
      required: true,
    };

    render(
      <DynamicFieldInput
        field={vendorTaxField}
        value="29ABCDE1234F1Z5"
        onChange={onChange}
      />
    );

    expect(screen.getByLabelText(/GSTIN \/ Tax ID/i)).toHaveValue("29ABCDE1234F1Z5");

    cleanup();

    // Dynamically added custom field (simulating tenant customization)
    const customDynamicField: DynamicFormField = {
      key: "costCenterAllocation",
      label: "Custom Cost Center Allocation",
      fieldType: "text",
      placeholder: "e.g. CC-CORP-01",
    };

    render(
      <DynamicFieldInput
        field={customDynamicField}
        value=""
        onChange={onChange}
      />
    );

    const customInput = screen.getByLabelText(/Custom Cost Center Allocation/i);
    expect(customInput).toBeInTheDocument();
    fireEvent.change(customInput, { target: { value: "CC-CORP-01" } });
    expect(onChange).toHaveBeenCalledWith("CC-CORP-01");
  });
});
