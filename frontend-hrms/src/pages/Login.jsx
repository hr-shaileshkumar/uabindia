import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { brandingLogoUrl, getCurrentBranding } from '../api/branding';
import { APP_RELEASE_LABEL } from '../config/version';
import { Button, Input } from '../components/ui';
import {
  User,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Activity,
  Users,
  FileCheck2,
  CreditCard,
  Phone,
  ExternalLink,
  HelpCircle,
} from 'lucide-react';

export default function Login() {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [branding, setBranding] = useState(null);

  const auth = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const saved = localStorage.getItem('remembered_user');
    if (saved) setUserId(saved);
    getCurrentBranding()
      .then(setBranding)
      .catch(() => setBranding(null));
  }, []);

  useEffect(() => {
    if (remember && userId.trim()) {
      localStorage.setItem('remembered_user', userId.trim());
    } else {
      localStorage.removeItem('remembered_user');
    }
  }, [remember, userId]);

  const handleUserIdChange = (e) => {
    const val = e.target.value;
    if (/^\d+$/.test(val)) {
      setUserId(val.slice(0, 10));
    } else {
      setUserId(val.slice(0, 30));
    }
  };

  const validate = () => {
    const u = userId.trim();
    if (!u) return 'Enter your User ID or Mobile Number';
    if (/^\d+$/.test(u)) {
      if (u.length !== 10) return 'Mobile number must be exactly 10 digits';
    } else if (u.length < 3) {
      return 'Enter a valid User ID or Mobile Number';
    }
    if (!password.trim()) return 'Enter your password';
    if (password.trim().length < 4) return 'Password must be minimum 4 characters';
    return null;
  };

  useEffect(() => {
    if (auth?.isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [auth?.isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const v = validate();
    if (v) return setError(v);

    setLoading(true);
    try {
      await auth.login({ userId: userId.trim(), password: password.trim() });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const logoSrc = brandingLogoUrl(branding);

  return (
    <div className="min-h-screen min-h-[100dvh] w-full flex overflow-x-hidden bg-slate-50 antialiased selection:bg-purple-600 selection:text-white">
      {/* ========================================================= */}
      {/* LEFT: Clean Enterprise Showcase (Desktop screens)          */}
      {/* ========================================================= */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-8 xl:p-12 bg-gradient-to-br from-purple-50/70 via-white to-amber-50/40 border-r border-slate-200/90 text-slate-800 overflow-hidden">
        {/* Decorative ambient background */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-purple-200/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-orange-200/30 rounded-full blur-3xl pointer-events-none" />

        {/* Top Branding Header */}
        <div className="relative z-10 flex items-center gap-3">
          {logoSrc ? (
            <img
              src={logoSrc}
              alt="Uabindia HRMS Logo"
              className="h-8 xl:h-10 w-auto object-contain"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-purple-700 via-rose-600 to-orange-500 font-extrabold text-white text-lg shadow-md shadow-purple-500/20">
              B
            </div>
          )}
          <div className="border-l border-slate-200 pl-3">
            <div className="font-extrabold text-base tracking-tight text-slate-900">
              Uabindia HRMS
            </div>
            <div className="text-xs text-purple-700 font-semibold">
              Enterprise Workforce Cloud
            </div>
          </div>
        </div>

        {/* Center Showcase Content */}
        <div className="relative z-10 my-auto py-6 max-w-lg space-y-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-purple-100/80 border border-purple-200/80 px-3 py-1 text-xs font-bold text-purple-800 mb-3 shadow-2xs">
              <Sparkles size={14} className="text-purple-600" />
              <span>Modern Enterprise SaaS Platform</span>
            </div>
            <h1 className="text-3xl xl:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Personnel, Attendance & Payroll in one unified cockpit.
            </h1>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Empowering HR leaders and departmental teams with live biometric rosters, GPS punch validation, statutory compliance, and multi-tenant governance.
            </p>
          </div>

          {/* 4 Feature Highlights */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="rounded-2xl border border-purple-200/80 bg-white/95 p-3.5 shadow-2xs">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-100 text-purple-700 mb-2">
                <Users size={16} />
              </div>
              <div className="font-bold text-xs text-slate-900">Personnel Master</div>
              <div className="text-[11px] text-slate-500">Lifecycle, KYC & docs</div>
            </div>

            <div className="rounded-2xl border border-rose-200/80 bg-white/95 p-3.5 shadow-2xs">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-100 text-rose-700 mb-2">
                <Activity size={16} />
              </div>
              <div className="font-bold text-xs text-slate-900">Live Attendance</div>
              <div className="text-[11px] text-slate-500">Biometric & ESS sync</div>
            </div>

            <div className="rounded-2xl border border-orange-200/80 bg-white/95 p-3.5 shadow-2xs">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-100 text-orange-700 mb-2">
                <CreditCard size={16} />
              </div>
              <div className="font-bold text-xs text-slate-900">Automated Payroll</div>
              <div className="text-[11px] text-slate-500">Master Roll locking</div>
            </div>

            <div className="rounded-2xl border border-emerald-200/80 bg-white/95 p-3.5 shadow-2xs">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 mb-2">
                <FileCheck2 size={16} />
              </div>
              <div className="font-bold text-xs text-slate-900">Audit & Governance</div>
              <div className="text-[11px] text-slate-500">Role-based controls</div>
            </div>
          </div>
        </div>

        {/* Bottom Trust Badge */}
        <div className="relative z-10 flex items-center justify-between pt-4 border-t border-slate-200/80 text-xs text-slate-500 font-medium">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-emerald-600" />
            <span>256-Bit TLS Bank-Grade Encryption</span>
          </div>
          <span>{APP_RELEASE_LABEL} Enterprise Edition</span>
        </div>
      </div>

      {/* ========================================================= */}
      {/* RIGHT: Login Card Container (Fluid for Mobile & Desktop)   */}
      {/* ========================================================= */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 lg:p-12 relative overflow-y-auto">
        <div className="w-full max-w-md my-auto py-6">
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl p-6 sm:p-8">
            {/* Mobile Branding Header */}
            <div className="text-center mb-6">
              {logoSrc ? (
                <img
                  src={logoSrc}
                  alt="Uabindia HRMS Logo"
                  className="h-10 w-auto object-contain mx-auto mb-3"
                />
              ) : (
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-purple-700 via-rose-600 to-orange-500 text-white font-black text-xl flex items-center justify-center mx-auto mb-3 shadow-md shadow-purple-600/20">
                  U
                </div>
              )}
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
                Sign in to your account
              </h2>
              <p className="mt-1 text-xs text-slate-500 font-medium">
                Enter your credentials to access the Uabindia HRMS portal
              </p>
            </div>

            {/* Error Message Alert */}
            {error && (
              <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-center text-xs font-semibold text-rose-700 animate-in fade-in duration-150">
                {error}
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="User ID or Mobile Number"
                type="text"
                value={userId}
                onChange={handleUserIdChange}
                maxLength={/^\d+$/.test(userId) ? 10 : 30}
                placeholder="e.g. userid or 9999999999"
                icon={User}
                required
              />

              <div>
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your account password"
                  icon={Lock}
                  endIcon={showPassword ? EyeOff : Eye}
                  onEndIconClick={() => setShowPassword(!showPassword)}
                  required
                />
                <div className="flex justify-end mt-1.5">
                  <Link
                    to="/reset-password"
                    className="text-xs font-bold text-purple-700 hover:text-purple-900 transition"
                  >
                    Forgot password?
                  </Link>
                </div>
              </div>

              {/* Remember me toggle */}
              <div className="flex items-center pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    id="remember-credentials"
                    name="rememberCredentials"
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500/20 cursor-pointer"
                  />
                  <span className="text-xs text-slate-600 font-medium">
                    Remember credentials on this device
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                variant="primary"
                size="md"
                loading={loading}
                icon={ArrowRight}
                iconPosition="right"
                className="w-full h-11 mt-2 text-sm shadow-md whitespace-nowrap"
              >
                Sign In to Dashboard
              </Button>
            </form>

            {/* Help & First-time Banner */}
            <div className="mt-5 rounded-2xl border border-purple-100 bg-purple-50/60 p-3.5 text-center">
              <p className="text-xs text-slate-600 leading-normal">
                First time logging in or need to setup password?
              </p>
              <div className="mt-1">
                <Link
                  to="/reset-password"
                  className="inline-flex items-center justify-center font-bold text-purple-700 hover:text-purple-900 underline underline-offset-2 text-xs"
                >
                  Verify via Mobile OTP
                </Link>
              </div>
            </div>

            {/* Support Helpline & ERP Portal Switcher */}
            <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1.5 font-medium">
                  <Phone size={13} className="text-indigo-600" />
                  Support:
                </span>
                <a
                  href="tel:+917903055384"
                  className="font-bold text-slate-800 hover:text-indigo-600 transition-colors"
                >
                  +91 7903055384
                </a>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1.5 font-medium">
                  <HelpCircle size={13} className="text-purple-600" />
                  Core ERP & Finance:
                </span>
                <a
                  href="/"
                  className="inline-flex items-center gap-1 font-semibold text-purple-700 hover:text-purple-900 transition-colors"
                >
                  Main Portal <ExternalLink size={11} />
                </a>
              </div>
            </div>
          </div>

          {/* Footer Copyright & Security */}
          <div className="text-center text-xs text-slate-400 mt-4 space-y-1">
            <p>© 2026 Uabindia HRMS • All Rights Reserved</p>
            <p className="text-[11px] text-slate-400">Global Multi-Tenant Cloud · Multi-Region Tier-IV Security & SOC-2 Compliant</p>
          </div>
        </div>
      </div>
    </div>
  );
}
