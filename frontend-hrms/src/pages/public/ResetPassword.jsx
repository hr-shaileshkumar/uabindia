import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle2,
  ShieldCheck,
  Check,
} from "lucide-react";
import PublicLayout from "../../components/public/PublicLayout";
import { useNotification } from "../../context/NotificationContext";

export const ResetPassword = () => {
  const navigate = useNavigate();
  const { notifySuccess, notifyError } = useNotification();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password.length < 8) {
      notifyError("Password must be at least 8 characters long");
      return;
    }
    if (password !== confirmPassword) {
      notifyError("Passwords do not match");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      notifySuccess("Password updated successfully! Please sign in with your new credentials.");
      navigate("/login");
    }, 600);
  };

  const hasLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  return (
    <PublicLayout>
      <div className="py-16 sm:py-24 max-w-md mx-auto px-4 sm:px-6">
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-xl shadow-slate-900/5">
          <div className="text-center mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
              <Lock className="w-5 h-5" />
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900">
              Define Secure New Password
            </h1>
            <p className="mt-1 text-xs text-slate-500 leading-relaxed">
              Ensure your new credentials conform to corporate password complexity guidelines.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-3 pr-9 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Confirm New Password
              </label>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              />
            </div>

            {/* Password strength checklist */}
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-[11px] space-y-1.5 text-slate-600">
              <div className="flex items-center gap-1.5">
                <Check className={`w-3.5 h-3.5 ${hasLength ? "text-emerald-600 font-bold" : "text-slate-300"}`} />
                <span>At least 8 characters</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className={`w-3.5 h-3.5 ${hasUpper ? "text-emerald-600 font-bold" : "text-slate-300"}`} />
                <span>At least one uppercase letter (A-Z)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className={`w-3.5 h-3.5 ${hasNumber ? "text-emerald-600 font-bold" : "text-slate-300"}`} />
                <span>At least one numerical digit (0-9)</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !hasLength}
              className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/25 flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
            >
              <span>{loading ? "Updating..." : "Update Password"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </PublicLayout>
  );
};

export default ResetPassword;
