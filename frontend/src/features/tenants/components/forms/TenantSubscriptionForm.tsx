"use client";

import { useForm, useWatch, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CreditCard, ShieldAlert } from "lucide-react";

const schema = z.object({
  plan: z.enum(["Free", "Starter", "Professional", "Enterprise"]),
  billingCycle: z.enum(["monthly", "yearly"]),
  licenseKey: z.string().optional(),
  maxUsers: z.coerce.number().min(1, "Must allow at least 1 user"),
});

type FormData = z.infer<typeof schema>;

interface TenantSubscriptionFormProps {
  initialData?: Partial<FormData>;
  onSubmit: (data: FormData) => void;
  isSubmitting?: boolean;
}

export function TenantSubscriptionForm({ initialData, onSubmit, isSubmitting }: TenantSubscriptionFormProps) {
  const { register, handleSubmit, setValue, control, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      plan: initialData?.plan || "Starter",
      billingCycle: initialData?.billingCycle || "monthly",
      licenseKey: initialData?.licenseKey || "",
      maxUsers: initialData?.maxUsers || 10,
    },
  });
  const plan = useWatch({ control, name: "plan" });
  const billingCycle = useWatch({ control, name: "billingCycle" });

  const submitHandler: SubmitHandler<FormData> = (data) => onSubmit(data);

  return (
    <form onSubmit={handleSubmit(submitHandler)} className="space-y-6">
      
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 rounded-md flex gap-3 text-amber-800 dark:text-amber-400">
        <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-sm font-medium">Subscription updates take effect immediately</p>
          <p className="text-xs opacity-90">Downgrading plans may result in restricted access to premium modules or features.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label>Subscription Plan</Label>
          <select 
            value={plan}
            onChange={(e) => setValue("plan", e.target.value as "Free" | "Starter" | "Professional" | "Enterprise")}
            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="Free">Free Trial</option>
            <option value="Starter">Starter</option>
            <option value="Professional">Professional</option>
            <option value="Enterprise">Enterprise</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label>Billing Cycle</Label>
          <select 
            value={billingCycle}
            onChange={(e) => setValue("billingCycle", e.target.value as "monthly" | "yearly")}
            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly (Save 20%)</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="maxUsers">Maximum Allowed Users</Label>
        <Input id="maxUsers" type="number" min="1" {...register("maxUsers")} />
        {errors.maxUsers && <p className="text-xs text-red-500">{errors.maxUsers.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="licenseKey">License Key (Optional overrides)</Label>
        <Input id="licenseKey" placeholder="e.g. XXXX-XXXX-XXXX-XXXX" className="font-mono text-sm" {...register("licenseKey")} />
        <p className="text-xs text-muted-foreground">Used for on-prem or custom entitlements.</p>
      </div>

      <div className="pt-4 flex justify-end gap-2">
        <Button type="button" variant="outline">
          <CreditCard className="mr-2 h-4 w-4" /> Manage Payment Method
        </Button>
        <Button type="submit" disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 text-white">
          {isSubmitting ? "Updating..." : "Update Subscription"}
        </Button>
      </div>
    </form>
  );
}
