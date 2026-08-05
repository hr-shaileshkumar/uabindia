"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ActivateTenantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantName: string;
  onConfirm: () => void;
}

export function ActivateTenantDialog({ open, onOpenChange, tenantName, onConfirm }: ActivateTenantDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reactivate Tenant Account?</DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            You are about to reactivate <strong>{tenantName}</strong>. 
            All users will regain access and normal operations will resume.
          </p>
        </DialogHeader>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={onConfirm} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            Reactivate
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
