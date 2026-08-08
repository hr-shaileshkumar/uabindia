"use client";

import React, { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { ERPFormGrid, ERPFormField } from "@/components/ui/erp-form-grid";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SideDrawer } from "@/components/ui/side-drawer";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { platformApi } from "@/services/modules/platform";
import { Building2, Globe, Palette, UserPlus, Save, Mail, Shield } from "lucide-react";

export function TenantAdminSettingsManager() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [inviteDrawerOpen, setInviteDrawerOpen] = useState(false);
  const [inviting, setInviting] = useState(false);

  const [settings, setSettings] = useState({
    companyName: "",
    gstNumber: "",
    panNumber: "",
    logoUrl: "",
    currency: "INR",
    timezone: "Asia/Kolkata",
    dateFormat: "DD/MM/YYYY",
    themeColor: "#4f46e5",
    fiscalYearStart: "04-01",
    address: "",
    state: "",
    country: "India",
    postalCode: "",
    phone: "",
    email: "",
  });

  const [inviteForm, setInviteForm] = useState({
    email: "",
    fullName: "",
    role: "User",
    department: "",
  });

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await platformApi.adminSettings.get();
      if (res.data?.data) {
        setSettings((prev) => ({ ...prev, ...res.data.data }));
      }
    } catch (err: any) {
      notifyError(err?.message || "Failed to load tenant admin settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchSettings();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await platformApi.adminSettings.update(settings);
      
      // Update dynamic theme root color if set
      if (settings.themeColor) {
        document.documentElement.style.setProperty("--primary", settings.themeColor);
      }
      
      notifySuccess("Organization profile & localization settings updated successfully!");
    } catch (err: any) {
      notifyError(err?.message || "Failed to save organization settings.");
    } finally {
      setSaving(false);
    }
  };

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteForm.email) {
      notifyError("User email is required.");
      return;
    }

    try {
      setInviting(true);
      await platformApi.adminSettings.inviteUser(inviteForm);
      notifySuccess(`Invitation sent successfully to ${inviteForm.email}!`);
      setInviteDrawerOpen(false);
      setInviteForm({ email: "", fullName: "", role: "User", department: "" });
    } catch (err: any) {
      notifyError(err?.message || "Failed to send user invitation");
    } finally {
      setInviting(false);
    }
  };

  return (
    <AppShell
      title="Organization & Platform Settings"
      description="Manage company profile, tax IDs, localization standards, theme branding, and tenant staff invites"
      breadcrumbs={[{ label: "Admin", href: "/platform" }, { label: "Settings" }]}
      actions={
        <Button size="sm" onClick={() => setInviteDrawerOpen(true)} className="h-9 bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]">
          <UserPlus className="mr-1.5 h-4 w-4" />
          Invite User to Tenant
        </Button>
      }
    >
      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Company Profile */}
        <ERPFormGrid columns={2} title="Company Identity & Profile">
          <ERPFormField label="Organization / Company Name" required colSpan={2}>
            <Input
              value={settings.companyName}
              onChange={(e) => setSettings((prev) => ({ ...prev, companyName: e.target.value }))}
              placeholder="UABIndia Enterprise Pvt Ltd"
              required
            />
          </ERPFormField>

          <ERPFormField label="Company Logo Image URL">
            <Input
              value={settings.logoUrl || ""}
              onChange={(e) => setSettings((prev) => ({ ...prev, logoUrl: e.target.value }))}
              placeholder="https://cdn.uabindia.local/logos/company.png"
            />
          </ERPFormField>

          <ERPFormField label="Theme Accent Color (HEX)">
            <div className="flex gap-2">
              <Input
                type="color"
                value={settings.themeColor || "#4f46e5"}
                onChange={(e) => setSettings((prev) => ({ ...prev, themeColor: e.target.value }))}
                className="w-12 h-10 p-1 border-[var(--border-subtle)] cursor-pointer"
              />
              <Input
                value={settings.themeColor || "#4f46e5"}
                onChange={(e) => setSettings((prev) => ({ ...prev, themeColor: e.target.value }))}
                className="flex-1 font-mono uppercase"
              />
            </div>
          </ERPFormField>

          <ERPFormField label="GSTIN Number">
            <Input
              value={settings.gstNumber || ""}
              onChange={(e) => setSettings((prev) => ({ ...prev, gstNumber: e.target.value }))}
              placeholder="27AAACU123411Z5"
              className="uppercase"
            />
          </ERPFormField>

          <ERPFormField label="PAN Number">
            <Input
              value={settings.panNumber || ""}
              onChange={(e) => setSettings((prev) => ({ ...prev, panNumber: e.target.value }))}
              placeholder="AAACU1234F"
              className="uppercase"
            />
          </ERPFormField>
        </ERPFormGrid>

        {/* Localization & Regional */}
        <ERPFormGrid columns={3} title="Regional & Localization Standards">
          <ERPFormField label="Base Currency">
            <Select value={settings.currency} onValueChange={(val) => setSettings((prev) => ({ ...prev, currency: val }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select Currency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="INR">INR (₹ - Indian Rupee)</SelectItem>
                <SelectItem value="USD">USD ($ - US Dollar)</SelectItem>
                <SelectItem value="EUR">EUR (€ - Euro)</SelectItem>
                <SelectItem value="GBP">GBP (£ - British Pound)</SelectItem>
              </SelectContent>
            </Select>
          </ERPFormField>

          <ERPFormField label="Timezone">
            <Select value={settings.timezone} onValueChange={(val) => setSettings((prev) => ({ ...prev, timezone: val }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select Timezone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Asia/Kolkata">Asia/Kolkata (IST +5:30)</SelectItem>
                <SelectItem value="UTC">UTC (Coordinated Universal Time)</SelectItem>
                <SelectItem value="America/New_York">America/New_York (EST)</SelectItem>
                <SelectItem value="Europe/London">Europe/London (GMT)</SelectItem>
              </SelectContent>
            </Select>
          </ERPFormField>

          <ERPFormField label="Date Display Format">
            <Select value={settings.dateFormat} onValueChange={(val) => setSettings((prev) => ({ ...prev, dateFormat: val }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select Format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DD/MM/YYYY">DD/MM/YYYY (31/12/2026)</SelectItem>
                <SelectItem value="YYYY-MM-DD">YYYY-MM-DD (2026-12-31)</SelectItem>
                <SelectItem value="MM/DD/YYYY">MM/DD/YYYY (12/31/2026)</SelectItem>
              </SelectContent>
            </Select>
          </ERPFormField>
        </ERPFormGrid>

        {/* Registered Address & Communication */}
        <ERPFormGrid columns={2} title="Contact & Registered Address">
          <ERPFormField label="Official Contact Email">
            <Input
              type="email"
              value={settings.email || ""}
              onChange={(e) => setSettings((prev) => ({ ...prev, email: e.target.value }))}
              placeholder="contact@uabindia.local"
            />
          </ERPFormField>

          <ERPFormField label="Official Phone Number">
            <Input
              value={settings.phone || ""}
              onChange={(e) => setSettings((prev) => ({ ...prev, phone: e.target.value }))}
              placeholder="+91 9876543210"
            />
          </ERPFormField>

          <ERPFormField label="Street Address" colSpan={2}>
            <Input
              value={settings.address || ""}
              onChange={(e) => setSettings((prev) => ({ ...prev, address: e.target.value }))}
              placeholder="Building No, Street Name, Tech Park"
            />
          </ERPFormField>

          <ERPFormField label="State">
            <Input
              value={settings.state || ""}
              onChange={(e) => setSettings((prev) => ({ ...prev, state: e.target.value }))}
              placeholder="Maharashtra"
            />
          </ERPFormField>

          <ERPFormField label="Postal Code / Pincode">
            <Input
              value={settings.postalCode || ""}
              onChange={(e) => setSettings((prev) => ({ ...prev, postalCode: e.target.value }))}
              placeholder="400001"
            />
          </ERPFormField>
        </ERPFormGrid>

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={saving} className="bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] min-w-36 h-10">
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </form>

      {/* User Invite Drawer */}
      <SideDrawer
        open={inviteDrawerOpen}
        onClose={() => setInviteDrawerOpen(false)}
        title="Invite Sub-Admin or Staff User"
        subtitle="Grant access to team members within your organization tenant"
      >
        <form onSubmit={handleInviteUser} className="space-y-4 p-1">
          <ERPFormGrid columns={1}>
            <ERPFormField label="Work Email Address" required>
              <Input
                type="email"
                placeholder="colleague@uabindia.local"
                value={inviteForm.email}
                onChange={(e) => setInviteForm((prev) => ({ ...prev, email: e.target.value }))}
                required
              />
            </ERPFormField>

            <ERPFormField label="Full Name">
              <Input
                placeholder="Alex Smith"
                value={inviteForm.fullName}
                onChange={(e) => setInviteForm((prev) => ({ ...prev, fullName: e.target.value }))}
              />
            </ERPFormField>

            <ERPFormField label="Tenant Access Role">
              <Select value={inviteForm.role} onValueChange={(val) => setInviteForm((prev) => ({ ...prev, role: val }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Admin">Tenant Admin</SelectItem>
                  <SelectItem value="Manager">Department Manager</SelectItem>
                  <SelectItem value="User">Standard User</SelectItem>
                </SelectContent>
              </Select>
            </ERPFormField>
          </ERPFormGrid>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border-subtle)]">
            <Button variant="outline" type="button" onClick={() => setInviteDrawerOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={inviting} className="bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]">
              {inviting ? "Sending Invite..." : "Send Invitation"}
            </Button>
          </div>
        </form>
      </SideDrawer>
    </AppShell>
  );
}

export default TenantAdminSettingsManager;
