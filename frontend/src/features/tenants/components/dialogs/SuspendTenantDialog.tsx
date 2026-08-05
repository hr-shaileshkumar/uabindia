"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface SuspendTenantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantName: string;
  onConfirm: () => void;
}

export function SuspendTenantDialog({ open, onOpenChange, tenantName, onConfirm }: SuspendTenantDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Suspend Tenant Account?</DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Are you sure you want to suspend <strong>{tenantName}</strong>? 
            Users belonging to this tenant will immediately lose access to the system. Billing will remain active unless explicitly canceled.
          </p>
        </DialogHeader>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={onConfirm} className="bg-amber-600 hover:bg-amber-700 text-white">
            Suspend
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
