"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Eye, EyeOff, Lock, Mail, User, ArrowRight, CheckCircle2 } from "lucide-react";
import apiClient from "@/services/apiClient";
import PublicSiteFrame from "@/components/public/PublicSiteFrame";
import { usePublicPageData } from "@/hooks/usePublicPageData";

type RegisterFormData = {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
};

export default function RegisterPage() {
  const [formData, setFormData] = useState<RegisterFormData>({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { profile, headerContent, footerContent } = usePublicPageData("register");

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.fullName || !formData.email || !formData.password || !formData.confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (!formData.agreeToTerms) {
      setError("You must agree to the terms and conditions.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await apiClient.post("/auth/register", {
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
      });

      if (res.status === 200 || res.status === 201) {
        setSuccess(true);
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      } else {
        setError(res.data?.message || "Registration failed");
      }
    } catch (err: unknown) {
      const message =
        typeof err === "object" &&
        err !== null &&
        "message" in err &&
        typeof err.message === "string"
          ? err.message
          : "Registration failed";
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
          <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-green-100 mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
          <div className="absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-emerald-100 mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: "2s" }} />
          <div className="absolute top-1/2 left-1/2 h-72 w-72 rounded-full bg-teal-100 mix-blend-multiply filter blur-3xl opacity-10" />
        </div>

      {/* Main container with two-column layout on desktop */}
      <div className="relative w-full max-w-6xl grid md:grid-cols-2 gap-8 lg:gap-12 items-center">
        {/* Left side - Branding (hidden on mobile) */}
        <div className="hidden md:flex flex-col justify-center space-y-8">
          <div className="space-y-6">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-green-600 to-emerald-700 shadow-xl">
              <Image
                src="/logo.png"
                alt="ERP Logo"
                width={56}
                height={56}
                className="h-8 w-8 object-contain"
              />
            </div>
            
            <div className="space-y-4">
              <h2 className="text-4xl font-bold tracking-tight text-slate-900">
                Get Started Today
              </h2>
              <p className="text-lg text-slate-600 leading-relaxed">
                Join thousands of businesses already using our ERP platform. Get started for free and see how it can transform your operations.
              </p>
            </div>

            {/* Benefits list */}
            <div className="space-y-3 pt-4">
              {[
                { label: "Free trial for 14 days", icon: "🎁" },
                { label: "No credit card required", icon: "💳" },
                { label: "24/7 customer support", icon: "📞" },
              ].map((benefit) => (
                <div key={benefit.label} className="flex items-center gap-3">
                  <span className="text-xl">{benefit.icon}</span>
                  <span className="text-sm font-medium text-slate-700">{benefit.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl border border-slate-200 bg-white/80 backdrop-blur p-4 space-y-1">
              <p className="text-2xl font-bold text-slate-900">5000+</p>
              <p className="text-sm text-slate-600">Active Users</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/80 backdrop-blur p-4 space-y-1">
              <p className="text-2xl font-bold text-slate-900">99.9%</p>
              <p className="text-sm text-slate-600">Uptime</p>
            </div>
          </div>
        </div>

        {/* Right side - Register form */}
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="md:hidden mb-8 flex justify-center">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-green-600 to-emerald-700 shadow-xl">
              <Image
                src="/logo.png"
                alt="ERP Logo"
                width={56}
                height={56}
                className="h-8 w-8 object-contain"
              />
            </div>
          </div>

          {/* Title section */}
          <div className="mb-8 text-center md:text-left">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">
              Create Account
            </h1>
            <p className="mt-3 text-base text-slate-600">
              Sign up for free to get started
            </p>
          </div>

          {/* Register form card */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-2xl p-8 space-y-6">
            {success ? (
              <div className="space-y-4 text-center py-6">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Account Created!</h3>
                <p className="text-sm text-slate-600">Redirecting to login page...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Full Name field */}
                <div className="space-y-2">
                  <label htmlFor="fullName" className="block text-sm font-semibold text-slate-900">
                    Full Name
                  </label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-slate-900 transition" />
                    <input
                      id="fullName"
                      name="fullName"
                      type="text"
                      value={formData.fullName}
                      onChange={handleChange}
                      placeholder="John Doe"
                      className="w-full rounded-lg border border-slate-300 bg-white pl-12 pr-4 py-3 text-slate-900 placeholder-slate-400 transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 hover:border-slate-400"
                      disabled={isLoading}
                    />
                  </div>
                </div>

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
                      value={formData.email}
                      onChange={handleChange}
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
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Enter your password"
                      className="w-full rounded-lg border border-slate-300 bg-white pl-12 pr-12 py-3 text-slate-900 placeholder-slate-400 transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 hover:border-slate-400"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900 transition"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">At least 8 characters</p>
                </div>

                {/* Confirm Password field */}
                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className="block text-sm font-semibold text-slate-900">
                    Confirm Password
                  </label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-slate-900 transition" />
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Confirm your password"
                      className="w-full rounded-lg border border-slate-300 bg-white pl-12 pr-12 py-3 text-slate-900 placeholder-slate-400 transition focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 hover:border-slate-400"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900 transition"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Terms checkbox */}
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    name="agreeToTerms"
                    type="checkbox"
                    checked={formData.agreeToTerms}
                    onChange={handleChange}
                    className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900/20 mt-1"
                    disabled={isLoading}
                  />
                  <span className="text-sm text-slate-700">
                    I agree to the{" "}
                    <a href="#" className="font-semibold text-slate-900 hover:text-slate-700 transition">
                      terms and conditions
                    </a>{" "}
                    and{" "}
                    <a href="#" className="font-semibold text-slate-900 hover:text-slate-700 transition">
                      privacy policy
                    </a>
                  </span>
                </label>

                {/* Error message */}
                {error && (
                  <div className="rounded-lg border border-red-300 bg-red-50 p-4 animate-shake">
                    <p className="flex items-center gap-2 text-sm text-red-700 font-medium">
                      <span className="shrink-0">⚠️</span>
                      {error}
                    </p>
                  </div>
                )}

                {/* Sign up button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full rounded-lg bg-linear-to-r from-green-600 to-emerald-600 py-3 px-4 font-semibold text-white shadow-lg transition hover:shadow-xl hover:from-green-700 hover:to-emerald-700 disabled:opacity-70 disabled:cursor-not-allowed active:scale-[0.98] flex items-center justify-center gap-2 group"
                >
                  {isLoading ? (
                    <>
                      <div className="h-4 w-4 rounded-full border-2 border-slate-300 border-t-white animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    <>
                      Create Account
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition" />
                    </>
                  )}
                </button>
              </form>
            )}

            {!success && (
              <>
                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="bg-white px-2 text-slate-500">Already have an account?</span>
                  </div>
                </div>

                {/* Sign in link */}
                <p className="text-center text-sm text-slate-600">
                  <Link
                    href="/login"
                    className="font-semibold text-slate-900 hover:text-slate-700 transition"
                  >
                    Sign in here
                  </Link>
                </p>
              </>
            )}
          </div>

          {/* Security note */}
          <p className="mt-6 text-center text-xs text-slate-500 flex items-center justify-center gap-1">
            🔒 Your data is secure and encrypted
          </p>
        </div>
      </div>
      </div>
    </PublicSiteFrame>
  );
}
