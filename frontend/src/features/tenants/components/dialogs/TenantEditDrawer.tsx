"use client";

import { useState, useEffect } from "react";
import { SideDrawer } from "@/components/ui/side-drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { notifySuccess, notifyError } from "@/lib/notifications";
import { useUpdateTenant } from "../../hooks/useTenants";
import type { Tenant } from "../../types";

interface TenantEditDrawerProps {
  open: boolean;
  onClose: () => void;
  tenant: Tenant | null;
  onSuccess?: () => void;
}

export function TenantEditDrawer({ open, onClose, tenant, onSuccess }: TenantEditDrawerProps) {
  const updateMutation = useUpdateTenant();

  const [formData, setFormData] = useState({
    name: "",
    subdomain: "",
    adminName: "",
    adminEmail: "",
    status: "active" as "active" | "inactive" | "suspended" | "trial",
    subscriptionPlan: "Enterprise" as "Enterprise" | "Basic" | "Premium",
    contactNumber: "",
    address: "",
  });

  useEffect(() => {
    if (tenant) {
      setFormData({
        name: tenant.name || "",
        subdomain: tenant.subdomain || "",
        adminName: tenant.adminName || "",
        adminEmail: tenant.adminEmail || "",
        status: (tenant.status as any) || "active",
        subscriptionPlan: (tenant.subscriptionPlan as any) || "Enterprise",
        contactNumber: tenant.contactNumber || "",
        address: tenant.address || "",
      });
    }
  }, [tenant]);

  if (!tenant) return null;

  const handleSave = async () => {
    if (!formData.name || !formData.subdomain) {
      notifyError("Tenant name and subdomain are required.");
      return;
    }

    try {
      await updateMutation.mutateAsync({
        id: tenant.id,
        data: {
          name: formData.name,
          subdomain: formData.subdomain,
          adminName: formData.adminName,
          adminEmail: formData.adminEmail,
          status: formData.status,
          subscriptionPlan: formData.subscriptionPlan,
          contactNumber: formData.contactNumber,
          address: formData.address,
        },
      });

      notifySuccess(`Tenant "${formData.name}" updated successfully.`);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      notifyError("Failed to update tenant details.");
    }
  };

  return (
    <SideDrawer
      open={open}
      onClose={onClose}
      title={`Edit Tenant: ${tenant.name}`}
      subtitle="Modify SaaS tenant properties, admin credentials, contact info, and subscription tier"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="tenantName">Tenant Organization Name *</Label>
          <Input
            id="tenantName"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Acme Logistics Corp"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="subdomain">Tenant Subdomain *</Label>
          <Input
            id="subdomain"
            value={formData.subdomain}
            onChange={(e) => setFormData({ ...formData, subdomain: e.target.value })}
            placeholder="e.g. acme"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="adminName">Admin Contact Name</Label>
            <Input
              id="adminName"
              value={formData.adminName}
              onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
              placeholder="e.g. John Doe"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="adminEmail">Admin Email</Label>
            <Input
              id="adminEmail"
              type="email"
              value={formData.adminEmail}
              onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
              placeholder="e.g. admin@acme.com"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="status">Account Status</Label>
            <select
              id="status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="trial">Trial</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="plan">Subscription Tier</Label>
            <select
              id="plan"
              value={formData.subscriptionPlan}
              onChange={(e) => setFormData({ ...formData, subscriptionPlan: e.target.value as any })}
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="Basic">Basic Plan</option>
              <option value="Enterprise">Enterprise Plan</option>
              <option value="Premium">Premium Plan</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="contact">Contact Phone Number</Label>
          <Input
            id="contact"
            value={formData.contactNumber}
            onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
            placeholder="e.g. +91 9876543210"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Registered Office Address</Label>
          <Input
            id="address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="e.g. 101 Corporate Towers, Financial District"
          />
        </div>
      </div>
    </SideDrawer>
  );
}
