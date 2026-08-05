"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  adminName: z.string().min(2, "Admin name is required"),
  adminEmail: z.string().email("Invalid email address"),
  contactNumber: z.string().optional(),
  address: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface TenantBasicFormProps {
  initialData?: Partial<FormData>;
  onSubmit: (data: FormData) => void;
  isSubmitting?: boolean;
}

export function TenantBasicForm({ initialData, onSubmit, isSubmitting }: TenantBasicFormProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initialData?.name || "",
      adminName: initialData?.adminName || "",
      adminEmail: initialData?.adminEmail || "",
      contactNumber: initialData?.contactNumber || "",
      address: initialData?.address || "",
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Tenant Name *</Label>
        <Input id="name" placeholder="Acme Corp" {...register("name")} />
        {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="adminName">Admin Name *</Label>
          <Input id="adminName" placeholder="John Doe" {...register("adminName")} />
          {errors.adminName && <p className="text-xs text-red-500">{errors.adminName.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="adminEmail">Admin Email *</Label>
          <Input id="adminEmail" type="email" placeholder="john@example.com" {...register("adminEmail")} />
          {errors.adminEmail && <p className="text-xs text-red-500">{errors.adminEmail.message}</p>}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="contactNumber">Contact Number</Label>
        <Input id="contactNumber" placeholder="+1 (555) 000-0000" {...register("contactNumber")} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Input id="address" placeholder="123 Business St, Suite 100" {...register("address")} />
      </div>
      <div className="pt-4 flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save Details"}
        </Button>
      </div>
    </form>
  );
}
