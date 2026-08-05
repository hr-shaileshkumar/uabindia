"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Globe, AlertTriangle } from "lucide-react";

const schema = z.object({
  subdomain: z.string().min(3).regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens allowed"),
  customDomain: z.string().optional().or(z.literal("")),
});

type FormData = z.infer<typeof schema>;

interface TenantDomainFormProps {
  initialData?: Partial<FormData>;
  onSubmit: (data: FormData) => void;
  isSubmitting?: boolean;
}

export function TenantDomainForm({ initialData, onSubmit, isSubmitting }: TenantDomainFormProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      subdomain: initialData?.subdomain || "",
      customDomain: initialData?.customDomain || "",
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="subdomain">Subdomain *</Label>
        <div className="flex items-center">
          <Input 
            id="subdomain" 
            placeholder="my-company" 
            className="rounded-r-none border-r-0 focus-visible:z-10" 
            {...register("subdomain")} 
          />
          <div className="bg-muted px-3 py-2 border border-l-0 rounded-r-md text-sm text-muted-foreground whitespace-nowrap">
            .example.com
          </div>
        </div>
        {errors.subdomain && <p className="text-xs text-red-500">{errors.subdomain.message}</p>}
        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
          <AlertTriangle className="h-3 w-3" /> Changing subdomain affects login URLs immediately.
        </p>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="customDomain">Custom Domain</Label>
        <div className="relative">
          <Globe className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input id="customDomain" placeholder="app.mycompany.com" className="pl-9" {...register("customDomain")} />
        </div>
        <p className="text-xs text-muted-foreground">
          Leave blank to use the default subdomain. Requires DNS verification.
        </p>
      </div>

      <div className="pt-4 flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Update Domains"}
        </Button>
      </div>
    </form>
  );
}
