"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Globe, Shield, ExternalLink, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface DomainCardProps {
  customDomain?: string;
  subdomain: string;
  isVerified: boolean;
  sslStatus: "active" | "pending" | "failed";
  onManage?: () => void;
}

export function DomainCard({
  customDomain,
  subdomain,
  isVerified,
  sslStatus,
  onManage,
}: DomainCardProps) {
  
  const getBaseDomain = () => {
    if (typeof window === "undefined") return "uabindia.com";
    const hostname = window.location.hostname.toLowerCase();
    
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return "localhost";
    }
    if (hostname.endsWith(".localhost")) {
      return "localhost";
    }

    const parts = hostname.split(".");
    if (parts.length >= 2) {
      // Get the base domain, e.g. "uabindia.com" from "admin.uabindia.com"
      return parts.slice(-2).join(".");
    }
    
    return hostname;
  };

  const baseDomain = getBaseDomain();
  const defaultDomain = baseDomain === "localhost" 
    ? `${subdomain}.localhost`
    : `${subdomain}.${baseDomain}`;
  const primaryDomain = customDomain || defaultDomain;

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">Domain & Branding</CardTitle>
          </div>
          <Badge 
            variant={customDomain ? "default" : "secondary"}
            className={customDomain ? "bg-indigo-100 text-indigo-800 hover:bg-indigo-100 shadow-none border-transparent" : ""}
          >
            {customDomain ? "Custom Domain" : "Subdomain"}
          </Badge>
        </div>
        <CardDescription>Web access and SSL configuration</CardDescription>
      </CardHeader>
      
      <CardContent className="flex-1 space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">Primary Domain</span>
            <div className="flex items-center justify-between p-3 border rounded-md bg-slate-50 dark:bg-slate-900/50">
              <span className="font-medium">{primaryDomain}</span>
              <a 
                href={`https://${primaryDomain}`} 
                target="_blank" 
                rel="noreferrer"
                className="text-muted-foreground hover:text-indigo-600 transition-colors"
                title="Open in new tab"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
          
          {customDomain && (
            <div className="grid grid-cols-2 gap-4 p-4 rounded-md border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground block">Domain Verification</span>
                <span className="text-sm font-medium flex items-center gap-1.5">
                  {isVerified ? (
                    <><Check className="h-3.5 w-3.5 text-emerald-500" /> Verified</>
                  ) : (
                    <><Badge variant="outline" className="text-[10px] uppercase h-5">Pending</Badge></>
                  )}
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground block">SSL Certificate</span>
                <span className="text-sm font-medium flex items-center gap-1.5">
                  {sslStatus === "active" ? (
                    <><Shield className="h-3.5 w-3.5 text-emerald-500" /> Active</>
                  ) : sslStatus === "pending" ? (
                    <Badge variant="outline" className="text-[10px] uppercase h-5 text-amber-600 border-amber-200">Provisioning</Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] uppercase h-5 text-red-600 border-red-200">Failed</Badge>
                  )}
                </span>
              </div>
            </div>
          )}
          
          <div className="space-y-2">
             <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">Default Subdomain</span>
             <p className="text-sm text-muted-foreground">{defaultDomain}</p>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="pt-4 border-t flex items-center justify-end gap-2">
        {onManage && (
          <Button variant="outline" size="sm" onClick={onManage}>
            Domain Settings
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
