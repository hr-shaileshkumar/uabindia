"use client";

import React, { useEffect, useState } from "react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { ERPFormGrid, ERPFormField } from "@/components/ui/form-grid";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SideDrawer } from "@/components/ui/side-drawer";
import {
  erpButtonClassName,
  erpPanelClassName,
  erpPanelBodyClassName,
  erpPanelHeaderClassName,
  erpPanelTitleClassName,
} from "@/components/workspace/styles";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { platformApi } from "@/services/modules/platform";
import { Save, UserPlus } from "lucide-react";

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
    themeColor: "#0f172a",
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
    } catch (err: unknown) {
      notifyError(err instanceof Error ? err.message : "Failed to load organization settings");
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
      notifySuccess("Organization settings saved.");
    } catch (err: unknown) {
      notifyError(err instanceof Error ? err.message : "Failed to save settings.");
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
      notifySuccess(`Invitation sent to ${inviteForm.email}.`);
      setInviteDrawerOpen(false);
      setInviteForm({ email: "", fullName: "", role: "User", department: "" });
    } catch (err: unknown) {
      notifyError(err instanceof Error ? err.message : "Failed to send invitation");
    } finally {
      setInviting(false);
    }
  };

  return (
    <>
      <StandardPageLayout
        title="Organization settings"
        subtitle="Company profile, localization, and tenant user invitations."
        eyebrow="Platform / Settings"
        actions={
          <button type="button" onClick={() => setInviteDrawerOpen(true)} className={erpButtonClassName.primary}>
            <UserPlus className="h-4 w-4" />
            Invite user
          </button>
        }
      >
        <form onSubmit={handleSaveSettings} className="space-y-5">
          <section className={erpPanelClassName}>
            <div className={erpPanelHeaderClassName}>
              <h2 className={erpPanelTitleClassName}>Company identity</h2>
            </div>
            <div className={`${erpPanelBodyClassName} space-y-4`}>
              <ERPFormGrid columns={2}>
                <ERPFormField label="Organization name" required colSpan={2}>
                  <Input
                    value={settings.companyName}
                    onChange={(e) => setSettings((prev) => ({ ...prev, companyName: e.target.value }))}
                    placeholder="UABIndia Enterprise Pvt Ltd"
                    disabled={loading}
                    required
                  />
                </ERPFormField>

                <ERPFormField label="Logo URL">
                  <Input
                    value={settings.logoUrl || ""}
                    onChange={(e) => setSettings((prev) => ({ ...prev, logoUrl: e.target.value }))}
                    placeholder="https://cdn.example.com/logo.png"
                    disabled={loading}
                  />
                </ERPFormField>

                <ERPFormField label="Accent color">
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={settings.themeColor || "#0f172a"}
                      onChange={(e) => setSettings((prev) => ({ ...prev, themeColor: e.target.value }))}
                      className="h-10 w-12 cursor-pointer p-1"
                      disabled={loading}
                    />
                    <Input
                      value={settings.themeColor || "#0f172a"}
                      onChange={(e) => setSettings((prev) => ({ ...prev, themeColor: e.target.value }))}
                      className="flex-1 font-mono uppercase"
                      disabled={loading}
                    />
                  </div>
                </ERPFormField>

                <ERPFormField label="GSTIN">
                  <Input
                    value={settings.gstNumber || ""}
                    onChange={(e) => setSettings((prev) => ({ ...prev, gstNumber: e.target.value }))}
                    placeholder="27AAACU123411Z5"
                    className="uppercase"
                    disabled={loading}
                  />
                </ERPFormField>

                <ERPFormField label="PAN">
                  <Input
                    value={settings.panNumber || ""}
                    onChange={(e) => setSettings((prev) => ({ ...prev, panNumber: e.target.value }))}
                    placeholder="AAACU1234F"
                    className="uppercase"
                    disabled={loading}
                  />
                </ERPFormField>
              </ERPFormGrid>
            </div>
          </section>

          <section className={erpPanelClassName}>
            <div className={erpPanelHeaderClassName}>
              <h2 className={erpPanelTitleClassName}>Localization</h2>
            </div>
            <div className={erpPanelBodyClassName}>
              <ERPFormGrid columns={3}>
                <ERPFormField label="Currency">
                  <Select value={settings.currency} onValueChange={(val) => setSettings((prev) => ({ ...prev, currency: val }))} disabled={loading}>
                    <SelectTrigger>
                      <SelectValue placeholder="Currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INR">INR (₹)</SelectItem>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                    </SelectContent>
                  </Select>
                </ERPFormField>

                <ERPFormField label="Timezone">
                  <Select value={settings.timezone} onValueChange={(val) => setSettings((prev) => ({ ...prev, timezone: val }))} disabled={loading}>
                    <SelectTrigger>
                      <SelectValue placeholder="Timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Asia/Kolkata">Asia/Kolkata (IST)</SelectItem>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="America/New_York">America/New_York</SelectItem>
                      <SelectItem value="Europe/London">Europe/London</SelectItem>
                    </SelectContent>
                  </Select>
                </ERPFormField>

                <ERPFormField label="Date format">
                  <Select value={settings.dateFormat} onValueChange={(val) => setSettings((prev) => ({ ...prev, dateFormat: val }))} disabled={loading}>
                    <SelectTrigger>
                      <SelectValue placeholder="Format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                    </SelectContent>
                  </Select>
                </ERPFormField>
              </ERPFormGrid>
            </div>
          </section>

          <section className={erpPanelClassName}>
            <div className={erpPanelHeaderClassName}>
              <h2 className={erpPanelTitleClassName}>Contact & address</h2>
            </div>
            <div className={erpPanelBodyClassName}>
              <ERPFormGrid columns={2}>
                <ERPFormField label="Contact email">
                  <Input
                    type="email"
                    value={settings.email || ""}
                    onChange={(e) => setSettings((prev) => ({ ...prev, email: e.target.value }))}
                    placeholder="contact@company.com"
                    disabled={loading}
                  />
                </ERPFormField>

                <ERPFormField label="Phone">
                  <Input
                    value={settings.phone || ""}
                    onChange={(e) => setSettings((prev) => ({ ...prev, phone: e.target.value }))}
                    placeholder="+91 9876543210"
                    disabled={loading}
                  />
                </ERPFormField>

                <ERPFormField label="Street address" colSpan={2}>
                  <Input
                    value={settings.address || ""}
                    onChange={(e) => setSettings((prev) => ({ ...prev, address: e.target.value }))}
                    placeholder="Building, street, area"
                    disabled={loading}
                  />
                </ERPFormField>

                <ERPFormField label="State">
                  <Input
                    value={settings.state || ""}
                    onChange={(e) => setSettings((prev) => ({ ...prev, state: e.target.value }))}
                    placeholder="Maharashtra"
                    disabled={loading}
                  />
                </ERPFormField>

                <ERPFormField label="Postal code">
                  <Input
                    value={settings.postalCode || ""}
                    onChange={(e) => setSettings((prev) => ({ ...prev, postalCode: e.target.value }))}
                    placeholder="400001"
                    disabled={loading}
                  />
                </ERPFormField>
              </ERPFormGrid>
            </div>
          </section>

          <div className="flex justify-end">
            <button type="submit" disabled={saving || loading} className={erpButtonClassName.primary}>
              <Save className="h-4 w-4" />
              {saving ? "Saving…" : "Save settings"}
            </button>
          </div>
        </form>
      </StandardPageLayout>

      <SideDrawer
        open={inviteDrawerOpen}
        onClose={() => setInviteDrawerOpen(false)}
        title="Invite user"
        subtitle="Grant access to a team member in this tenant"
      >
        <form onSubmit={handleInviteUser} className="space-y-4 p-1">
          <ERPFormGrid columns={1}>
            <ERPFormField label="Work email" required>
              <Input
                type="email"
                placeholder="colleague@company.com"
                value={inviteForm.email}
                onChange={(e) => setInviteForm((prev) => ({ ...prev, email: e.target.value }))}
                required
              />
            </ERPFormField>

            <ERPFormField label="Full name">
              <Input
                placeholder="Alex Smith"
                value={inviteForm.fullName}
                onChange={(e) => setInviteForm((prev) => ({ ...prev, fullName: e.target.value }))}
              />
            </ERPFormField>

            <ERPFormField label="Role">
              <Select value={inviteForm.role} onValueChange={(val) => setInviteForm((prev) => ({ ...prev, role: val }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Admin">Tenant admin</SelectItem>
                  <SelectItem value="Manager">Manager</SelectItem>
                  <SelectItem value="User">Standard user</SelectItem>
                </SelectContent>
              </Select>
            </ERPFormField>
          </ERPFormGrid>

          <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
            <Button variant="outline" type="button" onClick={() => setInviteDrawerOpen(false)}>
              Cancel
            </Button>
            <button type="submit" disabled={inviting} className={erpButtonClassName.primary}>
              {inviting ? "Sending…" : "Send invitation"}
            </button>
          </div>
        </form>
      </SideDrawer>
    </>
  );
}

export default TenantAdminSettingsManager;
