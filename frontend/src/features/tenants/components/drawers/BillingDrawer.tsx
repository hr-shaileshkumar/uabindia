"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

interface BillingDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantId: string;
}

export function BillingDrawer({ open, onOpenChange, tenantId }: BillingDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px] p-0 flex flex-col">
        <div className="px-6 py-4 border-b">
          <SheetHeader>
            <SheetTitle>Billing & Invoices</SheetTitle>
            <SheetDescription>Payment history and methods for {tenantId}</SheetDescription>
          </SheetHeader>
        </div>
        <div className="flex-1 p-6 space-y-6">
          <div className="p-4 border rounded-md text-sm text-center text-muted-foreground bg-slate-50 dark:bg-slate-900/50">
            Billing history will be implemented here, potentially integrating with Stripe or a similar payment gateway.
          </div>
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
