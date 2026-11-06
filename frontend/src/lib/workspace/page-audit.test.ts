import { describe, expect, it } from "vitest";
import { getPageAudit, listPagesByStatus, PRODUCTION_SMOKE_CHECKLIST } from "@/lib/workspace/page-audit";

describe("page-audit", () => {
  it("marks core cross-cutting routes as polished", () => {
    expect(getPageAudit("/notifications")?.status).toBe("polished");
    expect(getPageAudit("/approvals")?.status).toBe("polished");
    expect(getPageAudit("/documents")?.status).toBe("polished");
  });

  it("keeps non-product verticals as stubs", () => {
    const stubs = listPagesByStatus("stub").map((p) => p.route);
    expect(stubs).toContain("/healthcare");
    expect(stubs).toContain("/fleet");
  });

  it("exposes a non-empty smoke checklist", () => {
    expect(PRODUCTION_SMOKE_CHECKLIST.length).toBeGreaterThan(5);
  });
});
