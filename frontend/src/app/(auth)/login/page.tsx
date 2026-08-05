"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
  AlertCircle,
} from "lucide-react";
import PublicAudiencePageFrame from "@/components/public/PublicAudiencePageFrame";
import PublicAuthShell from "@/components/public/PublicAuthShell";
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
  email: z.string().email("Enter a valid work email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginValues = z.infer<typeof loginSchema>;

type LoginContent = {
  title: string;
  subtitle: string;
  loginButtonLabel: string;
};

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshUser } = useAuth();
  const nextPath = searchParams.get("next");
  const { audience } = useResolvedPublicAudience();
  const { profile, headerContent, footerContent, allowedPaths, pageVisible, parseContent } =
    usePublicPageData("login", audience);
  const content = parseContent<LoginContent>({
    title: "Welcome back",
    subtitle: "Sign in to your workspace to continue.",
    loginButtonLabel: "Sign in",
  });

  const [errorMessage, setErrorMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [csrfReady, setCsrfReady] = useState(false);

  const emailFieldId = "login-email";
  const passwordFieldId = "login-password";

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  useEffect(() => {
    let cancelled = false;
    authApi.csrfToken().catch(() => {}).finally(() => {
      if (!cancelled) setCsrfReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

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
        setErrorMessage("Unable to reach the server. Please check your connection and try again.");
        return;
      }
      setErrorMessage(getApiErrorMessage(error, "Invalid email or password. Please try again."));
    }
  };

  const brandName = profile.brandName || profile.companyName || "UabIndia ERP";
  const homeHref = withPublicAudience("/", audience);

  return (
    <PublicAudiencePageFrame
      audience={audience}
      profile={profile}
      headerContent={headerContent}
      footerContent={footerContent}
      allowedPaths={allowedPaths}
      pageVisible={pageVisible}
      showHeader={false}
      showFooter={false}
    >
      <PublicAuthShell brandName={brandName} homeHref={homeHref} audience={audience}>
        {/* Form Card Container */}
        <div className="relative w-full overflow-hidden rounded-2xl bg-white border border-slate-200/90 shadow-[0_8px_30px_rgb(0,0,0,0.06)] backdrop-blur-sm">
          {/* Top accent gradient bar */}
          <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-blue-600 via-teal-500 to-indigo-600" />

          <div className="p-7 sm:p-9">
            {/* Header */}
            <div className="mb-7">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50/80 px-3 py-1">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                <span className="text-[0.62rem] font-bold uppercase tracking-[0.2em] text-blue-700">
                  Secure Access
                </span>
              </div>
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                {content.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                {content.subtitle}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
              {/* Email Field */}
              <div className="space-y-1.5">
                <label
                  htmlFor={emailFieldId}
                  className="block text-xs font-bold uppercase tracking-wider text-slate-700"
                >
                  Work email
                </label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-3.5 h-4 w-4 text-slate-400 pointer-events-none z-10" />
                  <Input
                    id={emailFieldId}
                    {...register("email")}
                    type="email"
                    placeholder="me@company.com"
                    autoComplete="email"
                    autoFocus
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-900 placeholder:text-slate-400 transition-all focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                    style={{ paddingLeft: "2.75rem" }}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-xs font-semibold text-rose-600">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor={passwordFieldId}
                    className="block text-xs font-bold uppercase tracking-wider text-slate-700"
                  >
                    Password
                  </label>
                  <Link
                    href={withPublicAudience("/forgot-password", audience)}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline transition-all"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative flex items-center">
                  <LockKeyhole className="absolute left-3.5 h-4 w-4 text-slate-400 pointer-events-none z-10" />
                  <Input
                    id={passwordFieldId}
                    {...register("password")}
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-900 placeholder:text-slate-400 transition-all focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                    style={{ paddingLeft: "2.75rem", paddingRight: "2.75rem" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3.5 rounded-lg p-1 text-slate-400 hover:text-slate-600 transition-colors z-10"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-xs font-semibold text-rose-600">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Error Alert */}
              {errorMessage && (
                <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50/80 p-3.5 text-xs font-semibold text-rose-700 leading-relaxed">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || !csrfReady}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-600 text-sm font-bold text-white shadow-md shadow-blue-500/20 transition-all duration-200 hover:from-blue-700 hover:to-indigo-700 disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.99]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : !csrfReady ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Initializing security...
                  </>
                ) : (
                  <>
                    {content.loginButtonLabel}
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            {/* Registration CTA */}
            <div className="mt-6 border-t border-slate-100 pt-5 text-center text-xs text-slate-500">
              Need workspace access?{" "}
              <Link
                href={withPublicAudience("/register", audience)}
                className="font-bold text-blue-600 hover:text-blue-700 hover:underline transition-colors"
              >
                Request workspace
              </Link>
            </div>
          </div>
        </div>
      </PublicAuthShell>
    </PublicAudiencePageFrame>
  );
}

