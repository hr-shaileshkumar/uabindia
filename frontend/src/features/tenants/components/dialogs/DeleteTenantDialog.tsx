"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface DeleteTenantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantName: string;
  onConfirm: () => void;
}

export function DeleteTenantDialog({ open, onOpenChange, tenantName, onConfirm }: DeleteTenantDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Are you absolutely sure?</DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            This action cannot be undone. This will permanently delete the tenant
            <strong> {tenantName} </strong> and remove all associated data, users, and configurations from our servers.
          </p>
        </DialogHeader>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={onConfirm} className="bg-red-600 hover:bg-red-700 text-white">
            Yes, delete tenant
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
