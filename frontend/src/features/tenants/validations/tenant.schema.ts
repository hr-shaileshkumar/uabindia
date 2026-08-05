import { z } from "zod";

export const tenantSchema = z.object({
  name: z.string().min(2, "Tenant name must be at least 2 characters").max(100),
  subdomain: z
    .string()
    .min(3, "Subdomain must be at least 3 characters")
    .max(63)
    .regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens are allowed"),
  adminName: z.string().min(2, "Admin name is required"),
  adminEmail: z.string().email("Invalid email address"),
  subscriptionPlan: z.enum(["Basic", "Premium", "Enterprise"]),
  status: z.enum(["active", "inactive", "suspended", "trial"]).default("trial"),
  contactNumber: z.string().optional(),
  timezone: z.string().default("UTC"),
  address: z.string().optional(),
  district: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  whiteLabelEnabled: z.boolean().default(false),
});

export type TenantFormValues = z.infer<typeof tenantSchema>;

export const tenantBulkActionSchema = z.object({
  tenantIds: z.array(z.string().uuid()),
  action: z.enum(["delete", "restore", "suspend", "activate"]),
});

export type TenantBulkAction = z.infer<typeof tenantBulkActionSchema>;
