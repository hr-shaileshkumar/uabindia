"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Key, ShieldCheck, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface LicenseCardProps {
  licenseKey: string;
  status: "valid" | "expired" | "expiring_soon";
  issuedAt: string;
  expiresAt?: string;
  features: string[];
  onManage?: () => void;
  onRenew?: () => void;
}

export function LicenseCard({
  licenseKey,
  status,
  issuedAt,
  expiresAt,
  features,
  onManage,
  onRenew,
}: LicenseCardProps) {
  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">License Information</CardTitle>
          </div>
          <Badge 
            variant={status === "valid" ? "default" : status === "expiring_soon" ? "secondary" : "destructive"}
            className={status === "valid" ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100 shadow-none border-transparent" : 
                       status === "expiring_soon" ? "bg-amber-100 text-amber-800 hover:bg-amber-100 shadow-none border-transparent" : ""}
          >
            {status.replace("_", " ")}
          </Badge>
        </div>
        <CardDescription>Product licensing and entitlements</CardDescription>
      </CardHeader>
      
      <CardContent className="flex-1 space-y-6">
        <div className="space-y-1.5 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-md border">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">License Key</span>
          <span className="font-mono text-sm break-all select-all">{licenseKey}</span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground block">Issued Date</span>
            <span className="text-sm font-medium">{issuedAt}</span>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground block">Expiration Date</span>
            <span className="text-sm font-medium flex items-center gap-1.5">
              {status === "expiring_soon" ? <AlertTriangle className="h-3.5 w-3.5 text-amber-500" /> : null}
              {expiresAt || "Lifetime"}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-2">Included Features</span>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {features.map((feature, idx) => (
              <li key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                <ShieldCheck className="h-4 w-4 text-indigo-500 shrink-0" />
                <span className="truncate">{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
      
      <CardFooter className="pt-4 border-t flex items-center justify-end gap-2">
        {onManage && (
          <Button variant="outline" size="sm" onClick={onManage}>
            Manage License
          </Button>
        )}
        {onRenew && (
          <Button size="sm" onClick={onRenew} className={status === "expired" ? "bg-red-600 hover:bg-red-700" : ""}>
            Renew License
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
