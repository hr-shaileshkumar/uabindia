"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { TenantSubscriptionForm } from "../forms/TenantSubscriptionForm";

interface SubscriptionDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantId: string;
}

export function SubscriptionDrawer({ open, onOpenChange, tenantId: _tenantId }: SubscriptionDrawerProps) {
  const handleSubmit = (data: Record<string, unknown>) => {
    console.log("Updating subscription:", data);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px] flex flex-col gap-0 p-0">
        <div className="px-6 py-4 border-b bg-indigo-50/50 dark:bg-indigo-900/10">
          <SheetHeader>
            <SheetTitle>Manage Subscription</SheetTitle>
            <SheetDescription>
              Adjust billing plans, limits, and entitlements.
            </SheetDescription>
          </SheetHeader>
        </div>
        <div className="flex-1 px-6 py-6 overflow-y-auto">
          <TenantSubscriptionForm onSubmit={handleSubmit} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
