"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import LoginCard from "@/components/auth/LoginCard";
import PublicAudiencePageFrame from "@/components/public/PublicAudiencePageFrame";
import PublicAuthShell from "@/components/public/PublicAuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { usePublicPageData } from "@/hooks/usePublicPageData";
import { useResolvedPublicAudience } from "@/hooks/useResolvedPublicAudience";
import { getApiErrorMessage, isApiConnectivityError } from "@/lib/api-errors";
import { withPublicAudience } from "@/lib/public-audience";
import { canonicalizeProtectedPath, getDefaultAppPath } from "@/lib/erp/route-config";
import { getDeviceId } from "@/services/apiClient";
import { authApi } from "@/services/modules";

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
  const { audience } = useResolvedPublicAudience();
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
  const [showPassword, setShowPassword] = useState(false);
  const emailFieldId = "login-email";
  const passwordFieldId = "login-password";

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
      await authApi.login({
        email: values.email.trim(),
        password: values.password,
        deviceId: getDeviceId(),
      });
      await refreshUser();
      router.push(nextPath ? canonicalizeProtectedPath(nextPath) : getDefaultAppPath());
    } catch (error: unknown) {
      if (isApiConnectivityError(error)) {
        setErrorMessage("Backend API is unavailable or failed while signing in. Start the API on port 5000 and try again.");
        return;
      }

      setErrorMessage(getApiErrorMessage(error, "Unable to sign in. Check your credentials and workspace URL."));
    }
  };

  return (
    <PublicAudiencePageFrame audience={audience} profile={profile} headerContent={headerContent} footerContent={footerContent} allowedPaths={allowedPaths} pageVisible={pageVisible} footerVariant="full">
      <PublicAuthShell
        eyebrow={content.authEyebrow}
        title={audience === "tenant" ? `${profile.companyName || profile.brandName || "Workspace"} access` : "Sign in to the UabIndia ERP workspace"}
        description={audience === "tenant" ? "Use your work email and password to access your company workspace, approvals, payroll, and daily operations." : "Use your platform credentials to manage tenants, access modules, and continue in the shared ERP workspace."}
        badges={content.authBadges}
      >
        <LoginCard
          profile={profile}
          eyebrow={audience === "tenant" ? "Company workspace" : "Platform workspace"}
          align="left"
          title="Sign in"
          subtitle={audience === "tenant" ? "Access your company workspace with your work email and password." : "Access the UabIndia ERP platform workspace with your authorized account."}
        >
          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label className="erp-label" htmlFor={emailFieldId}>Email address</label>
              <div className="relative mt-2">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input id={emailFieldId} {...register("email")} className="pl-10" placeholder="you@company.com" type="email" autoComplete="email" />
              </div>
              {errors.email ? <p className="mt-1 text-xs text-rose-600">{errors.email.message}</p> : null}
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between gap-3">
                <label className="erp-label mb-0" htmlFor={passwordFieldId}>Password</label>
                <Link href={withPublicAudience("/forgot-password", audience)} className="text-sm font-medium text-(--erp-primary)">
                  Forgot password?
                </Link>
              </div>
              <div className="relative mt-2">
                <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id={passwordFieldId}
                  {...register("password")}
                  className="pl-10 pr-12"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-3 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password ? <p className="mt-1 text-xs text-rose-600">{errors.password.message}</p> : null}
            </div>

            {errorMessage ? <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{errorMessage}</div> : null}

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Signing in..." : content.loginButtonLabel}
            </Button>
          </form>
        </LoginCard>
      </PublicAuthShell>
    </PublicAudiencePageFrame>
  );
}
