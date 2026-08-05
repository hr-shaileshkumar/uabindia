"use client";

import { useState } from "react";
import { Lock, ShieldCheck, CheckCircle2, AlertTriangle, Key } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export default function PasswordPoliciesPage() {
  const [minLength, setMinLength] = useState(12);
  const [requireUppercase, setRequireUppercase] = useState(true);
  const [requireNumbers, setRequireNumbers] = useState(true);
  const [requireSymbols, setRequireSymbols] = useState(true);
  const [expiryDays, setExpiryDays] = useState(90);
  const [maxFailedAttempts, setMaxFailedAttempts] = useState(5);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Enterprise Password Security Policy"
        subtitle="Configure complexity rules, password expiration intervals, lockout thresholds, and historical reuse restrictions"
        breadcrumbs={[
          { label: "Security", href: "/security" },
          { label: "Password Policy" },
        ]}
        actions={
          <Button size="sm" className="gap-2">
            <Lock className="h-4 w-4" />
            Apply Password Policy
          </Button>
        }
      />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Password Complexity Requirements</CardTitle>
            <CardDescription className="text-xs">Enforce strong password composition rules</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="minL">Minimum Password Length (Characters)</Label>
              <Input id="minL" type="number" value={minLength} onChange={(e) => setMinLength(Number(e.target.value))} />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border">
              <div>
                <p className="font-semibold text-sm">Require Uppercase & Lowercase Letters</p>
                <p className="text-xs text-muted-foreground">Must contain A-Z and a-z</p>
              </div>
              <Switch checked={requireUppercase} onCheckedChange={setRequireUppercase} />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border">
              <div>
                <p className="font-semibold text-sm">Require Numeric Digits</p>
                <p className="text-xs text-muted-foreground">Must contain at least one number (0-9)</p>
              </div>
              <Switch checked={requireNumbers} onCheckedChange={setRequireNumbers} />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border">
              <div>
                <p className="font-semibold text-sm">Require Special Symbols</p>
                <p className="text-xs text-muted-foreground">Must contain symbols (!@#$%^&*)</p>
              </div>
              <Switch checked={requireSymbols} onCheckedChange={setRequireSymbols} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Expiration & Account Lockout Rules</CardTitle>
            <CardDescription className="text-xs">Protect accounts from brute-force attempts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="exp">Password Expiration Interval (Days)</Label>
              <Input id="exp" type="number" value={expiryDays} onChange={(e) => setExpiryDays(Number(e.target.value))} />
              <p className="text-[11px] text-muted-foreground">Users must change passwords every {expiryDays} days</p>
            </div>

            <div className="space-y-2 pt-2 border-t border-border">
              <Label htmlFor="fail">Max Failed Login Attempts Before Lockout</Label>
              <Input id="fail" type="number" value={maxFailedAttempts} onChange={(e) => setMaxFailedAttempts(Number(e.target.value))} />
              <p className="text-[11px] text-muted-foreground">Lock user account after {maxFailedAttempts} failed login attempts</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
