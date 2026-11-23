"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ArrowRight, CheckCircle2, Eye, EyeOff, Loader2, LockKeyhole, Phone, User, Users } from "lucide-react";
import PublicAudiencePageFrame from "@/components/public/PublicAudiencePageFrame";
import PublicAuthAlert from "@/components/public/auth/PublicAuthAlert";
import PublicAuthCard, { PublicAuthFooterLink } from "@/components/public/auth/PublicAuthCard";
import { PublicAuthFormField, PublicAuthInput } from "@/components/public/auth/PublicAuthFormField";
import PublicAuthShell from "@/components/public/auth/PublicAuthShell";
import { publicAuthLinkClassName, publicButtonClassName } from "@/components/public/publicStyles";
import { useAuth } from "@/context/AuthContext";
import { usePublicPageData } from "@/hooks/usePublicPageData";
import { useResolvedPublicAudience } from "@/hooks/useResolvedPublicAudience";
import { getApiErrorMessage, isApiConnectivityError } from "@/lib/api-errors";
import { readRememberedLogin, writeRememberedLogin } from "@/lib/auth-remember";
import { withPublicAudience } from "@/lib/public-audience";
import { canonicalizeProtectedPath, getDefaultAppPath } from "@/lib/workspace/route-config";
import { cn } from "@/lib/utils";
import apiClient, { getDeviceId, setClientAuthToken } from "@/services/apiClient";
import { authApi } from "@/services/modules";

const loginSchema = z.object({
  identifier: z.string().trim().min(3, "Enter your work email, username, or mobile number"),
  password: z.string().min(4, "Password must be at least 4 characters"),
  remember: z.boolean().optional(),
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
  const nextPath = searchParams?.get("next") ?? null;
  const { audience } = useResolvedPublicAudience();
  const { profile, headerContent, footerContent, allowedPaths, pageVisible, parseContent } =
    usePublicPageData("login", audience);
  const content = parseContent<LoginContent>({
    title: "Sign In to Your Workspace",
    subtitle: "Enter your work email or user ID to access the ERP Console.",
    loginButtonLabel: "Sign in to ERP Console",
  });

  const [errorMessage, setErrorMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [savedEmail, setSavedEmail] = useState("");

  const emailFieldId = "login-identifier";
  const passwordFieldId = "login-password";
  const rememberFieldId = "login-remember";

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: "", password: "", remember: false },
  });

  useEffect(() => {
    // Security: sanitize URL immediately if credentials ever leaked into query parameters (e.g. from accidental GET submission)
    if (typeof window !== "undefined" && window.location.search) {
      try {
        const url = new URL(window.location.href);
        if (url.searchParams.has("password") || url.searchParams.has("email") || url.searchParams.has("identifier")) {
          const leakedEmail = url.searchParams.get("email") || url.searchParams.get("identifier");
          if (leakedEmail) {
            reset((prev) => ({ ...prev, identifier: leakedEmail }));
          }
          url.searchParams.delete("password");
          url.searchParams.delete("email");
          url.searchParams.delete("identifier");
          const cleanedSearch = url.searchParams.toString();
          window.history.replaceState({}, "", url.pathname + (cleanedSearch ? `?${cleanedSearch}` : ""));
        }
      } catch {}
    }

    const saved = readRememberedLogin();
    setSavedEmail(saved.email);
    reset({
      identifier: saved.email,
      password: "",
      remember: saved.remember,
    });
  }, [reset]);


  const targetPath = useMemo(
    () => (nextPath ? canonicalizeProtectedPath(nextPath) : getDefaultAppPath()),
    [nextPath]
  );

  useEffect(() => {
    router.prefetch(targetPath);

    // If user already authenticated via SSO/session cookie, redirect to returnUrl or target
    const checkSso = async () => {
      if (typeof document === "undefined") return;
      const hasCookieSession = /(?:^|;\s*)(?:access_token|UabIndia\.SSO\.Session)=/.test(document.cookie);
      if (!hasCookieSession) return;

      try {
        const res = await apiClient.get("/auth/me", {
          headers: { "X-Silent-Error": "1" },
        });
        if (res.data?.id) {
          const returnUrl = searchParams?.get("returnUrl");
          if (returnUrl) {
            window.location.href = returnUrl;
            return;
          }
          router.replace(targetPath);
        }
      } catch {
        // Not authenticated in this workspace
      }
    };
    void checkSso();
  }, [router, searchParams, targetPath]);

  const onSubmit = async (values: LoginValues) => {
    setErrorMessage("");
    const rawIdentifier = values.identifier.trim();
    const remember = Boolean(values.remember);

    try {
      writeRememberedLogin(remember, rawIdentifier);
      const isEmail = rawIdentifier.includes("@");
      const resolvedEmail = isEmail
        ? rawIdentifier.toLowerCase()
        : (rawIdentifier.toLowerCase() === "admin"
            ? "admin@uabindia.in"
            : `${rawIdentifier.toLowerCase()}@uabindia.in`);

      const res = await authApi.login({
        email: resolvedEmail,
        username: rawIdentifier,
        userId: rawIdentifier,
        password: values.password,
        deviceId: getDeviceId(),
      });

      const token = res.data?.access_token || res.data?.token;
      if (token) {
        setClientAuthToken(token);
      }

      await refreshUser();
      const returnUrl = searchParams?.get("returnUrl");
      if (returnUrl) {
        window.location.href = returnUrl;
        return;
      }
      const resolvedAppPath = targetPath && targetPath !== "/" ? targetPath : "/employee-self-service";
      if (typeof document !== "undefined") {
        document.cookie = `active_path=${encodeURIComponent(resolvedAppPath)}; path=/; max-age=604800; SameSite=Lax`;
        try {
          sessionStorage.setItem("erp.active.path", resolvedAppPath);
        } catch {}
      }
      router.replace("/");
    } catch (error: unknown) {
      if (isApiConnectivityError(error)) {
        setErrorMessage("Unable to reach the server. Please check your connection and try again.");
        return;
      }
      setErrorMessage(getApiErrorMessage(error, "Invalid credentials. Please verify your login details and try again."));
    }
  };

  const brandName = profile.brandName || profile.companyName || process.env.NEXT_PUBLIC_APP_NAME || "UabIndia ERP";
  const homeHref = withPublicAudience("/", audience);
  const busy = isSubmitting;

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
      <PublicAuthShell
        brandName={brandName}
        homeHref={homeHref}
        audience={audience}
        variant="login"
        profile={profile}
        headerContent={headerContent}
        allowedPaths={allowedPaths}
      >
        <PublicAuthCard
          title={content.title}
          subtitle={content.subtitle}
          footer={
            <div className="space-y-2 text-center">
              <p>
                Need workspace access?{" "}
                <PublicAuthFooterLink href={withPublicAudience("/register", audience)}>
                  Request workspace
                </PublicAuthFooterLink>
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                256-Bit TLS Encryption · SOC-2 Compliant · Multi-Tenant Isolation
              </p>
            </div>
          }
        >
          <form
            method="POST"
            action="#"
            onSubmit={(e) => {
              e.preventDefault();
              void handleSubmit(onSubmit)(e);
            }}
            className="space-y-3.5"
            noValidate
          >
            <PublicAuthFormField id={emailFieldId} label="Work email or User ID" error={errors.identifier?.message}>
              <PublicAuthInput
                id={emailFieldId}
                {...register("identifier")}
                type="text"
                placeholder="you@company.com or username"
                autoComplete="username"
                autoFocus={!savedEmail}
                icon={<User className="h-4 w-4" />}
              />
            </PublicAuthFormField>

            <PublicAuthFormField
              id={passwordFieldId}
              label="Password"
              error={errors.password?.message}
              hint={
                <Link
                  href={withPublicAudience("/forgot-password", audience)}
                  className={cn(publicAuthLinkClassName, "text-xs")}
                >
                  Forgot password?
                </Link>
              }
            >
              <PublicAuthInput
                id={passwordFieldId}
                {...register("password")}
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                autoComplete="current-password"
                autoFocus={Boolean(savedEmail)}
                icon={<LockKeyhole className="h-4 w-4" />}
                trailing={
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-3.5 top-1/2 z-10 -translate-y-1/2 rounded-md p-1 text-slate-400 transition-colors hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
              />
            </PublicAuthFormField>

            <label htmlFor={rememberFieldId} className="flex cursor-pointer items-start gap-2.5 pt-0.5">
              <input
                id={rememberFieldId}
                type="checkbox"
                {...register("remember")}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800"
              />
              <span className="text-sm leading-snug text-slate-600 dark:text-slate-300">
                <span className="font-medium text-slate-800 dark:text-slate-100">Remember credentials</span>
                <span className="block text-xs text-slate-500 dark:text-slate-300">
                  Saves your login identifier securely on this device.
                </span>
              </span>
            </label>

            {errorMessage ? <PublicAuthAlert tone="error">{errorMessage}</PublicAuthAlert> : null}

            <button
              type="submit"
              disabled={busy}
              className={cn(publicButtonClassName.primary, "mt-1.5 w-full")}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  {content.loginButtonLabel}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

            {/* Enterprise Support & HRMS Portal Switcher */}
            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                <span className="flex items-center gap-1.5 font-medium">
                  <Phone className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                  Enterprise Support:
                </span>
                <a
                  href="tel:+917903055384"
                  className="font-semibold text-slate-800 hover:text-blue-600 dark:text-slate-200 dark:hover:text-blue-400 transition-colors"
                >
                  +91 7903055384
                </a>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                <span className="flex items-center gap-1.5 font-medium">
                  <Users className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                  HRMS & Workforce:
                </span>
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Unified in ERP
                </span>
              </div>
            </div>
          </form>
        </PublicAuthCard>
      </PublicAuthShell>
    </PublicAudiencePageFrame>
  );
}
