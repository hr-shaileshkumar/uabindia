"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import LoginCard from "@/components/auth/LoginCard";
import PublicAudiencePageFrame from "@/components/public/PublicAudiencePageFrame";
import PublicAuthShell from "@/components/public/PublicAuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { usePublicPageData } from "@/hooks/usePublicPageData";
import { getApiErrorMessage } from "@/lib/api-errors";
import {
  hasExplicitPublicTenantContext,
  resolvePublicAudience,
  withPublicAudience,
} from "@/lib/public-audience";
import { getDefaultAppPath } from "@/lib/erp/route-config";
import apiClient, { getDeviceId } from "@/services/apiClient";

const loginSchema = z.object({
  email: z.email("Enter a valid work email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginValues = z.infer<typeof loginSchema>;

type LoginContent = {
  title: string;
  subtitle: string;
  loginButtonLabel: string;
  authEyebrow: string;
  authAsideTitle: string;
  authAsideBody: string;
  authBadges: string[];
};

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshUser } = useAuth();
  const nextPath = searchParams.get("next");
  const isTenantContext = hasExplicitPublicTenantContext();
  const audience = useMemo(
    () => resolvePublicAudience(searchParams.get("audience"), isTenantContext),
    [isTenantContext, searchParams]
  );
  const { profile, headerContent, footerContent, allowedPaths, pageVisible, parseContent } = usePublicPageData("login", audience);
  const content = parseContent<LoginContent>({
    title: "Workspace login",
    subtitle: "Sign in with your work email and password.",
    loginButtonLabel: "Sign in",
    authEyebrow: "Secure access",
    authAsideTitle: "",
    authAsideBody: "",
    authBadges: ["HRMS", "Payroll", "ERP"],
  });
  const [errorMessage, setErrorMessage] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginValues) => {
    setErrorMessage("");

    try {
      await apiClient.post("/auth/login", {
        email: values.email.trim(),
        password: values.password,
        deviceId: getDeviceId(),
      });
      await refreshUser();
      router.push(nextPath || getDefaultAppPath());
    } catch (error: unknown) {
      setErrorMessage(getApiErrorMessage(error, "Unable to sign in. Check your credentials and workspace URL."));
    }
  };

  return (
    <PublicAudiencePageFrame audience={audience} profile={profile} headerContent={headerContent} footerContent={footerContent} allowedPaths={allowedPaths} pageVisible={pageVisible} footerVariant="full">
      <PublicAuthShell>
        <LoginCard
          profile={profile}
          title="Sign in"
          subtitle={isTenantContext ? "Access your company workspace." : "Access the UabIndia ERP workspace."}
        >
          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label className="erp-label">Email address</label>
              <Input {...register("email")} placeholder="you@company.com" type="email" autoComplete="email" />
              {errors.email ? <p className="mt-1 text-xs text-rose-600">{errors.email.message}</p> : null}
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between gap-3">
                <label className="erp-label mb-0">Password</label>
                <Link href={withPublicAudience("/forgot-password", audience)} className="text-sm font-medium text-(--erp-primary)">
                  Forgot password?
                </Link>
              </div>
              <Input {...register("password")} type="password" placeholder="Enter your password" autoComplete="current-password" />
              {errors.password ? <p className="mt-1 text-xs text-rose-600">{errors.password.message}</p> : null}
            </div>

            {errorMessage ? <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{errorMessage}</div> : null}

            <p className="text-sm leading-6 text-slate-500">
              Workspace access is selected automatically from your domain or subdomain.
            </p>

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Signing in..." : content.loginButtonLabel}
            </Button>

            <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
              <span>Need access?</span>
              <Link href={withPublicAudience("/register", audience)} className="font-medium text-(--erp-primary)">
                Request access
              </Link>
            </div>
          </form>
        </LoginCard>
      </PublicAuthShell>
    </PublicAudiencePageFrame>
  );
}
