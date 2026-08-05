"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useState } from "react";

interface AssignModuleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantName: string;
  onAssign: (moduleId: string) => void;
}

export function AssignModuleDialog({ open, onOpenChange, tenantName, onAssign }: AssignModuleDialogProps) {
  const [selectedModule, setSelectedModule] = useState("");

  const handleAssign = () => {
    if (selectedModule) {
      onAssign(selectedModule);
      onOpenChange(false);
      setSelectedModule("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Assign Module</DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Provision a new feature module for {tenantName}.
          </p>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="module">Available Modules</Label>
            <select 
              value={selectedModule} 
              onChange={(e) => setSelectedModule(e.target.value)}
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="" disabled>Select a module to provision</option>
              <option value="crm">CRM (Customer Relationship Management)</option>
              <option value="hr">HR & Payroll</option>
              <option value="inventory">Inventory & Logistics</option>
              <option value="finance">Finance & Accounting</option>
              <option value="ecommerce">E-Commerce Integration</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleAssign} disabled={!selectedModule}>Assign Module</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
