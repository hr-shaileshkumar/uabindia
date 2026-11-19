import React from "react";
import { Link } from "react-router-dom";
import {
  Users,
  Clock,
  Calendar,
  Briefcase,
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  MapPin,
  Sparkles,
  Award,
  Lock,
  Zap,
  Building2,
  Check,
} from "lucide-react";
import PublicLayout from "../../components/public/PublicLayout";
import { useAuth } from "../../context/AuthContext";

export const Landing = () => {
  const { user } = useAuth();

  return (
    <PublicLayout>
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28 border-b border-slate-200/80 bg-gradient-to-b from-blue-50/40 via-white to-[#f8fafc]">
        {/* Subtle decorative sapphire gradient blobs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[850px] h-[450px] bg-gradient-to-b from-blue-400/10 via-indigo-400/5 to-transparent blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          {/* Release Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold shadow-2xs mb-6 hover:bg-blue-100/60 transition-colors">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>UabIndia HRMS 2.0 • Purpose-Built for Enterprise Scale</span>
            <span className="w-1 h-1 rounded-full bg-blue-400" />
            <span className="text-blue-600 font-semibold">Live in Production</span>
          </div>

          {/* Main Title */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-tight max-w-4xl mx-auto">
            The Complete <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 bg-clip-text text-transparent">People Platform</span> for Modern Enterprises
          </h1>

          {/* Subtitle */}
          <p className="mt-4 sm:mt-6 text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed font-normal">
            Streamline your entire workforce lifecycle in one unified cloud. Geofenced duty punches, biometric muster rolls, 5-stage ATS hiring pipelines, statutory leave governance, and 1-click automated payroll.
          </p>

          {/* CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            {user ? (
              <Link
                to="/dashboard"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-lg shadow-blue-600/30 hover:shadow-xl transition-all"
              >
                <span>Open HR Console</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <Link
                to="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-lg shadow-blue-600/30 hover:shadow-xl transition-all"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Sign In to Your Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}

            <Link
              to="/pricing"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs border border-slate-200 shadow-2xs hover:border-slate-300 transition-all"
            >
              <span>Explore Pricing & Modules</span>
            </Link>
          </div>

          {/* Trust Highlights */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-[11px] font-semibold text-slate-500">
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-500" />
              Multi-Tenant Architecture
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-500" />
              Indian Labor Law Compliant
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-500" />
              Real-time Geofenced Clock-in
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-500" />
              Instant PDF Payslips
            </span>
          </div>

          {/* Interactive Hero SaaS Cockpit Mockup */}
          <div className="mt-12 lg:mt-16 max-w-5xl mx-auto rounded-2xl border border-slate-200/90 bg-white p-3 sm:p-5 shadow-2xl shadow-blue-900/10">
            <div className="rounded-xl bg-slate-950 p-4 sm:p-6 text-white text-left space-y-4">
              {/* Mockup Topbar */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">
                    https://uabindia.in/hrms/live-cockpit
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    ● Production Live
                  </span>
                </div>
              </div>

              {/* Floating Live KPI Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Workforce Size</div>
                  <div className="text-lg font-black text-white mt-1">1,248</div>
                  <div className="text-[9.5px] text-emerald-400 mt-0.5">↑ 12% quarterly growth</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Today&apos;s Attendance</div>
                  <div className="text-lg font-black text-emerald-400 mt-1">96.4%</div>
                  <div className="text-[9.5px] text-slate-400 mt-0.5">Geofence Verified</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Payroll Status</div>
                  <div className="text-lg font-black text-blue-400 mt-1">₹45.1L</div>
                  <div className="text-[9.5px] text-slate-400 mt-0.5">Auto-processed on 1st</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Open Requisitions</div>
                  <div className="text-lg font-black text-amber-400 mt-1">24 Roles</div>
                  <div className="text-[9.5px] text-slate-400 mt-0.5">5-Stage ATS Active</div>
                </div>
              </div>

              {/* Mockup Preview Row: Geofence Punch Cockpit + Candidate Pipeline */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* Geofence Simulator Widget */}
                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-600/30 text-blue-400 flex items-center justify-center shrink-0">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-200">Bangalore Tech Park Campus</div>
                      <div className="text-[10.5px] text-slate-400">GPS Radius 250m • Biometric Face Match OK</div>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-emerald-600 text-white">
                    Present
                  </span>
                </div>

                {/* Payroll Badge */}
                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-600/30 text-emerald-400 flex items-center justify-center shrink-0">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-200">Statutory Tax & PF Compliance</div>
                      <div className="text-[10.5px] text-slate-400">EPF 12%, ESI 0.75%, Professional Tax Automated</div>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-blue-600 text-white">
                    Verified
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Key Pillars / Feature Breakdown */}
      <section id="features" className="py-16 sm:py-24 bg-white border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
              Core Platform Modules
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-3">
              Everything HR Needs. Built for Total Accuracy.
            </h2>
            <p className="mt-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
              Eliminate disconnected spreadsheets and error-prone manual calculations with modern enterprise workflows.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mt-12 lg:mt-16">
            {/* Feature 1: Core HR & 360 View */}
            <div className="p-6 rounded-2xl bg-[#f8fafc] border border-slate-200/80 hover:border-blue-400/60 hover:shadow-lg transition-all group">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Workforce & Employee 360</h3>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Centralized personnel dossiers, grade masters, employment types, emergency contacts, statutory IDs (PAN, Aadhaar, UAN), and asset allocations.
              </p>
            </div>

            {/* Feature 2: Time & Geofence Attendance */}
            <div className="p-6 rounded-2xl bg-[#f8fafc] border border-slate-200/80 hover:border-blue-400/60 hover:shadow-lg transition-all group">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Geofence & Biometric Attendance</h3>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                GPS coordinate validation, facial recognition match, monthly muster rolls, overtime multi-tier rules, and automated regularization workflows.
              </p>
            </div>

            {/* Feature 3: Statutory Leave Governance */}
            <div className="p-6 rounded-2xl bg-[#f8fafc] border border-slate-200/80 hover:border-blue-400/60 hover:shadow-lg transition-all group">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Calendar className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Leave Quotas & Absence Policies</h3>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Define annual quota allocations, carry-forward caps, encashment thresholds, sandwich leave penalty rules, and multi-tier manager approvals.
              </p>
            </div>

            {/* Feature 4: 5-Stage ATS Recruitment Kanban */}
            <div className="p-6 rounded-2xl bg-[#f8fafc] border border-slate-200/80 hover:border-blue-400/60 hover:shadow-lg transition-all group">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Briefcase className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Recruitment & ATS Pipeline</h3>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Post job requisitions, track candidates across an interactive 5-stage drag-and-drop Kanban board, schedule panel screenings, and generate digital offer letters.
              </p>
            </div>

            {/* Feature 5: 1-Click Automated Payroll */}
            <div className="p-6 rounded-2xl bg-[#f8fafc] border border-slate-200/80 hover:border-blue-400/60 hover:shadow-lg transition-all group">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <CreditCard className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Compliant 1-Click Payroll</h3>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Instant gross-to-net computation, EPF/ESI statutory calculations, TDS tax slabs, arrears handling, and automated downloadable PDF payslips.
              </p>
            </div>

            {/* Feature 6: Employee & Manager Self-Service */}
            <div className="p-6 rounded-2xl bg-[#f8fafc] border border-slate-200/80 hover:border-blue-400/60 hover:shadow-lg transition-all group">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Self-Service Portals (ESS / MSS)</h3>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Empower your workforce to view attendance, apply for leaves, download payslips, inspect assigned assets, and allow line managers to approve requests on mobile or web.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Statutory Compliance Section */}
      <section id="compliance" className="py-16 sm:py-20 bg-slate-950 text-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30">
                100% Indian Labor Law Compliant
              </span>
              <h2 className="text-2xl sm:text-4xl font-black tracking-tight mt-3">
                Statutory Governance with Zero Audit Risk
              </h2>
              <p className="mt-3 text-xs sm:text-sm text-slate-400 leading-relaxed">
                UabIndia HRMS automates every compliance mandate prescribed under the Indian Labor Code, ensuring accurate calculations and direct file export for government portals.
              </p>

              <div className="mt-6 space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold text-slate-200">EPF & ESI Auto-Calculation</div>
                    <div className="text-[11px] text-slate-400">Strict wage ceiling enforcement (₹15,000 / ₹21,000) with ECR text export.</div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold text-slate-200">State-wise Professional Tax (PT)</div>
                    <div className="text-[11px] text-slate-400">Built-in tax slab structures for Maharashtra, Karnataka, Tamil Nadu, Delhi, and more.</div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold text-slate-200">TDS & Form 16 Tax Regime Support</div>
                    <div className="text-[11px] text-slate-400">Supports both Old & New Income Tax regimes with declaration verification.</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Enterprise Cloud Security Standards
              </h3>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <ShieldCheck className="w-4 h-4 text-blue-400 mb-1" />
                  <div className="font-bold text-slate-200">SOC-2 Type II</div>
                  <div className="text-[10px] text-slate-500">Independently audited</div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <Lock className="w-4 h-4 text-indigo-400 mb-1" />
                  <div className="font-bold text-slate-200">TLS 1.3 / AES-256</div>
                  <div className="text-[10px] text-slate-500">Cryptographic protection</div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <Building2 className="w-4 h-4 text-emerald-400 mb-1" />
                  <div className="font-bold text-slate-200">Multi-Tenant Vault</div>
                  <div className="text-[10px] text-slate-500">Database-level row isolation</div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                  <Award className="w-4 h-4 text-amber-400 mb-1" />
                  <div className="font-bold text-slate-200">99.99% Cloud SLA</div>
                  <div className="text-[10px] text-slate-500">High availability clusters</div>
                </div>
              </div>

              <div className="pt-2 text-center">
                <Link
                  to="/login"
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/30 transition-all"
                >
                  <span>Access Secure Client Portal</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Bottom Action CTA */}
      <section className="py-16 sm:py-20 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight">
            Ready to Modernize Your Workforce Management?
          </h2>
          <p className="mt-3 text-xs sm:text-sm text-blue-100 max-w-xl mx-auto leading-relaxed">
            Deploy your dedicated enterprise tenant in minutes. Clean, fast, and compliant.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/login"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white hover:bg-slate-100 text-blue-700 font-extrabold text-xs shadow-xl transition-all"
            >
              Sign In to HRMS Console
            </Link>
            <Link
              to="/pricing"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-blue-800/80 hover:bg-blue-800 text-white font-bold text-xs border border-white/20 transition-all"
            >
              View Transparent Pricing
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};

export default Landing;
