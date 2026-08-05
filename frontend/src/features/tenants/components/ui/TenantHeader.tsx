"use client";

import { ReactNode } from "react";
import { TenantBreadcrumb } from "./TenantBreadcrumb";
import { TenantStatusBadge, type TenantStatus } from "./TenantStatusBadge";
import { TenantAvatar } from "./TenantAvatar";

interface TenantHeaderProps {
  id: string;
  name: string;
  status: TenantStatus;
  subdomain: string;
  logoUrl?: string;
  actions?: ReactNode;
}

export function TenantHeader({ id, name, status, subdomain, logoUrl, actions }: TenantHeaderProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between pb-6 border-b border-border/50">
      <div className="space-y-4">
        <TenantBreadcrumb
          items={[
            { label: "Tenants", href: "/platform/tenants" },
            { label: name },
          ]}
        />
        <div className="flex items-center gap-4">
          <TenantAvatar name={name} imageUrl={logoUrl} size="lg" />
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">{name}</h1>
              <TenantStatusBadge status={status} />
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                {subdomain}.example.com
              </span>
              <span>ID: {id}</span>
            </div>
          </div>
        </div>
      </div>
      {actions && (
        <div className="flex items-center gap-2 md:self-end">
          {actions}
        </div>
      )}
    </div>
  );
}
