import { describe, expect, it } from "vitest";
import {
  buildClonePayload,
  buildCreatePayloadFromWizard,
  mapCompanyRecordToRow,
} from "@/features/companies/company-utils";
import type { CompanyRecord } from "@/features/companies/types";

const sampleCompany: CompanyRecord = {
  id: "11111111-1111-1111-1111-111111111111",
  name: "UAB India Tech",
  legalName: "UAB India Technologies Private Limited",
  code: "UAB-IND",
  registrationNumber: "U72900MH2024PTC392019",
  taxId: "27AABCU9603R1ZM",
  email: "contact@uabindia.com",
  phoneNumber: "+91 22 4920 0000",
  registrationAddress: "Powai, Mumbai",
  operationalAddress: "Bengaluru HQ",
  city: "Mumbai",
  state: "Maharashtra",
  isActive: true,
};

describe("mapCompanyRecordToRow", () => {
  it("maps API company fields to UI row shape", () => {
    const row = mapCompanyRecordToRow(sampleCompany);

    expect(row.id).toBe(sampleCompany.id);
    expect(row.displayName).toBe("UAB India Tech");
    expect(row.companyCode).toBe("UAB-IND");
    expect(row.gstin).toBe("27AABCU9603R1ZM");
    expect(row.email).toBe("contact@uabindia.com");
    expect(row.status).toBe("Active");
  });

  it("marks inactive companies correctly", () => {
    const row = mapCompanyRecordToRow({ ...sampleCompany, isActive: false });
    expect(row.status).toBe("Inactive");
  });
});

describe("buildCreatePayloadFromWizard", () => {
  it("builds a create payload from wizard input", () => {
    const payload = buildCreatePayloadFromWizard({
      name: "Acme Corp",
      code: "acme-01",
      legalName: "Acme Corporation Pvt Ltd",
      cin: "U72900MH2026PTC000001",
      gstin: "27AAAAA0000A1Z5",
      phone: "+91 90000 00000",
    });

    expect(payload.name).toBe("Acme Corp");
    expect(payload.code).toBe("ACME-01");
    expect(payload.legalName).toBe("Acme Corporation Pvt Ltd");
    expect(payload.registrationNumber).toBe("U72900MH2026PTC000001");
    expect(payload.taxId).toBe("27AAAAA0000A1Z5");
    expect(payload.isActive).toBe(true);
  });
});

describe("buildClonePayload", () => {
  it("creates a copy payload with suffixes", () => {
    const row = mapCompanyRecordToRow(sampleCompany);
    const payload = buildClonePayload(row);

    expect(payload.name).toContain("(Copy)");
    expect(payload.code).toBe("UAB-IND-COPY");
    expect(payload.isActive).toBe(true);
  });
});
