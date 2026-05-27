"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Eye, EyeOff, Lock, Mail, ArrowRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { buildClientProfile } from "@/lib/publicProfile";
import { publicApi } from "@/services/publicApi";
import apiClient from "@/services/apiClient";
import { ROUTES } from "@/constants/routes";
import PublicSiteFrame from "@/components/public/PublicSiteFrame";
import { usePublicPageData } from "@/hooks/usePublicPageData";

type LoginPageContent = {
  title: string;
  subtitle: string;
  loginButtonLabel: string;
};

const resolveSafeNextPath = (value: string | null): string | null => {
  if (!value) return null;
  if (!value.startsWith("/")) return null;
  if (value.startsWith("//")) return null;
  if (value.startsWith("/login") || value.startsWith("/register")) return null;
  return value;
};

export default function LoginPage() {
  const pageContent: LoginPageContent = {
    title: "Welcome Back",
    subtitle: "Login to your ERP account to continue",
    loginButtonLabel: "Login",
  };
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [logoUrl, setLogoUrl] = useState("/logo.png");
  const [tenantBrand, setTenantBrand] = useState("ERP Tenant Portal");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshUser } = useAuth();
  const { profile, headerContent, footerContent } = usePublicPageData("login");
  const nextPath = resolveSafeNextPath(searchParams.get("next"));

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hostname = window.location.hostname.toLowerCase();
    const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1";

    if (!hostname.endsWith(".localhost") && !isLocalhost) {
      const subdomain = hostname.split(".")[0];
      if (!subdomain) {
        router.replace("/tenant-not-found");
        return;
      }

      const validateTenant = async () => {
        try {
          const res = await fetch(`/api/v1/tenants/resolve?subdomain=${encodeURIComponent(subdomain)}`);
          if (!res.ok) {
            router.replace("/tenant-not-found");
            return;
          }
          const data = await res.json();
          if (!data?.exists) {
            router.replace("/tenant-not-found");
          }
        } catch {
          router.replace("/tenant-not-found");
        }
      };

      validateTenant();
    }
  }, [router]);

  useEffect(() => {
    const rememberedUserId = localStorage.getItem("rememberedUserId");
    if (rememberedUserId) {
      setUserId(rememberedUserId);
      setRememberMe(true);
    }
  }, []);

  useEffect(() => {
    let active = true;

    const loadTenantBranding = async () => {
      try {
        const response = await publicApi.getCompanyProfile();
        if (!active) return;

        const profile = buildClientProfile(response.data);
        setLogoUrl(profile.logoUrl || "/logo.png");
        setTenantBrand(profile.brandName || profile.companyName || "ERP Tenant Portal");
      } catch {
        if (!active || typeof window === "undefined") return;
        const hostname = window.location.hostname.toLowerCase();
        const tenantName = hostname.split(".")[0] || "Tenant";
        setTenantBrand(tenantName.replace(/[-_.]+/g, " ").trim() || "ERP Tenant Portal");
      }
    };

    loadTenantBranding();
    return () => {
      active = false;
    };
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
      const message =
        typeof err === "object" &&
        err !== null &&
        "message" in err &&
        typeof err.message === "string"
          ? err.message
          : "Login failed";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PublicSiteFrame profile={profile} headerContent={headerContent} footerContent={footerContent}>
      <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-white px-4 py-16 sm:px-6">
        {/* Animated background gradients */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-blue-100 mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
          <div className="absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-indigo-100 mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: "2s" }} />
          <div className="absolute top-1/2 left-1/2 h-72 w-72 rounded-full bg-purple-100 mix-blend-multiply filter blur-3xl opacity-10" />
        </div>

      {/* Main container with two-column layout on desktop */}
      <div className="relative w-full max-w-6xl grid md:grid-cols-2 gap-8 lg:gap-12 items-center">
        {/* Left side - Branding (hidden on mobile) */}
        <div className="hidden md:flex flex-col justify-center space-y-8">
          <div className="space-y-6">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-slate-900 to-slate-700 shadow-xl">
              <Image
                src={logoUrl}
                alt={`${tenantBrand} logo`}
                width={56}
                height={56}
                className="h-8 w-8 object-contain"
              />
            </div>
            
            <div className="space-y-4">
              <h2 className="text-4xl font-bold tracking-tight text-slate-900">
                Enterprise Resource Platform
              </h2>
              <p className="text-lg text-slate-600 leading-relaxed">
                Streamline your business operations with our comprehensive ERP solution. Manage projects, resources, and workflows efficiently.
              </p>
            </div>

            {/* Features list */}
            <div className="space-y-3 pt-4">
              {[
                { label: "Real-time Analytics", icon: "📊" },
                { label: "Team Collaboration", icon: "👥" },
                { label: "Secure & Reliable", icon: "🔒" },
              ].map((feature) => (
                <div key={feature.label} className="flex items-center gap-3">
                  <span className="text-xl">{feature.icon}</span>
                  <span className="text-sm font-medium text-slate-700">{feature.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Testimonial */}
          <div className="rounded-2xl border border-slate-200 bg-white/80 backdrop-blur p-6 space-y-3">
            <p className="text-sm text-slate-700 italic">
              "This ERP system has transformed how we manage our operations."
            </p>
            <p className="text-sm font-semibold text-slate-900">Sarah Johnson</p>
            <p className="text-xs text-slate-500">Operations Director</p>
          </div>
        </div>

        {/* Right side - Login form */}
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="md:hidden mb-8 flex justify-center">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-slate-900 to-slate-700 shadow-xl">
              <Image
                src={logoUrl}
                alt={`${tenantBrand} logo`}
                width={56}
                height={56}
                className="h-8 w-8 object-contain"
              />
            </div>
          </div>

          {/* Title section */}
          <div className="mb-8 text-center md:text-left">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">
              {pageContent.title}
            </h1>
            <p className="mt-3 text-base text-slate-600">
              {pageContent.subtitle}
            </p>
          </div>

          {/* Login form card */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-2xl p-8 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email field */}
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-semibold text-slate-900">
                  Email Address
                </label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-slate-900 transition" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    placeholder="you@company.com"
                    autoComplete="email"
                    className="w-full rounded-lg border border-slate-300 bg-white pl-12 pr-4 py-3 text-slate-900 placeholder-slate-400 transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 hover:border-slate-400"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Password field */}
              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-semibold text-slate-900">
                  Password
                </label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-slate-900 transition" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    className="w-full rounded-lg border border-slate-300 bg-white pl-12 pr-12 py-3 text-slate-900 placeholder-slate-400 transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 hover:border-slate-400"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900 transition"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember me & Forgot password */}
              <div className="flex items-center justify-between">
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
                <Link
                  href="/forgot-password"
                  className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Error message */}
              {error && (
                <div className="rounded-lg border border-red-300 bg-red-50 p-4 animate-shake">
                  <p className="flex items-center gap-2 text-sm text-red-700 font-medium">
                    <span className="shrink-0">⚠️</span>
                    {error}
                  </p>
                </div>
              )}

              {/* Sign in button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-lg bg-linear-to-r from-slate-900 to-slate-800 py-3 px-4 font-semibold text-white shadow-lg transition hover:shadow-xl hover:from-slate-800 hover:to-slate-700 disabled:opacity-70 disabled:cursor-not-allowed active:scale-[0.98] flex items-center justify-center gap-2 group"
              >
                {isLoading ? (
                  <>
                    <div className="h-4 w-4 rounded-full border-2 border-slate-300 border-t-white animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    {pageContent.loginButtonLabel}
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition" />
                  </>
                )}
              </button>
            </form>

          </div>

          {/* Security note */}
          <p className="mt-6 text-center text-xs text-slate-500 flex items-center justify-center gap-1">
            🔒 This is a secure system. Unauthorized access is prohibited.
          </p>
        </div>
      </div>
      </div>
    </PublicSiteFrame>
  );
}
