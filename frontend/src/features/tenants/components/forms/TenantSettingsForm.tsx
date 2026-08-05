"use client";

import { useForm, SubmitHandler, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

const schema = z.object({
  timezone: z.string().min(1, "Timezone is required"),
  dateFormat: z.string().min(1, "Date format is required"),
  timeFormat: z.enum(["12h", "24h"]),
  enforce2FA: z.boolean().default(false),
  sessionTimeout: z.string(),
});

type FormData = z.infer<typeof schema>;

interface TenantSettingsFormProps {
  initialData?: Partial<FormData>;
  onSubmit: (data: FormData) => void;
  isSubmitting?: boolean;
}

export function TenantSettingsForm({ initialData, onSubmit, isSubmitting }: TenantSettingsFormProps) {
  const { handleSubmit, setValue, control } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      timezone: initialData?.timezone || "UTC",
      dateFormat: initialData?.dateFormat || "MM/DD/YYYY",
      timeFormat: initialData?.timeFormat || "12h",
      enforce2FA: initialData?.enforce2FA || false,
      sessionTimeout: initialData?.sessionTimeout || "30",
    },
  });

  const timezone = useWatch({ control, name: "timezone" });
  const dateFormat = useWatch({ control, name: "dateFormat" });
  const timeFormat = useWatch({ control, name: "timeFormat" });
  const enforce2FA = useWatch({ control, name: "enforce2FA" });
  const sessionTimeout = useWatch({ control, name: "sessionTimeout" });

  const submitHandler: SubmitHandler<FormData> = (data) => onSubmit(data);

  return (
    <form onSubmit={handleSubmit(submitHandler)} className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label>Timezone</Label>
          <select 
            value={timezone} 
            onChange={(e) => setValue("timezone", e.target.value)}
            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="UTC">UTC (Coordinated Universal Time)</option>
            <option value="America/New_York">Eastern Time (US & Canada)</option>
            <option value="America/Chicago">Central Time (US & Canada)</option>
            <option value="America/Los_Angeles">Pacific Time (US & Canada)</option>
            <option value="Asia/Kolkata">India Standard Time (IST)</option>
            <option value="Europe/London">London</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label>Session Timeout (Minutes)</Label>
          <select 
            value={sessionTimeout} 
            onChange={(e) => setValue("sessionTimeout", e.target.value)}
            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="15">15 Minutes</option>
            <option value="30">30 Minutes</option>
            <option value="60">1 Hour</option>
            <option value="120">2 Hours</option>
            <option value="480">8 Hours</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label>Date Format</Label>
          <select 
            value={dateFormat} 
            onChange={(e) => setValue("dateFormat", e.target.value)}
            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="MM/DD/YYYY">MM/DD/YYYY (US)</option>
            <option value="DD/MM/YYYY">DD/MM/YYYY (UK/EU)</option>
            <option value="YYYY-MM-DD">YYYY-MM-DD (ISO)</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label>Time Format</Label>
          <select 
            value={timeFormat} 
            onChange={(e) => setValue("timeFormat", e.target.value as "12h" | "24h")}
            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="12h">12-Hour (AM/PM)</option>
            <option value="24h">24-Hour</option>
          </select>
        </div>
      </div>

      <div className="pt-4 border-t border-border">
        <h3 className="text-sm font-medium mb-4">Security Policies</h3>
        <div className="flex items-start space-x-3 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-md border">
          <Checkbox 
            id="enforce2FA" 
            checked={enforce2FA} 
            onCheckedChange={(c) => setValue("enforce2FA", !!c)} 
            className="mt-1"
          />
          <div className="space-y-1">
            <Label htmlFor="enforce2FA" className="font-medium text-sm">
              Enforce Two-Factor Authentication
            </Label>
            <p className="text-xs text-muted-foreground">
              Require all users in this tenant to set up 2FA before they can log in.
            </p>
          </div>
        </div>
      </div>

      <div className="pt-4 flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </form>
  );
}
