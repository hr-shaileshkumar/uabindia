import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DynamicCalendarView } from "../engine/DynamicCalendarView";
import type { DynamicColumn } from "@/lib/dynamic-schema/types";

describe("DynamicCalendarView", () => {
  const columns: DynamicColumn[] = [
    { key: "name", label: "Task / Event", dataType: "string" },
    { key: "dueDate", label: "Due Date", dataType: "date" },
    { key: "status", label: "Status", dataType: "status" },
  ];

  const today = new Date();
  const todayIso = today.toISOString().split("T")[0];

  const sampleRows = [
    {
      id: "evt-1",
      name: "Payroll Run Review",
      dueDate: todayIso,
      status: "Pending",
    },
    {
      id: "evt-2",
      name: "Q4 Financial Closing",
      dueDate: todayIso,
      status: "Approved",
    },
  ];

  it("renders calendar headers, weekdays, and record count badge", () => {
    render(
      <DynamicCalendarView
        rows={sampleRows}
        columns={columns}
        dateFieldKey="dueDate"
        titleFieldKey="name"
      />
    );

    // Weekdays
    expect(screen.getByText("Sun")).toBeInTheDocument();
    expect(screen.getByText("Mon")).toBeInTheDocument();
    expect(screen.getByText("Fri")).toBeInTheDocument();

    // Record count
    expect(screen.getByText(/2 Records/i)).toBeInTheDocument();

    // Event titles
    expect(screen.getByText("Payroll Run Review")).toBeInTheDocument();
    expect(screen.getByText("Q4 Financial Closing")).toBeInTheDocument();
  });

  it("navigates months when clicking Next and Previous month buttons", () => {
    render(
      <DynamicCalendarView
        rows={sampleRows}
        columns={columns}
        dateFieldKey="dueDate"
        titleFieldKey="name"
      />
    );

    const prevBtn = screen.getByTitle("Previous Month");
    const nextBtn = screen.getByTitle("Next Month");

    expect(prevBtn).toBeInTheDocument();
    expect(nextBtn).toBeInTheDocument();

    fireEvent.click(nextBtn);
    fireEvent.click(prevBtn);
  });

  it("calls onEdit when clicking on an event item in the calendar", () => {
    const onEdit = vi.fn();

    render(
      <DynamicCalendarView
        rows={sampleRows}
        columns={columns}
        dateFieldKey="dueDate"
        titleFieldKey="name"
        onEdit={onEdit}
      />
    );

    const eventBtn = screen.getByText("Payroll Run Review");
    fireEvent.click(eventBtn);

    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onEdit).toHaveBeenCalledWith(sampleRows[0]);
  });

  it("calls onCreateOnDate when clicking add button on a day cell", () => {
    const onCreateOnDate = vi.fn();

    render(
      <DynamicCalendarView
        rows={sampleRows}
        columns={columns}
        dateFieldKey="dueDate"
        titleFieldKey="name"
        onCreateOnDate={onCreateOnDate}
      />
    );

    const addBtn = screen.getByTitle(`Add record for ${todayIso}`);
    expect(addBtn).toBeInTheDocument();
    fireEvent.click(addBtn);

    expect(onCreateOnDate).toHaveBeenCalledTimes(1);
    expect(onCreateOnDate).toHaveBeenCalledWith(todayIso);
  });
});
