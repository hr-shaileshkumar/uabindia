"use client";

import { useForm, useWatch, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

const schema = z.object({
  logoUrl: z.string().url().optional().or(z.literal("")),
  faviconUrl: z.string().url().optional().or(z.literal("")),
  primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, "Must be a valid hex color").optional().or(z.literal("")),
  removeTenantBranding: z.boolean().default(false),
});

type FormData = z.infer<typeof schema>;

interface TenantBrandingFormProps {
  initialData?: Partial<FormData>;
  onSubmit: (data: FormData) => void;
  isSubmitting?: boolean;
}

export function TenantBrandingForm({ initialData, onSubmit, isSubmitting }: TenantBrandingFormProps) {
  const { register, handleSubmit, setValue, control, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      logoUrl: initialData?.logoUrl || "",
      faviconUrl: initialData?.faviconUrl || "",
      primaryColor: initialData?.primaryColor || "#4f46e5",
      removeTenantBranding: initialData?.removeTenantBranding || false,
    },
  });

  const primaryColor = useWatch({ control, name: "primaryColor" });
  const removeTenantBranding = useWatch({ control, name: "removeTenantBranding" });

  const submitHandler: SubmitHandler<FormData> = (data) => onSubmit(data);

  return (
    <form onSubmit={handleSubmit(submitHandler)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="logoUrl">Logo URL</Label>
        <Input id="logoUrl" placeholder="https://example.com/logo.png" {...register("logoUrl")} />
        {errors.logoUrl && <p className="text-xs text-red-500">{errors.logoUrl.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="faviconUrl">Favicon URL</Label>
        <Input id="faviconUrl" placeholder="https://example.com/favicon.ico" {...register("faviconUrl")} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="primaryColor">Primary Color (Hex)</Label>
        <div className="flex items-center gap-3">
          <Input 
            id="colorPicker" 
            type="color" 
            className="w-12 h-10 p-1 cursor-pointer"
            value={primaryColor} 
            onChange={(e) => setValue("primaryColor", e.target.value)}
          />
          <Input id="primaryColor" placeholder="#4f46e5" {...register("primaryColor")} className="flex-1" />
        </div>
        {errors.primaryColor && <p className="text-xs text-red-500">{errors.primaryColor.message}</p>}
      </div>
      <div className="flex items-center space-x-2 pt-2">
        <Checkbox 
          id="removeTenantBranding" 
          checked={removeTenantBranding} 
          onCheckedChange={(c) => setValue("removeTenantBranding", !!c)} 
        />
        <Label htmlFor="removeTenantBranding" className="font-normal text-sm">
          Remove &quot;Powered by ERP&quot; branding (White-label feature)
        </Label>
      </div>
      <div className="pt-4 flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save Branding"}
        </Button>
      </div>
    </form>
  );
}
