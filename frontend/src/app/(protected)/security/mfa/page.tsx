"use client";

import { useState } from "react";
import { Smartphone, Key, ShieldCheck, CheckCircle2, AlertTriangle, Lock, RefreshCw, QrCode } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function MfaPage() {
  const [enforceSuperAdmin, setEnforceSuperAdmin] = useState(true);
  const [enforceOrgAdmin, setEnforceOrgAdmin] = useState(true);
  const [enforceEmployees, setEnforceEmployees] = useState(false);
  const [allowSMS, setAllowSMS] = useState(true);
  const [allowTOTP, setAllowTOTP] = useState(true);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Multi-Factor Authentication (MFA)"
        subtitle="Configure 2FA enforcement policies, TOTP authenticator apps, WebAuthn hardware keys, and backup codes"
        breadcrumbs={[
          { label: "Security", href: "/security" },
          { label: "MFA Policy" },
        ]}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard title="Enforcement Status" value="Active" description="Required for Admins" icon={<ShieldCheck className="h-4 w-4 text-emerald-500" />} />
        <StatCard title="Enrolled Users" value="142 Users" description="TOTP Authenticator" icon={<Smartphone className="h-4 w-4 text-indigo-500" />} />
        <StatCard title="MFA Challenges Today" value="1,840" description="100% Passed" icon={<Key className="h-4 w-4 text-purple-500" />} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Enforcement by Role */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Enforcement Policy by Role</CardTitle>
            <CardDescription className="text-xs">Require 2FA authentication prior to granting access to workspace modules</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-sm">Super Admin & Platform Owners</p>
                <p className="text-xs text-muted-foreground">Mandatory 2FA challenge on every login</p>
              </div>
              <Switch checked={enforceSuperAdmin} onCheckedChange={setEnforceSuperAdmin} />
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-border">
              <div>
                <p className="font-semibold text-sm">Organization & Company Admins</p>
                <p className="text-xs text-muted-foreground">Mandatory 2FA for company configuration changes</p>
              </div>
              <Switch checked={enforceOrgAdmin} onCheckedChange={setEnforceOrgAdmin} />
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-border">
              <div>
                <p className="font-semibold text-sm">All Staff & Field Employees</p>
                <p className="text-xs text-muted-foreground">Optional or self-service enrollment</p>
              </div>
              <Switch checked={enforceEmployees} onCheckedChange={setEnforceEmployees} />
            </div>
          </CardContent>
        </Card>

        {/* Supported Authenticators */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Allowed Verification Methods</CardTitle>
            <CardDescription className="text-xs">Supported secondary authentication factors</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Smartphone className="h-5 w-5 text-indigo-500" />
                <div>
                  <p className="font-semibold text-sm">TOTP Authenticator Apps</p>
                  <p className="text-xs text-muted-foreground">Google Authenticator, Microsoft Authenticator, Authy</p>
                </div>
              </div>
              <Switch checked={allowTOTP} onCheckedChange={setAllowTOTP} />
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-border">
              <div className="flex items-center gap-3">
                <Key className="h-5 w-5 text-emerald-500" />
                <div>
                  <p className="font-semibold text-sm">SMS / Email OTP Verification</p>
                  <p className="text-xs text-muted-foreground">One-time passcode sent to registered mobile number</p>
                </div>
              </div>
              <Switch checked={allowSMS} onCheckedChange={setAllowSMS} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
