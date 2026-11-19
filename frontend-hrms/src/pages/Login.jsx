import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  Eye,
  EyeOff,
  Building2,
  Lock,
  Mail,
  ArrowRight,
  Sparkles,
  AlertCircle,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNotification } from "../context/NotificationContext";
import apiClient from "../api/client";

export const Login = () => {
  const navigate = useNavigate();
  const { login, loading } = useAuth();
  const { notifySuccess, notifyError } = useNotification();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [workspaceDomain, setWorkspaceDomain] = useState("erp");
  const [showWorkspaceInput, setShowWorkspaceInput] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [backendStatus, setBackendStatus] = useState("checking"); // "checking" | "online" | "offline"

  // Live Backend Health Probe
  const checkBackendHealth = async () => {
    try {
      // Light probe to CSRF token endpoint
      await apiClient.get("/auth/csrf-token", { timeout: 3000 });
      setBackendStatus("online");
    } catch (err) {
      if (err.response) {
        // Backend replied with an HTTP code -> server is alive!
        setBackendStatus("online");
      } else {
        // Network connection refused or timeout -> server is down
        setBackendStatus("offline");
      }
    }
  };

  useEffect(() => {
    checkBackendHealth();
    const interval = setInterval(checkBackendHealth, 8000);
    return () => clearInterval(interval);
  }, []);

  // Load remembered login if available
  useEffect(() => {
    try {
      const savedEmail = localStorage.getItem("hrms_remembered_email");
      if (savedEmail) {
        setIdentifier(savedEmail);
      }
      const savedTenant = localStorage.getItem("hrms_tenant");
      if (savedTenant && savedTenant !== "demo") {
        setWorkspaceDomain(savedTenant);
      }
    } catch (e) {}
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    const emailTrimmed = identifier.trim();
    if (!emailTrimmed) {
      setErrorMessage("Please enter your work email or user ID.");
      return;
    }
    if (!password) {
      setErrorMessage("Please enter your account password.");
      return;
    }

    if (backendStatus === "offline") {
      setErrorMessage(
        "Cannot sign in: The backend server is offline or unreachable at http://localhost:5000. Please start the backend service."
      );
      notifyError("Backend service is offline. Please start the server on port 5000.");
      return;
    }

    const tenantSubdomain = (workspaceDomain || "erp").trim().toLowerCase();

    try {
      const res = await login({
        email: emailTrimmed,
        password,
        tenantSubdomain,
      });

      if (rememberMe) {
        localStorage.setItem("hrms_remembered_email", emailTrimmed);
      } else {
        localStorage.removeItem("hrms_remembered_email");
      }

      if (res.success) {
        notifySuccess("Authenticated successfully into HRMS Enterprise Portal");
        navigate("/dashboard");
      }
    } catch (err) {
      const msg = err.message || "Invalid work credentials. Please check and try again.";
      setErrorMessage(msg);
      notifyError(msg);
      // Re-check backend health
      checkBackendHealth();
    }
  };

  const handleQuickFill = (emailVal, passVal = "Admin@123", domain = "erp") => {
    setIdentifier(emailVal);
    setPassword(passVal);
    setWorkspaceDomain(domain);
    setErrorMessage("");
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col justify-between selection:bg-blue-600 selection:text-white">
      {/* Top Header Navigation */}
      <header className="w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white font-black text-lg flex items-center justify-center shadow-md shadow-blue-600/30 group-hover:scale-105 transition-transform">
              U
            </div>
            <div className="flex flex-col">
              <span className="text-base font-extrabold tracking-tight text-slate-900 leading-none">
                Uabindia <span className="text-blue-600">HRMS</span>
              </span>
              <span className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase mt-1">
                Enterprise People OS
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            {/* Live Backend Connection Status Pill */}
            {backendStatus === "online" ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                <span>Backend Online (Port 5000)</span>
              </div>
            ) : backendStatus === "offline" ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold animate-pulse">
                <WifiOff className="w-3.5 h-3.5 text-rose-600" />
                <span>Backend Offline (Port 5000 Down)</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 border border-slate-200 text-slate-500 text-xs">
                <span className="w-2 h-2 rounded-full bg-slate-400 animate-ping"></span>
                <span>Connecting to Port 5000...</span>
              </div>
            )}

            <Link
              to="/pricing"
              className="text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors hidden sm:block"
            >
              Enterprise Plans
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center px-4 py-10 sm:py-16">
        <div className="w-full max-w-md">
          {/* Main Auth Card */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-[0_12px_40px_-16px_rgba(15,23,42,0.10)] p-7 sm:p-9 backdrop-blur-md">
            {/* Header */}
            <div className="mb-6">
              <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full mb-2 border border-blue-100">
                Enterprise Workspace Sign In
              </span>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Welcome Back
              </h1>
              <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
                Enter your work credentials to access the human resources console, attendance records, and workforce operations.
              </p>
            </div>

            {/* Offline Alert Warning if Backend is Down */}
            {backendStatus === "offline" && (
              <div className="mb-5 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="flex-1 leading-relaxed">
                  <strong className="font-bold">Backend service is not running:</strong> Login requires an active backend connection. Start the .NET API server on port 5000 to sign in.
                </div>
              </div>
            )}

            {/* Error Message Alert */}
            {errorMessage && (
              <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div className="flex-1 font-medium leading-relaxed">{errorMessage}</div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Work Email / Username */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Work Email or User ID
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="admin@uabindia.in or name@company.com"
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-sans"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Password
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-10 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Optional Workspace Domain (Accordion/Toggle) */}
              <div className="pt-1">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-600">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500/20 accent-blue-600 cursor-pointer"
                    />
                    <span>Remember this device</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => setShowWorkspaceInput(!showWorkspaceInput)}
                    className="text-xs text-slate-500 hover:text-blue-600 font-medium transition-colors"
                  >
                    {showWorkspaceInput ? "Default workspace (erp)" : "Tenant: " + (workspaceDomain || "erp")}
                  </button>
                </div>

                {showWorkspaceInput && (
                  <div className="mt-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs animate-in fade-in duration-150">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Organization Tenant Subdomain
                    </label>
                    <div className="relative flex rounded-lg">
                      <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                        <Building2 className="w-3.5 h-3.5" />
                      </div>
                      <input
                        type="text"
                        value={workspaceDomain}
                        onChange={(e) => setWorkspaceDomain(e.target.value)}
                        placeholder="erp"
                        className="w-full pl-8 pr-2 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || backendStatus === "offline"}
                className="w-full h-11 mt-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Signing in to Workspace...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to HRMS Console</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Credentials Assistant */}
            <div className="mt-6 pt-5 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Quick-fill Credentials</span>
                </span>
                <span className="text-[10px] text-slate-400">1-click fill</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickFill("admin@uabindia.in", "Admin@123", "erp")}
                  className="p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-blue-400 text-left transition-all group cursor-pointer"
                >
                  <div className="text-[11px] font-bold text-slate-800 group-hover:text-blue-600 truncate">
                    Enterprise Admin
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">admin@uabindia.in</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickFill("pooja.v@uabindia.in", "Admin@123", "erp")}
                  className="p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-blue-400 text-left transition-all group cursor-pointer"
                >
                  <div className="text-[11px] font-bold text-slate-800 group-hover:text-blue-600 truncate">
                    Pooja Verma (HR)
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">pooja.v@uabindia.in</div>
                </button>
              </div>
            </div>
          </div>

          {/* Footer Security Badges */}
          <div className="mt-6 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>256-Bit SSL Encryption • Tenant Isolated • SOC-2 Type II Certified</span>
          </div>
        </div>
      </main>

      {/* Public Footer */}
      <footer className="w-full border-t border-slate-200/80 bg-white py-4 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>© {new Date().getFullYear()} Uabindia Enterprise OS. All rights reserved.</span>
          <div className="flex items-center gap-4 text-slate-500">
            <Link to="/pricing" className="hover:text-blue-600 transition-colors">Pricing</Link>
            <span>•</span>
            <span className="text-slate-400">HRMS Portal v1.0.1</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Login;
