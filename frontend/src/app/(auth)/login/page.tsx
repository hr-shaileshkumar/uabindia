"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ArrowRight, Eye, EyeOff, Loader2, LockKeyhole, Mail } from "lucide-react";
import PublicAudiencePageFrame from "@/components/public/PublicAudiencePageFrame";
import PublicAuthAlert from "@/components/public/PublicAuthAlert";
import PublicAuthCard, { PublicAuthFooterLink } from "@/components/public/PublicAuthCard";
import { PublicAuthFormField, PublicAuthInput } from "@/components/public/PublicAuthFormField";
import PublicAuthShell from "@/components/public/PublicAuthShell";
import { publicAuthLinkClassName, publicButtonClassName } from "@/components/public/publicStyles";
import { useAuth } from "@/context/AuthContext";
import { usePublicPageData } from "@/hooks/usePublicPageData";
import { useResolvedPublicAudience } from "@/hooks/useResolvedPublicAudience";
import { getApiErrorMessage, isApiConnectivityError } from "@/lib/api-errors";
import { readRememberedLogin, writeRememberedLogin } from "@/lib/auth-remember";
import { withPublicAudience } from "@/lib/public-audience";
import { canonicalizeProtectedPath, getDefaultAppPath } from "@/lib/workspace/route-config";
import { cn } from "@/lib/utils";
import { getDeviceId } from "@/services/apiClient";
import { authApi } from "@/services/modules";

const loginSchema = z.object({
  email: z.string().email("Enter a valid work email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
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
    title: "Welcome back",
    subtitle: "Enter your work email and password to continue.",
    loginButtonLabel: "Sign in",
  });

  const [errorMessage, setErrorMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [csrfReady, setCsrfReady] = useState(false);
  const [savedEmail, setSavedEmail] = useState("");

  const emailFieldId = "login-email";
  const passwordFieldId = "login-password";
  const rememberFieldId = "login-remember";

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", remember: false },
  });

  useEffect(() => {
    const saved = readRememberedLogin();
    setSavedEmail(saved.email);
    reset({
      email: saved.email,
      password: "",
      remember: saved.remember,
    });
  }, [reset]);

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
    const email = values.email.trim().toLowerCase();
    const remember = Boolean(values.remember);

    try {
      writeRememberedLogin(remember, email);
      await authApi.login({
        email,
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
  const busy = isSubmitting || !csrfReady;

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
      <PublicAuthShell brandName={brandName} homeHref={homeHref} audience={audience} variant="login">
        <PublicAuthCard
          title={content.title}
          subtitle={content.subtitle}
          footer={
            <>
              Need workspace access?{" "}
              <PublicAuthFooterLink href={withPublicAudience("/register", audience)}>
                Request workspace
              </PublicAuthFooterLink>
            </>
          }
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5" noValidate>
            <PublicAuthFormField id={emailFieldId} label="Work email" error={errors.email?.message}>
              <PublicAuthInput
                id={emailFieldId}
                {...register("email")}
                type="email"
                placeholder="you@company.com"
                autoComplete="username"
                autoFocus={!savedEmail}
                icon={<Mail className="h-4 w-4" />}
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
                    className="absolute right-3.5 top-1/2 z-10 -translate-y-1/2 rounded-md p-1 text-slate-400 transition-colors hover:text-slate-600"
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
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900/20"
              />
              <span className="text-sm leading-snug text-slate-600">
                <span className="font-medium text-slate-800">Remember me</span>
                <span className="block text-xs text-slate-500">
                  Saves your email on this device. Your browser can securely store the password.
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
          </form>
        </PublicAuthCard>
      </PublicAuthShell>
    </PublicAudiencePageFrame>
  );
}
