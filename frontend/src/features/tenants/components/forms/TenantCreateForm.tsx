import { useForm, SubmitHandler, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { tenantSchema, TenantFormValues } from "../../validations/tenant.schema";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { erpButtonClassName } from "@/components/workspace/styles";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateTenant } from "../../hooks/useTenants";
import { useToast } from "@/hooks/useToast";

export function TenantCreateForm() {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    setValue,
  } = useForm<TenantFormValues>({
    resolver: zodResolver(tenantSchema) as any,
    defaultValues: {
      name: "",
      subdomain: "",
      adminName: "",
      adminEmail: "",
      subscriptionPlan: "Basic",
      status: "trial",
    },
  });

  // Example of watching a field (optional UI logic)
  const _subscriptionPlan = useWatch({ control, name: "subscriptionPlan" });

  const { mutateAsync: createTenant, isPending: isLoading } = useCreateTenant();
  const { toast } = useToast();

  const onSubmit: SubmitHandler<TenantFormValues> = async (data) => {
    try {
      await createTenant(data);
      toast({
        title: "Tenant created",
        description: `${data.name} has been added successfully`,
        variant: "default",
      });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Something went wrong";
      toast({
        title: "Error creating tenant",
        description: message,
        variant: "default",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="name">Tenant Name</Label>
          <Input id="name" {...register("name")}
            className={errors.name ? "border-red-500" : undefined}
          />
          {errors.name && (
            <p className="text-xs text-red-500">{errors.name?.message}</p>
          )}
        </div>
        {/* Subdomain */}
        <div className="space-y-2">
          <Label htmlFor="subdomain">Subdomain</Label>
          <Input id="subdomain" {...register("subdomain")}
            className={errors.subdomain ? "border-red-500" : undefined}
          />
          {errors.subdomain && (
            <p className="text-xs text-red-500">{errors.subdomain?.message}</p>
          )}
        </div>
        {/* Admin Name */}
        <div className="space-y-2">
          <Label htmlFor="adminName">Admin Name</Label>
          <Input id="adminName" {...register("adminName")}
            className={errors.adminName ? "border-red-500" : undefined}
          />
          {errors.adminName && (
            <p className="text-xs text-red-500">{errors.adminName?.message}</p>
          )}
        </div>
        {/* Admin Email */}
        <div className="space-y-2">
          <Label htmlFor="adminEmail">Admin Email</Label>
          <Input id="adminEmail" type="email" {...register("adminEmail")}
            className={errors.adminEmail ? "border-red-500" : undefined}
          />
          {errors.adminEmail && (
            <p className="text-xs text-red-500">{errors.adminEmail?.message}</p>
          )}
        </div>
        {/* Subscription Plan */}
        <div className="space-y-2">
          <Label htmlFor="subscriptionPlan">Subscription Plan</Label>
          <Select
            onValueChange={(value) => setValue("subscriptionPlan", value as "Basic" | "Premium" | "Enterprise")}
            defaultValue={"Basic"}
          >
            <SelectTrigger id="subscriptionPlan">
              <SelectValue placeholder="Select plan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Basic">Basic</SelectItem>
              <SelectItem value="Premium">Premium</SelectItem>
              <SelectItem value="Enterprise">Enterprise</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {/* Status (optional, hidden for now) */}
        <div className="hidden">
          <input type="hidden" {...register("status")} />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-6 border-t border-slate-200 dark:border-slate-800 pb-10">
        <Button type="submit" disabled={isLoading} className={erpButtonClassName.primary}>
          {isLoading ? "Provisioning Tenant…" : "Create Tenant"}
        </Button>
      </div>
    </form>
  );
}
