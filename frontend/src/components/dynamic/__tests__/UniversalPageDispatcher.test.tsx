import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { UniversalPageDispatcher } from "../UniversalPageDispatcher";

// Mock sub-components that have heavy network or query client requirements
vi.mock("@/components/dynamic/DynamicPage", () => ({
  DynamicPage: ({ pageKey }: { pageKey: string }) => (
    <div data-testid="mock-dynamic-page">DynamicPage: {pageKey}</div>
  ),
  pageSchemaToDynamicSchema: (s: any) => s,
}));

vi.mock("@/components/dynamic/UabModuleDashboard", () => ({
  UabModuleDashboard: ({ moduleKey, title }: { moduleKey: string; title: string }) => (
    <div data-testid="mock-uab-module-dashboard">
      Dashboard: {moduleKey} - {title}
    </div>
  ),
}));

vi.mock("@/features/dashboard/components/MetadataDashboardStudio", () => ({
  MetadataDashboardStudio: ({ dashboardKey }: { dashboardKey: string }) => (
    <div data-testid="mock-dashboard-studio">Studio: {dashboardKey}</div>
  ),
}));

describe("UniversalPageDispatcher — Architecture Archetype Engine", () => {
  it("renders Master archetype by default for standard registers", () => {
    render(<UniversalPageDispatcher pageKey="hrms.employees" />);
    expect(screen.getByTestId("archetype-master")).toBeInTheDocument();
    expect(screen.getByTestId("mock-dynamic-page")).toHaveTextContent("hrms.employees");
  });

  it("renders Dashboard archetype when pageKey indicates dashboard", () => {
    render(<UniversalPageDispatcher pageKey="finance.dashboard" />);
    expect(screen.getByTestId("archetype-dashboard")).toBeInTheDocument();
    expect(screen.getByTestId("mock-uab-module-dashboard")).toBeInTheDocument();
  });

  it("renders Studio archetype when override or schema specifies studio", () => {
    render(
      <UniversalPageDispatcher
        pageKey="operations.command"
        archetypeOverride="studio"
      />
    );
    expect(screen.getByTestId("archetype-studio")).toBeInTheDocument();
    expect(screen.getByTestId("mock-dashboard-studio")).toHaveTextContent("operations.command");
  });

  it("renders Document archetype when archetypeOverride is document", () => {
    render(
      <UniversalPageDispatcher
        pageKey="sales.invoice"
        archetypeOverride="document"
      />
    );
    expect(screen.getByTestId("archetype-document")).toBeInTheDocument();
  });

  it("renders Kanban archetype when archetypeOverride is kanban", () => {
    render(
      <UniversalPageDispatcher
        pageKey="crm.deals"
        archetypeOverride="kanban"
      />
    );
    expect(screen.getByTestId("archetype-kanban")).toBeInTheDocument();
  });

  it("renders Calendar archetype when archetypeOverride is calendar", () => {
    render(
      <UniversalPageDispatcher
        pageKey="hrms.attendance"
        archetypeOverride="calendar"
      />
    );
    expect(screen.getByTestId("archetype-calendar")).toBeInTheDocument();
  });

  it("auto-detects document archetype for invoice registers", () => {
    render(<UniversalPageDispatcher pageKey="sales.invoices" />);
    expect(screen.getByTestId("archetype-document")).toBeInTheDocument();
  });
});
