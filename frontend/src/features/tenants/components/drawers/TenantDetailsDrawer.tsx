"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { TenantBasicForm } from "../forms/TenantBasicForm";

interface TenantDetailsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantId?: string; // If undefined, we're in "create" mode
}

export function TenantDetailsDrawer({ open, onOpenChange, tenantId }: TenantDetailsDrawerProps) {
  const handleSubmit = (data: Record<string, unknown>) => {
    console.log("Saving tenant details:", data);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px] flex flex-col gap-0 p-0">
        <div className="px-6 py-4 border-b border-border bg-slate-50/50 dark:bg-slate-900/50">
          <SheetHeader>
            <SheetTitle>{tenantId ? "Edit Tenant Details" : "Create New Tenant"}</SheetTitle>
            <SheetDescription>
              {tenantId 
                ? "Update core information for this tenant account." 
                : "Provision a new tenant workspace and admin account."}
            </SheetDescription>
          </SheetHeader>
        </div>
        <div className="flex-1 px-6 py-6 overflow-y-auto">
          <TenantBasicForm onSubmit={handleSubmit} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
