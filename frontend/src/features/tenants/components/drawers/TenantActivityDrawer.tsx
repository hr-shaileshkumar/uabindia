"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { TenantActivity } from "../feed/TenantActivity";

interface TenantActivityDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantId: string;
}

export function TenantActivityDrawer({ open, onOpenChange, tenantId }: TenantActivityDrawerProps) {
  // Mock data for scaffolding
  const mockActivities = [
    { id: "1", type: "user" as const, message: "logged into the system", timestamp: "2 hours ago", actor: "John Admin" },
    { id: "2", type: "system" as const, message: "System backup completed", timestamp: "5 hours ago" },
    { id: "3", type: "billing" as const, message: "Invoice INV-001 paid successfully", timestamp: "1 day ago" },
    { id: "4", type: "security" as const, message: "Failed login attempt detected", timestamp: "2 days ago", actor: "Unknown IP" },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[400px] sm:w-[540px] p-0 flex flex-col h-full">
        <div className="px-6 py-4 border-b">
          <SheetHeader>
            <SheetTitle>Detailed Activity Log</SheetTitle>
            <SheetDescription>Full audit trail for Tenant {tenantId}</SheetDescription>
          </SheetHeader>
        </div>
        <div className="flex-1 p-6">
          <TenantActivity activities={mockActivities} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
