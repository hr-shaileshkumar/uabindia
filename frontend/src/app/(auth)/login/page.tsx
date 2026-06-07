"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Eye, EyeOff, Lock, Mail, ShieldCheck } from "lucide-react";
import PublicAuthShell from "@/components/public/PublicAuthShell";
import PublicSiteFrame from "@/components/public/PublicSiteFrame";
import { publicMutedPanelClassName, publicPanelClassName } from "@/components/public/publicStyles";
import { ROUTES } from "@/constants/routes";
import { useAuth } from "@/context/AuthContext";
import { usePublicPageData } from "@/hooks/usePublicPageData";
import { getApiErrorMessage, getApiErrorStatus, isApiConnectivityError } from "@/lib/api-errors";
import apiClient from "@/services/apiClient";

type LoginPageContent = {
  title: string;
  subtitle: string;
  loginButtonLabel: string;
  authEyebrow: string;
  authAsideTitle: string;
  authAsideBody: string;
  authBadges: string[];
};

const resolveSafeNextPath = (value: string | null): string | null => {
  if (!value) return null;
  if (!value.startsWith("/")) return null;
  if (value.startsWith("//")) return null;
  if (value.startsWith("/login") || value.startsWith("/register")) return null;
  return value;
};

export default function LoginPage() {
  const { profile, headerContent, footerContent, parseContent } = usePublicPageData("login");
  const pageContent = parseContent<LoginPageContent>({
    title: "Sign in to your workspace",
    subtitle: "Access ERP, payroll, HR, and operational workflows from one secure tenant-aware entry point.",
    loginButtonLabel: "Sign in",
    authEyebrow: "Secure access",
    authAsideTitle: "Built for controlled access",
    authAsideBody:
      "Use this page to present a secure, trustworthy handoff into the tenant workspace while preserving brand tone.",
    authBadges: ["Audit-aware login", "Tenant-scoped access", "Modern workspace"],
  });

  return (
    <PublicSiteFrame profile={profile} headerContent={headerContent} footerContent={footerContent}>
      <PublicAuthShell
        profile={profile}
        eyebrow={pageContent.authEyebrow}
        title={pageContent.title}
        subtitle={pageContent.subtitle}
        badges={pageContent.authBadges}
        asideTitle={pageContent.authAsideTitle}
        asideBody={pageContent.authAsideBody}
        metrics={[
          { label: "Support", value: profile.supportTier || "Premium" },
          { label: "Coverage", value: profile.supportHours },
          { label: "Security", value: "Role-based" },
        ]}
      >
        <LoginForm pageContent={pageContent} />
      </PublicAuthShell>
    </PublicSiteFrame>
  );
}

function LoginForm({ pageContent }: { pageContent: LoginPageContent }) {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshUser } = useAuth();
  const nextPath = resolveSafeNextPath(searchParams.get("next"));

  useEffect(() => {
    if (typeof window === "undefined") return;
    const rememberedUserId = localStorage.getItem("rememberedUserId");
    if (rememberedUserId) {
      setUserId(rememberedUserId);
      setRememberMe(true);
    }
  }, []);

  const getDeviceId = () => {
    let d = localStorage.getItem("deviceId");
    if (!d) {
      d = `dev-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      localStorage.setItem("deviceId", d);
    }
    return d;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!userId || !password) {
      setError("Please enter your email and password.");
      return;
    }
    setIsLoading(true);
    try {
      const deviceId = getDeviceId();
      const res = await apiClient.post("/auth/login", {
        email: userId,
        password,
        deviceId,
      });

      if (res.status === 200) {
        if (rememberMe) {
          localStorage.setItem("rememberedUserId", userId);
        } else {
          localStorage.removeItem("rememberedUserId");
        }
        await refreshUser();
        router.push(nextPath || ROUTES.CONTEXT);
      } else {
        setError(res.data?.message || "Login failed");
      }
    } catch (err: unknown) {
      const status = getApiErrorStatus(err);

      setError(
        isApiConnectivityError(err)
          ? "Login service is unreachable. Configure API_BASE_URL or BACKEND_INTERNAL_URL for this environment, or run the backend on localhost:5000 in local development."
          : status === 401
            ? getApiErrorMessage(err, "Invalid email or password.")
            : getApiErrorMessage(err, "Login failed. Please check your credentials and API connection.")
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`${publicPanelClassName} p-7 sm:p-8`}>
      <div className="mb-7 flex items-center gap-3">
        <div className="inline-flex h-11 w-11 items-center justify-center rounded-[1rem] bg-[linear-gradient(135deg,#0b4f8c,#0f6fa8)] text-white shadow-[0_14px_30px_rgba(11,79,140,0.2)]">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-semibold tracking-[-0.03em] text-slate-950">Workspace sign-in</h2>
          <p className="text-sm text-slate-600">Use your assigned business email and password.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-semibold text-slate-900">
            Email address
          </label>
          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition" />
            <input
              id="email"
              name="email"
              type="email"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="you@company.com"
              autoComplete="email"
              className="w-full rounded-[1.15rem] border border-slate-300 bg-white pl-12 pr-4 py-3 text-slate-900 placeholder-slate-400 transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="block text-sm font-semibold text-slate-900">
            Password
          </label>
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition" />
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
              className="w-full rounded-[1.15rem] border border-slate-300 bg-white pl-12 pr-12 py-3 text-slate-900 placeholder-slate-400 transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-900"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              id="remember"
              name="remember"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900/20"
              disabled={isLoading}
            />
            <span className="text-sm font-medium text-slate-700">Remember me</span>
          </label>
          <Link href="/forgot-password" className="text-sm font-semibold text-(--erp-primary) transition hover:text-(--erp-primary-hover)">
            Forgot password?
          </Link>
        </div>

        {error ? (
          <div className="rounded-[1.15rem] border border-rose-200 bg-rose-50 p-4">
            <p className="text-sm font-medium text-rose-700">{error}</p>
          </div>
        ) : null}

        <div className="flex justify-center pt-1">
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex min-w-[14rem] items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,#0b4f8c,#0f6fa8)] px-8 py-3 font-semibold text-white shadow-[0_16px_40px_rgba(11,79,140,0.2)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isLoading ? (
            <>
              <div className="h-4 w-4 rounded-full border-2 border-slate-300 border-t-white animate-spin" />
              Signing in...
            </>
          ) : (
            <>
              {pageContent.loginButtonLabel}
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
        </div>
      </form>

      <div className={`${publicMutedPanelClassName} mt-6 p-4`}>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Security note</p>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          This is a controlled enterprise system. Authentication activity may be logged and reviewed.
        </p>
      </div>
    </div>
  );
}
