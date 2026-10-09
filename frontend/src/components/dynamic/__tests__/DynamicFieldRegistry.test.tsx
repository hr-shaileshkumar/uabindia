import { describe, it, expect } from "vitest";
import {
  cleanFieldLabel,
  maskFieldValue,
} from "../DynamicFieldRegistry";

describe("DynamicFieldRegistry Utility & Masking Engine", () => {
  describe("cleanFieldLabel", () => {
    it("cleans statutory abbreviations and underscores", () => {
      expect(cleanFieldLabel("official_pan_number")).toBe("official PAN number");
      expect(cleanFieldLabel("vendor_gst_in")).toBe("vendor GST in");
      expect(cleanFieldLabel("bank_ifsc_code")).toBe("bank IFSC code");
      expect(cleanFieldLabel("user_id")).toBe("user ID");
      expect(cleanFieldLabel("hr_policy")).toBe("HR policy");
    });

    it("handles empty or falsy inputs gracefully", () => {
      expect(cleanFieldLabel("")).toBe("");
    });
  });

  describe("maskFieldValue", () => {
    it("handles 'full' masking", () => {
      expect(maskFieldValue("secret123", "full")).toBe("••••••••");
    });

    it("handles 'lastFour' masking for account or card numbers", () => {
      expect(maskFieldValue("123456789012", "lastFour")).toBe("•••• •••• 9012");
      expect(maskFieldValue("1234", "lastFour")).toBe("••••");
    });

    it("handles 'partial' masking for email addresses", () => {
      const masked = maskFieldValue("finance@uabindia.com", "partial");
      expect(masked).toBe("fi••••@uabindia.com");
    });

    it("returns raw string for 'none' or missing maskType", () => {
      expect(maskFieldValue("public_value", "none")).toBe("public_value");
      expect(maskFieldValue("normal_value")).toBe("normal_value");
    });

    it("handles null, undefined, and empty string safely", () => {
      expect(maskFieldValue(null, "full")).toBe("");
      expect(maskFieldValue(undefined, "lastFour")).toBe("");
      expect(maskFieldValue("", "partial")).toBe("");
    });
  });
});
