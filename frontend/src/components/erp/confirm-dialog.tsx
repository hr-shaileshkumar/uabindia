"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="px-4 py-4 sm:px-5">
          <p className="text-sm leading-6 text-slate-600">{description}</p>
        </div>
        <div className="flex flex-col-reverse justify-end gap-2 border-t border-slate-200 px-4 py-3 sm:flex-row sm:px-5">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => onOpenChange(false)}>Confirm</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
