"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2 } from "lucide-react";

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
  const [internalLoading, setInternalLoading] = useState(false);
  const isLoading = loading || internalLoading;

  const modalTitle = title || (isHardDelete ? "Permanently Delete Record" : "Delete Record");
  const modalDescription =
    description ||
    (isHardDelete
      ? `This action cannot be undone. Are you sure you want to permanently delete "${entityName || "this record"}"?`
      : `Are you sure you want to move "${entityName || "this record"}" to deleted items? It can be restored later.`);

  const handleConfirmClick = async () => {
    try {
      setInternalLoading(true);
      await onConfirm();
      onOpenChange(false);
    } catch {
      // In case onConfirm throws, state is reset gracefully
    } finally {
      setInternalLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => { if (!isLoading) onOpenChange(val); }}>
      <DialogContent className="sm:max-w-md bg-white border border-slate-200 shadow-2xl rounded-2xl p-6">
        <DialogHeader className="flex flex-row items-center gap-3.5 space-y-0">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 border border-rose-100/80 shadow-xs">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <DialogTitle className="text-base font-bold text-slate-900">{modalTitle}</DialogTitle>
            <DialogDescription className="mt-1 text-xs text-slate-500 leading-relaxed">
              {modalDescription}
            </DialogDescription>
          </div>
        </DialogHeader>

        <DialogFooter className="mt-6 flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="h-8.5 rounded-lg border border-slate-200 px-4 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirmClick}
            disabled={isLoading}
            className="h-8.5 inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-4 text-xs font-semibold text-white shadow-sm hover:bg-rose-700 disabled:opacity-50"
          >
            {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {isLoading ? "Deleting…" : isHardDelete ? "Delete Permanently" : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
