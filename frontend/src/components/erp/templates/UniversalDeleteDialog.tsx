"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export interface UniversalDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  entityName?: string;
  description?: string;
  onConfirm: () => Promise<void> | void;
  loading?: boolean;
  isHardDelete?: boolean;
}

export function UniversalDeleteDialog({
  open,
  onOpenChange,
  title,
  entityName,
  description,
  onConfirm,
  loading = false,
  isHardDelete = false,
}: UniversalDeleteDialogProps) {
  const modalTitle = title || (isHardDelete ? "Permanently Delete Record" : "Delete Record");
  const modalDescription =
    description ||
    (isHardDelete
      ? `This action cannot be undone. Are you sure you want to permanently delete "${entityName || "this record"}"?`
      : `Are you sure you want to move "${entityName || "this record"}" to deleted items? It can be restored later.`);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="flex flex-row items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-400">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <DialogTitle className="text-lg font-bold">{modalTitle}</DialogTitle>
            <DialogDescription className="mt-1 text-xs text-slate-500">
              {modalDescription}
            </DialogDescription>
          </div>
        </DialogHeader>

        <DialogFooter className="mt-4 gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={async () => {
              await onConfirm();
              onOpenChange(false);
            }}
            disabled={loading}
          >
            {loading ? "Processing..." : isHardDelete ? "Delete Permanently" : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
