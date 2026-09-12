"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { publicApi } from "@/services/modules";
import { getApiErrorMessage } from "@/lib/api-errors";
import type { PublicAudience } from "@/lib/public-audience";
import { FormSection } from "@/components/workspace/form-section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  publicButtonClassName,
  publicFormInputClassName,
  publicFormLabelClassName,
  publicFormTextareaClassName,
} from "@/components/public/publicStyles";
import { cn } from "@/lib/utils";

const platformSchema = z.object({
  companyName: z.string().min(2, "Company name is required"),
  name: z.string().min(2, "Contact name is required"),
  mobile: z.string().min(10, "Enter a valid mobile number"),
  email: z.string().email("Enter a valid email address"),
  employeeCount: z.string().min(1, "Employee count is required"),
  message: z.string().min(10, "Please share your requirement"),
});

const tenantSchema = z.object({
  name: z.string().min(2, "Your name is required"),
  mobile: z.string().min(10, "Enter a valid mobile number"),
  email: z.string().email("Enter a valid email address"),
  subject: z.string().min(3, "Subject is required"),
  message: z.string().min(10, "Please describe your issue"),
});

type PlatformFormValues = z.infer<typeof platformSchema>;
type TenantFormValues = z.infer<typeof tenantSchema>;

type ContactDemoFormProps = {
  audience?: PublicAudience;
  variant?: "erp" | "public";
};

function PublicField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className={publicFormLabelClassName}>{label}</label>
      <div className="mt-1.5">{children}</div>
      {error ? <p className="mt-1 text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}

export function ContactDemoForm({ audience = "platform", variant = "erp" }: ContactDemoFormProps) {
  const [submitError, setSubmitError] = React.useState("");
  const [submitSuccess, setSubmitSuccess] = React.useState("");
  const isPlatform = audience === "platform";
  const isPublic = variant === "public";

  const platformForm = useForm<PlatformFormValues>({
    resolver: zodResolver(platformSchema),
    defaultValues: {
      companyName: "",
      name: "",
      mobile: "",
      email: "",
      employeeCount: "",
      message: "",
    },
  });

  const tenantForm = useForm<TenantFormValues>({
    resolver: zodResolver(tenantSchema),
    defaultValues: {
      name: "",
      mobile: "",
      email: "",
      subject: "",
      message: "",
    },
  });

  const onSubmitPlatform = async (values: PlatformFormValues) => {
    setSubmitError("");
    setSubmitSuccess("");

    try {
      await publicApi.submitContact(
        {
          companyName: values.companyName.trim(),
          name: values.name.trim(),
          email: values.email.trim(),
          phoneNumber: values.mobile.trim(),
          subject: `ERP walkthrough request for ${values.companyName.trim()}`,
          message: `Employee count: ${values.employeeCount.trim()}\n\n${values.message.trim()}`,
        },
        "platform"
      );
      platformForm.reset();
      setSubmitSuccess("Your walkthrough request has been submitted to the sales desk.");
    } catch (error: unknown) {
      setSubmitError(getApiErrorMessage(error, "Unable to submit your request right now."));
    }
  };

  const onSubmitTenant = async (values: TenantFormValues) => {
    setSubmitError("");
    setSubmitSuccess("");
    try {
      await publicApi.submitContact(
        {
          name: values.name.trim(),
          email: values.email.trim(),
          phoneNumber: values.mobile.trim(),
          subject: values.subject.trim(),
          message: values.message.trim(),
        },
        "tenant"
      );
      tenantForm.reset();
      setSubmitSuccess("Support request submitted successfully.");
    } catch (error: unknown) {
      setSubmitError(getApiErrorMessage(error, "Unable to submit your support request right now."));
    }
  };

  const alertClass = (type: "error" | "success") =>
    cn(
      "rounded-lg border px-3 py-2.5 text-sm",
      type === "error" ? "border-rose-200 bg-rose-50 text-rose-700" : "border-emerald-200 bg-emerald-50 text-emerald-800"
    );

  if (!isPlatform) {
    const { register, handleSubmit, formState } = tenantForm;

    const formBody = (
      <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit(onSubmitTenant)}>
        <PublicField label="Your name" error={formState.errors.name?.message}>
          <Input {...register("name")} placeholder="Employee or admin name" className={isPublic ? publicFormInputClassName : undefined} />
        </PublicField>
        <PublicField label="Mobile" error={formState.errors.mobile?.message}>
          <Input {...register("mobile")} placeholder="+91 98765 43210" className={isPublic ? publicFormInputClassName : undefined} />
        </PublicField>
        <PublicField label="Email" error={formState.errors.email?.message}>
          <Input {...register("email")} placeholder="you@company.com" className={isPublic ? publicFormInputClassName : undefined} />
        </PublicField>
        <PublicField label="Subject" error={formState.errors.subject?.message}>
          <Input {...register("subject")} placeholder="Payroll, attendance, or access issue" className={isPublic ? publicFormInputClassName : undefined} />
        </PublicField>
        <div className="md:col-span-2">
          <PublicField label="Message" error={formState.errors.message?.message}>
            {isPublic ? (
              <textarea {...register("message")} className={publicFormTextareaClassName} placeholder="Describe the issue and any relevant context." />
            ) : (
              <textarea {...register("message")} className="erp-input min-h-32" placeholder="Describe the issue and any employee or department context." />
            )}
          </PublicField>
        </div>
        {submitError ? <div className={cn("md:col-span-2", alertClass("error"))}>{submitError}</div> : null}
        {submitSuccess ? <div className={cn("md:col-span-2", alertClass("success"))}>{submitSuccess}</div> : null}
        <div className="md:col-span-2 flex justify-end">
          {isPublic ? (
            <button type="submit" disabled={formState.isSubmitting} className={publicButtonClassName.primary}>
              {formState.isSubmitting ? "Submitting..." : "Submit Support Request"}
            </button>
          ) : (
            <Button type="submit" disabled={formState.isSubmitting}>
              {formState.isSubmitting ? "Submitting..." : "Submit Support Request"}
            </Button>
          )}
        </div>
      </form>
    );

    if (isPublic) {
      return (
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Contact support</h3>
          <p className="mt-1 text-sm text-slate-600">Share your issue and the support desk will route it to the right team.</p>
          <div className="mt-5">{formBody}</div>
        </div>
      );
    }

    return (
      <FormSection title="Contact support" description="Share your issue and the support desk will route it to the right team.">
        {formBody}
      </FormSection>
    );
  }

  const { register, handleSubmit, formState } = platformForm;

  const formBody = (
    <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit(onSubmitPlatform)}>
      <PublicField label="Company name" error={formState.errors.companyName?.message}>
        <Input {...register("companyName")} placeholder="Northstar Infra Pvt. Ltd." className={isPublic ? publicFormInputClassName : undefined} />
      </PublicField>
      <PublicField label="Contact person" error={formState.errors.name?.message}>
        <Input {...register("name")} placeholder="Ananya Sharma" className={isPublic ? publicFormInputClassName : undefined} />
      </PublicField>
      <PublicField label="Mobile" error={formState.errors.mobile?.message}>
        <Input {...register("mobile")} placeholder="+91 98765 43210" className={isPublic ? publicFormInputClassName : undefined} />
      </PublicField>
      <PublicField label="Email" error={formState.errors.email?.message}>
        <Input {...register("email")} placeholder="ops@northstarinfra.com" className={isPublic ? publicFormInputClassName : undefined} />
      </PublicField>
      <PublicField label="Employee count" error={formState.errors.employeeCount?.message}>
        <Input {...register("employeeCount")} placeholder="2500" className={isPublic ? publicFormInputClassName : undefined} />
      </PublicField>
      <div className="md:col-span-2">
        <PublicField label="Requirement" error={formState.errors.message?.message}>
          {isPublic ? (
            <textarea {...register("message")} className={publicFormTextareaClassName} placeholder="Attendance, payroll, finance, procurement rollout across locations." />
          ) : (
            <textarea {...register("message")} className="erp-input min-h-32" placeholder="Attendance, payroll, finance, procurement, and ESS rollout across multiple locations." />
          )}
        </PublicField>
      </div>
      {submitError ? <div className={cn("md:col-span-2", alertClass("error"))}>{submitError}</div> : null}
      {submitSuccess ? <div className={cn("md:col-span-2", alertClass("success"))}>{submitSuccess}</div> : null}
      <div className="md:col-span-2 flex justify-end">
        {isPublic ? (
          <button type="submit" disabled={formState.isSubmitting} className={publicButtonClassName.primary}>
            {formState.isSubmitting ? "Submitting..." : "Request Walkthrough"}
          </button>
        ) : (
          <Button type="submit" disabled={formState.isSubmitting}>
            {formState.isSubmitting ? "Submitting..." : "Request Walkthrough"}
          </Button>
        )}
      </div>
    </form>
  );

  if (isPublic) {
    return (
      <div>
        <h3 className="text-lg font-semibold text-slate-900">Request a walkthrough</h3>
        <p className="mt-1 text-sm text-slate-600">Share your rollout scope and we will prepare your enquiry for the sales team.</p>
        <div className="mt-5">{formBody}</div>
      </div>
    );
  }

  return (
    <FormSection title="Request a walkthrough" description="Share your rollout scope and we will prepare the enquiry for the sales team.">
      {formBody}
    </FormSection>
  );
}
