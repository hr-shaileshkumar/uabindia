"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Playfair_Display, Plus_Jakarta_Sans } from "next/font/google";
import { useAuth } from "@/context/AuthContext";
import apiClient from "@/lib/apiClient";

const displayFont = Playfair_Display({ subsets: ["latin"], weight: ["600", "700"] });
const bodyFont = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

export default function LoginPage() {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { refreshUser } = useAuth();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hostname = window.location.hostname.toLowerCase();
    const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1";

    if (!hostname.endsWith(".localhost") || isLocalhost) {
      return;
    }

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
  }, [router]);

  // Load remembered userId and password on component mount
  useEffect(() => {
    const rememberedUserId = localStorage.getItem("rememberedUserId");
    const rememberedPassword = localStorage.getItem("rememberedPassword");
    if (rememberedUserId) {
      setUserId(rememberedUserId);
      setRememberMe(true);
    }
    if (rememberedPassword) {
      setPassword(rememberedPassword);
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
      setError("Please enter your user ID and password.");
      return;
    }
    setIsLoading(true);
    try {
      const deviceId = getDeviceId();
      const res = await apiClient.post("/auth/login", {
        email: userId,
        password: password,
        deviceId: deviceId,
      });

      if (res.status === 200 && res.data?.access_token) {
        if (rememberMe) {
          localStorage.setItem("rememberedUserId", userId);
          localStorage.setItem("rememberedPassword", password);
        } else {
          localStorage.removeItem("rememberedUserId");
          localStorage.removeItem("rememberedPassword");
        }
        await refreshUser();
        router.push("/context");
      } else {
        setError(res.data?.message || "Login failed");
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen bg-[#f4f1ea] ${bodyFont.className}`}>
      <div className="relative isolate min-h-screen overflow-hidden">
        <div className="absolute -left-40 top-20 h-72 w-72 rounded-full bg-amber-200/70 blur-3xl" />
        <div className="absolute right-0 top-0 h-80 w-80 rounded-full bg-teal-300/50 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-rose-200/60 blur-3xl" />

        <div className="mx-auto flex min-h-screen max-w-6xl items-center px-5 py-10">
          <div className="grid w-full gap-10 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="flex flex-col justify-center gap-6">
              <div className="inline-flex w-fit items-center gap-3 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-[#f4f1ea]">
                Client ERP Portal
              </div>
              <div>
                <img
                  src="/logo.png?v=erp-20260205"
                  alt="UabIndia ERP"
                  className="h-9 w-auto object-contain"
                  width={110}
                  height={32}
                />
              </div>
              <h1 className={`text-4xl font-semibold leading-tight text-slate-900 md:text-5xl ${displayFont.className}`}>
                Run every team,
                <span className="block text-teal-700">from finance to people.</span>
              </h1>
              <p className="text-base text-slate-700 md:text-lg">
                Secure access for client companies. Manage HRMS, payroll, finance, and operations with a real-time view
                of business performance.
              </p>
              <div className="grid grid-cols-3 gap-4 text-xs text-slate-600">
                <div className="rounded-2xl border border-slate-200 bg-white/80 p-3">
                  <p className="font-semibold text-slate-800">99.9%</p>
                  <p>Uptime</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white/80 p-3">
                  <p className="font-semibold text-slate-800">24x6</p>
                  <p>Support</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white/80 p-3">
                  <p className="font-semibold text-slate-800">ERP</p>
                  <p>Core Suite</p>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl">
                <div className="mb-6">
                  <Link
                    href="/"
                    className="inline-flex items-center text-xs font-semibold text-slate-600 hover:text-slate-900"
                  >
                    ← Back
                  </Link>
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Welcome Back</p>
                  <h2 className={`mt-2 text-3xl font-semibold text-slate-900 ${displayFont.className}`}>Login to ERP</h2>
                  <p className="mt-1 text-sm text-slate-600">Access your company workspace and modules.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4" aria-label="login form">
                  <div>
                    <label htmlFor="login-userid" className="block text-sm font-medium text-slate-700 mb-1">User ID / Email / Mobile</label>
                    <input
                      id="login-userid"
                      name="userId"
                      type="text"
                      value={userId}
                      onChange={(e) => setUserId(e.target.value)}
                      className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600"
                      placeholder="Enter your user ID, email or mobile"
                      autoComplete="username"
                    />
                  </div>

                  <div>
                    <label htmlFor="login-password" className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                    <div className="relative">
                      <input
                        id="login-password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 pr-12"
                        placeholder="Enter your password"
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((s) => !s)}
                        className="absolute inset-y-0 right-3 flex items-center text-sm font-semibold text-teal-700"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? "Hide" : "Show"}
                      </button>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">This is a secure system. Unauthorized access is prohibited.</p>
                  </div>

                  <div className="flex items-center justify-between">
                    <label htmlFor="remember-me" className="flex items-center gap-2 text-sm text-slate-700">
                      <input
                        id="remember-me"
                        name="rememberMe"
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                      />
                      Remember me
                    </label>
                  </div>

                  {error && <p className="text-sm text-red-600">{error}</p>}

                  <button
                    type="submit"
                    className="w-full mt-4 bg-teal-700 text-white py-3 rounded-lg font-semibold hover:bg-teal-800 transition"
                    disabled={isLoading}
                  >
                    {isLoading ? "Signing in..." : "Login"}
                  </button>
                </form>

                <p className="text-xs text-slate-600 text-center mt-6">© 2026 UabIndia . All rights reserved.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
