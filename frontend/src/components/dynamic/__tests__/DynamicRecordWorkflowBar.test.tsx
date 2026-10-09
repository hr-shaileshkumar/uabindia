import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { DynamicRecordWorkflowBar } from "../engine/DynamicRecordWorkflowBar";
import type { DynamicWorkflowConfig } from "@/lib/dynamic-schema/types";

describe("DynamicRecordWorkflowBar Component", () => {
  const mockWorkflow: DynamicWorkflowConfig = {
    enabled: true,
    workflowName: "Purchase Order Approval",
    states: [
      { name: "Draft", label: "Draft" },
      { name: "Pending Approval", label: "Pending Approval" },
      { name: "Approved", label: "Approved" },
      { name: "Rejected", label: "Rejected" },
    ],
    transitions: [
      {
        action: "submit",
        label: "Submit for Approval",
        fromState: "Draft",
        toState: "Pending Approval",
        requiredPermission: "procurement.order.submit",
      },
      {
        action: "approve",
        label: "Approve Order",
        fromState: "Pending Approval",
        toState: "Approved",
        requiredPermission: "procurement.order.approve",
      },
      {
        action: "reject",
        label: "Reject Order",
        fromState: "Pending Approval",
        toState: "Rejected",
        requiredPermission: "procurement.order.approve",
      },
    ],
  };

  it("renders workflow stepper and current state indicator", () => {
    const onTransition = vi.fn();
    render(
      <DynamicRecordWorkflowBar
        workflow={mockWorkflow}
        currentState="Draft"
        onTransition={onTransition}
      />
    );

    expect(screen.getByText("Draft")).toBeInTheDocument();
    expect(screen.getByText("Pending Approval")).toBeInTheDocument();
    expect(screen.getByText("Submit for Approval")).toBeInTheDocument();
  });

  it("does not render when workflow is disabled", () => {
    const onTransition = vi.fn();
    const disabledWorkflow = { ...mockWorkflow, enabled: false };
    const { container } = render(
      <DynamicRecordWorkflowBar
        workflow={disabledWorkflow}
        currentState="Draft"
        onTransition={onTransition}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it("handles workflow transition confirmation with remarks", async () => {
    const onTransition = vi.fn().mockResolvedValue(undefined);
    render(
      <DynamicRecordWorkflowBar
        workflow={mockWorkflow}
        currentState="Draft"
        onTransition={onTransition}
      />
    );

    const submitBtn = screen.getByText("Submit for Approval");
    fireEvent.click(submitBtn);

    const textarea = screen.getByPlaceholderText(/Add audit notes or reasoning/i);
    expect(textarea).toBeInTheDocument();

    fireEvent.change(textarea, { target: { value: "All quotes verified." } });

    const confirmBtn = screen.getByText("Confirm & Proceed");
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(onTransition).toHaveBeenCalledTimes(1);
      expect(onTransition).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "submit",
          label: "Submit for Approval",
          fromState: "Draft",
          toState: "Pending Approval",
        }),
        "All quotes verified."
      );
    });
  });
});
