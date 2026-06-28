"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { publicApi } from "@/services/modules";
import { getApiErrorMessage } from "@/lib/api-errors";
import type { PublicAudience } from "@/lib/public-audience";
import { FormSection } from "@/components/erp/form-section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const platformSchema = z.object({
  companyName: z.string().min(2, "Company name is required"),
  name: z.string().min(2, "Contact name is required"),
  mobile: z.string().min(10, "Enter a valid mobile number"),
  email: z.email("Enter a valid email address"),
  employeeCount: z.string().min(1, "Employee count is required"),
  message: z.string().min(10, "Please share your requirement"),
});

const tenantSchema = z.object({
  name: z.string().min(2, "Your name is required"),
  mobile: z.string().min(10, "Enter a valid mobile number"),
  email: z.email("Enter a valid email address"),
  subject: z.string().min(3, "Subject is required"),
  message: z.string().min(10, "Please describe your issue"),
});

type PlatformFormValues = z.infer<typeof platformSchema>;
type TenantFormValues = z.infer<typeof tenantSchema>;

export function ContactDemoForm({ audience = "platform" }: { audience?: PublicAudience }) {
  const [submitError, setSubmitError] = React.useState("");
  const [submitSuccess, setSubmitSuccess] = React.useState("");
  const isPlatform = audience === "platform";

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
      await publicApi.submitContact({
        name: values.name.trim(),
        email: values.email.trim(),
        phoneNumber: values.mobile.trim(),
        subject: values.subject.trim(),
        message: values.message.trim(),
      }, "tenant");
      tenantForm.reset();
      setSubmitSuccess("Support request submitted to the company database.");
    } catch (error: unknown) {
      setSubmitError(getApiErrorMessage(error, "Unable to submit your support request right now."));
    }
  };

  if (!isPlatform) {
    const { register, handleSubmit, formState } = tenantForm;
    return (
      <FormSection
        title="Contact support"
        description="Share your issue and the support desk will route it to the right team."
      >
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit(onSubmitTenant)}>
          <div>
            <label className="erp-label">Your name</label>
            <Input {...register("name")} placeholder="Employee or admin name" />
            {formState.errors.name ? <p className="mt-1 text-xs text-rose-600">{formState.errors.name.message}</p> : null}
          </div>
          <div>
            <label className="erp-label">Mobile</label>
            <Input {...register("mobile")} placeholder="+91 98765 43210" />
            {formState.errors.mobile ? <p className="mt-1 text-xs text-rose-600">{formState.errors.mobile.message}</p> : null}
          </div>
          <div>
            <label className="erp-label">Email</label>
            <Input {...register("email")} placeholder="you@company.com" />
            {formState.errors.email ? <p className="mt-1 text-xs text-rose-600">{formState.errors.email.message}</p> : null}
          </div>
          <div>
            <label className="erp-label">Subject</label>
            <Input {...register("subject")} placeholder="Payroll, attendance, login, or access issue" />
            {formState.errors.subject ? <p className="mt-1 text-xs text-rose-600">{formState.errors.subject.message}</p> : null}
          </div>
          <div className="md:col-span-2">
            <label className="erp-label">Message</label>
            <textarea {...register("message")} className="erp-input min-h-32" placeholder="Describe the issue and any employee or department context." />
            {formState.errors.message ? <p className="mt-1 text-xs text-rose-600">{formState.errors.message.message}</p> : null}
          </div>
          {submitError ? <div className="md:col-span-2 rounded-[1rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{submitError}</div> : null}
          {submitSuccess ? <div className="md:col-span-2 rounded-[1rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{submitSuccess}</div> : null}
          <div className="md:col-span-2 flex items-center justify-between gap-3">
            <span />
            <Button type="submit" disabled={formState.isSubmitting}>
              {formState.isSubmitting ? "Submitting..." : "Submit support request"}
            </Button>
          </div>
        </form>
      </FormSection>
    );
  }

  const { register, handleSubmit, formState } = platformForm;

  return (
    <FormSection
      title="Request a walkthrough"
      description="Share your rollout scope and we will prepare the enquiry for the sales team."
    >
      <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit(onSubmitPlatform)}>
        <div>
          <label className="erp-label">Company name</label>
          <Input {...register("companyName")} placeholder="Northstar Infra Pvt. Ltd." />
          {formState.errors.companyName ? <p className="mt-1 text-xs text-rose-600">{formState.errors.companyName.message}</p> : null}
        </div>
        <div>
          <label className="erp-label">Contact person</label>
          <Input {...register("name")} placeholder="Ananya Sharma" />
          {formState.errors.name ? <p className="mt-1 text-xs text-rose-600">{formState.errors.name.message}</p> : null}
        </div>
        <div>
          <label className="erp-label">Mobile</label>
          <Input {...register("mobile")} placeholder="+91 98765 43210" />
          {formState.errors.mobile ? <p className="mt-1 text-xs text-rose-600">{formState.errors.mobile.message}</p> : null}
        </div>
        <div>
          <label className="erp-label">Email</label>
          <Input {...register("email")} placeholder="ops@northstarinfra.com" />
          {formState.errors.email ? <p className="mt-1 text-xs text-rose-600">{formState.errors.email.message}</p> : null}
        </div>
        <div>
          <label className="erp-label">Employee count</label>
          <Input {...register("employeeCount")} placeholder="2500" />
          {formState.errors.employeeCount ? <p className="mt-1 text-xs text-rose-600">{formState.errors.employeeCount.message}</p> : null}
        </div>
        <div className="md:col-span-2">
          <label className="erp-label">Requirement</label>
          <textarea {...register("message")} className="erp-input min-h-32" placeholder="Attendance, payroll, finance, procurement, and ESS rollout across multiple locations." />
          {formState.errors.message ? <p className="mt-1 text-xs text-rose-600">{formState.errors.message.message}</p> : null}
        </div>
        {submitError ? <div className="md:col-span-2 rounded-[1rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{submitError}</div> : null}
        {submitSuccess ? <div className="md:col-span-2 rounded-[1rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{submitSuccess}</div> : null}
        <div className="md:col-span-2 flex items-center justify-between gap-3">
          {submitSuccess ? (
            <p className="text-sm font-medium text-emerald-700">The sales request is now stored in the backend queue.</p>
          ) : (
            <span />
          )}
          <Button type="submit" disabled={formState.isSubmitting}>
            {formState.isSubmitting ? "Submitting..." : "Submit request"}
          </Button>
        </div>
      </form>
    </FormSection>
  );
}
