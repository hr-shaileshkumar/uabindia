"use client";

import { useState } from "react";
import { Key, Shield, CheckCircle2, Globe, Server, Plus, Edit2, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SideDrawer } from "@/components/ui/side-drawer";

export interface SSOProvider {
  id: string;
  name: string;
  protocol: "OAuth2 / OIDC" | "SAML 2.0" | "LDAP / Active Directory";
  issuerUrl: string;
  clientId: string;
  status: "Active" | "Configured" | "Disabled";
  userCount: number;
}

const INITIAL_SSO: SSOProvider[] = [
  { id: "1", name: "Microsoft Azure Active Directory (Entra ID)", protocol: "OAuth2 / OIDC", issuerUrl: "https://login.microsoftonline.com/tenant-id/v2.0", clientId: "azure-app-8901", status: "Active", userCount: 340 },
  { id: "2", name: "Google Workspace SAML SSO", protocol: "SAML 2.0", issuerUrl: "https://accounts.google.com/o/saml2?idpid=C0123", clientId: "google-saml-4421", status: "Active", userCount: 120 },
  { id: "3", name: "Corporate Active Directory (On-Premises)", protocol: "LDAP / Active Directory", issuerUrl: "ldap://ad.corp.uabindia.com:389", clientId: "service-account-ldap", status: "Configured", userCount: 85 },
];

export default function SsoPage() {
  const [providers, setProviders] = useState<SSOProvider[]>(INITIAL_SSO);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<SSOProvider | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    protocol: "OAuth2 / OIDC" as SSOProvider["protocol"],
    issuerUrl: "",
    clientId: "",
  });

  const handleOpenDrawer = (provider?: SSOProvider) => {
    if (provider) {
      setEditingProvider(provider);
      setFormData({ name: provider.name, protocol: provider.protocol, issuerUrl: provider.issuerUrl, clientId: provider.clientId });
    } else {
      setEditingProvider(null);
      setFormData({ name: "", protocol: "OAuth2 / OIDC", issuerUrl: "", clientId: "" });
    }
    setDrawerOpen(true);
  };

  const handleSave = () => {
    if (!formData.name || !formData.issuerUrl) return;
    if (editingProvider) {
      setProviders((prev) =>
        prev.map((p) => (p.id === editingProvider.id ? { ...p, ...formData } : p))
      );
    } else {
      const newP: SSOProvider = {
        id: String(Date.now()),
        ...formData,
        status: "Configured",
        userCount: 0,
      };
      setProviders((prev) => [newP, ...prev]);
    }
    setDrawerOpen(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Single Sign-On (SSO) & Identity Federation"
        subtitle="Manage OAuth2/OIDC, SAML 2.0, Azure AD Entra ID, Google Workspace, and LDAP Directory integration"
        breadcrumbs={[
          { label: "Security", href: "/security" },
          { label: "Single Sign-On" },
        ]}
        actions={
          <Button size="sm" className="gap-2" onClick={() => handleOpenDrawer()}>
            <Plus className="h-4 w-4" />
            Configure SSO Provider
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {providers.map((p) => (
          <Card key={p.id} className="hover:border-indigo-500/50 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-base font-semibold">{p.name}</CardTitle>
                  <CardDescription className="text-xs font-mono">{p.protocol}</CardDescription>
                </div>
                <Badge variant={p.status === "Active" ? "success" : "secondary"}>{p.status}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Client / App ID</span>
                <span className="font-mono text-foreground">{p.clientId}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Active Users Authenticated</span>
                <span className="font-semibold text-foreground">{p.userCount} Users</span>
              </div>
              <div className="pt-2 border-t border-border flex justify-end gap-2">
                <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => handleOpenDrawer(p)}>
                  <Edit2 className="h-3.5 w-3.5 mr-1" /> Edit Provider
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <SideDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editingProvider ? "Edit SSO Provider" : "New Identity Provider Setup"}
        subtitle="Configure OAuth2 or SAML metadata parameters"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDrawerOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save Provider</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ssoName">Identity Provider Name *</Label>
            <Input id="ssoName" placeholder="e.g. Azure AD Entra ID" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="issuer">Issuer URL / Authority *</Label>
            <Input id="issuer" placeholder="e.g. https://login.microsoftonline.com/..." value={formData.issuerUrl} onChange={(e) => setFormData({ ...formData, issuerUrl: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="client">Application Client ID *</Label>
            <Input id="client" placeholder="e.g. azure-app-client-id" value={formData.clientId} onChange={(e) => setFormData({ ...formData, clientId: e.target.value })} />
          </div>
        </div>
      </SideDrawer>
    </div>
  );
}
