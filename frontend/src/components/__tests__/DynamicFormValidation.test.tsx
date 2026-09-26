import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import React from "react";
import { DynamicForm } from "../dynamic/DynamicForm";
import type { DynamicFormSection } from "@/lib/dynamic-schema/types";

vi.mock("@/context/PermissionContext", () => ({
  usePermissions: () => ({
    hasPermission: () => true,
    isSuperAdmin: true,
  }),
}));

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "test-user", roles: ["Admin"] },
    isSuperAdmin: true,
  }),
}));

vi.mock("@/lib/notifications", () => ({
  notifyError: vi.fn(),
  notifySuccess: vi.fn(),
}));

describe("DynamicForm Validation Engine", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  const testSections: DynamicFormSection[] = [
    {
      title: "General Information",
      fields: [
        {
          key: "companyName",
          label: "Company Name",
          fieldType: "text",
          required: true,
        },
        {
          key: "officialEmail",
          label: "Official Email",
          fieldType: "email",
          required: false,
        },
        {
          key: "contactPhone",
          label: "Contact Phone",
          fieldType: "phone",
          required: false,
        },
        {
          key: "panNumber",
          label: "Company PAN",
          fieldType: "text",
          required: false,
        },
        {
          key: "gstin",
          label: "GSTIN",
          fieldType: "text",
          required: false,
        },
      ],
    },
  ];

  it("prevents submission when a required field is empty", async () => {
    const onSubmit = vi.fn();
    const onCancel = vi.fn();

    render(
      <DynamicForm
        sections={testSections}
        onSubmit={onSubmit}
        onCancel={onCancel}
      />
    );

    const form = document.getElementById("dynamic-record-form")!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText("Company Name is required.")).toBeInTheDocument();
      expect(onSubmit).not.toHaveBeenCalled();
    });
  });

  it("validates email, phone, and statutory PAN/GSTIN format", async () => {
    const onSubmit = vi.fn();
    const onCancel = vi.fn();

    render(
      <DynamicForm
        sections={testSections}
        initialData={{
          companyName: "Acme Enterprises",
          officialEmail: "invalid-email-format",
          contactPhone: "123", // too short
          panNumber: "INVALIDPAN",
          gstin: "12345",
        }}
        onSubmit={onSubmit}
        onCancel={onCancel}
      />
    );

    const form = document.getElementById("dynamic-record-form")!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText("Official Email must be a valid email address.")).toBeInTheDocument();
      expect(screen.getByText("Contact Phone must be a valid phone number (7-15 digits).")).toBeInTheDocument();
      expect(screen.getByText("Company PAN must be a valid 10-character PAN (e.g. ABCDE1234F).")).toBeInTheDocument();
      expect(screen.getByText("GSTIN must be a valid 15-character GSTIN (e.g. 29ABCDE1234F1Z5).")).toBeInTheDocument();
      expect(onSubmit).not.toHaveBeenCalled();
    });
  });

  it("submits clean payload when all fields are valid", async () => {
    const onSubmit = vi.fn();
    const onCancel = vi.fn();

    render(
      <DynamicForm
        sections={testSections}
        initialData={{
          companyName: "Acme Corp Ltd",
          officialEmail: "admin@acmecorp.in",
          contactPhone: "+91 9876543210",
          panNumber: "ABCDE1234F",
          gstin: "29ABCDE1234F1Z5",
        }}
        onSubmit={onSubmit}
        onCancel={onCancel}
      />
    );

    const form = document.getElementById("dynamic-record-form")!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
      const payload = onSubmit.mock.calls[0][0];
      expect(payload.companyName).toBe("Acme Corp Ltd");
      expect(payload.officialEmail).toBe("admin@acmecorp.in");
      expect(payload.panNumber).toBe("ABCDE1234F");
      expect(payload.gstin).toBe("29ABCDE1234F1Z5");
    });
  });
});
