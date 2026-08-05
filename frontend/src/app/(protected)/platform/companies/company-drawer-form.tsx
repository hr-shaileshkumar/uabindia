"use client"

import * as React from "react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import type { CompanyRecord, TenantSummary } from "@/features/companies/types"

const companyFormSchema = z.object({
  name: z.string().min(1, "Company name is required"),
  legalName: z.string().optional(),
  code: z.string().optional(),
  city: z.string().optional(),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  tenantId: z.string().optional(),
  isActive: z.boolean(),
})

type CompanyFormValues = z.infer<typeof companyFormSchema>

interface CompanyDrawerFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  company?: CompanyRecord | null
  tenants?: TenantSummary[]
  isSuperAdmin?: boolean
  selectedTenantId?: string
  onSubmit: (data: CompanyFormValues) => Promise<void>
  saving?: boolean
}

export function CompanyDrawerForm({
  open,
  onOpenChange,
  company,
  tenants = [],
  isSuperAdmin = false,
  selectedTenantId,
  onSubmit,
  saving = false,
}: CompanyDrawerFormProps) {
  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(companyFormSchema),
    defaultValues: {
      name: "",
      legalName: "",
      code: "",
      city: "",
      email: "",
      tenantId: "",
      isActive: true,
    },
  })

  const isActive = useWatch({ control: form.control, name: "isActive" })

  React.useEffect(() => {
    if (open) {
      if (company) {
        form.reset({
          name: company.name || "",
          legalName: company.legalName || "",
          code: company.code || "",
          city: company.city || "",
          email: company.email || "",
          tenantId: company.tenantId || selectedTenantId || "",
          isActive: company.isActive ?? true,
        })
      } else {
        form.reset({
          name: "",
          legalName: "",
          code: "",
          city: "",
          email: "",
          tenantId: selectedTenantId || "",
          isActive: true,
        })
      }
    }
  }, [open, company, form, selectedTenantId])

  const handleSubmit = form.handleSubmit(async (data) => {
    await onSubmit(data)
  })

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto sm:max-w-xl flex flex-col gap-0 p-0 z-[100]">
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80">
          <SheetHeader>
            <SheetTitle className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {company ? "Edit Company Master" : "Create New Company"}
            </SheetTitle>
            <SheetDescription className="text-sm text-slate-500">
              {company
                ? "Update company master details, code, and organization linkage."
                : "Add a new company entity to the system and link to tenant."}
            </SheetDescription>
          </SheetHeader>
        </div>
        
        <form id="company-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
          {isSuperAdmin && !company && (
            <div className="space-y-2">
              <Label htmlFor="tenantId" className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Tenant Linkage <span className="text-red-500">*</span>
              </Label>
              <select
                id="tenantId"
                className="flex h-10 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-background px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                {...form.register("tenantId")}
              >
                <option value="">Select Target Tenant</option>
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>{t.name} ({t.subdomain})</option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name" className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Company Name <span className="text-red-500">*</span>
            </Label>
            <Input id="name" placeholder="Enter official company name" {...form.register("name")} className="h-10 rounded-lg" />
            {form.formState.errors.name && (
              <p className="text-xs font-medium text-red-500">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="legalName" className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Legal Registered Name
            </Label>
            <Input id="legalName" placeholder="Enter legal / registered business entity name" {...form.register("legalName")} className="h-10 rounded-lg" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code" className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Company Code
              </Label>
              <Input id="code" placeholder="e.g. COMP001" {...form.register("code")} className="h-10 rounded-lg" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city" className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Headquarters City
              </Label>
              <Input id="city" placeholder="e.g. New York / Mumbai" {...form.register("city")} className="h-10 rounded-lg" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Official Email
            </Label>
            <Input id="email" type="email" placeholder="contact@company.com" {...form.register("email")} className="h-10 rounded-lg" />
            {form.formState.errors.email && (
              <p className="text-xs font-medium text-red-500">{form.formState.errors.email.message}</p>
            )}
          </div>

          <div className="flex items-center space-x-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <Checkbox
              id="isActive"
              checked={isActive}
              onCheckedChange={(checked) => form.setValue("isActive", checked as boolean)}
            />
            <Label htmlFor="isActive" className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
              Active Company Entity
            </Label>
          </div>
        </form>

        <div className="px-6 py-4 pb-8 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end space-x-3 bg-slate-50/80 dark:bg-slate-900/80">
          <Button variant="outline" type="button" onClick={() => onOpenChange(false)} disabled={saving} className="h-10 px-5">
            Cancel
          </Button>
          <Button type="submit" form="company-form" disabled={saving} className="h-10 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-sm">
            {saving ? "Saving..." : company ? "Update Company" : "Create Company"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
