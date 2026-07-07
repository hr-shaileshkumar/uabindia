import { describe, expect, it, vi } from "vitest";
import { resolvePermissionAllowed, shouldBlockProtectedRoute } from "@/components/ProtectedRoute";

describe("ProtectedRoute helpers", () => {
  it("allows route when no permission keys are defined", () => {
    const hasPermission = vi.fn(() => false);
    const allowed = resolvePermissionAllowed([], hasPermission);

    expect(allowed).toBe(true);
    expect(hasPermission).not.toHaveBeenCalled();
  });

  it("uses hasPermission when permission keys exist", () => {
    const hasPermission = vi.fn(() => true);
    const allowed = resolvePermissionAllowed(["module:hrms"], hasPermission);

    expect(allowed).toBe(true);
    expect(hasPermission).toHaveBeenCalledWith(["module:hrms"]);
  });

  it("blocks non-super-admin when permissions fetch fails", () => {
    const blocked = shouldBlockProtectedRoute(false, true, false, true);
    expect(blocked).toBe(true);
  });

  it("does not block super-admin on permission fetch failure", () => {
    const blocked = shouldBlockProtectedRoute(false, true, true, false);
    expect(blocked).toBe(false);
  });

  it("does not block while loading regardless of flags", () => {
    const blocked = shouldBlockProtectedRoute(true, true, false, false);
    expect(blocked).toBe(false);
  });
});
