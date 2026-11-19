import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Check,
  ArrowRight,
  ChevronDown,
} from "lucide-react";
import PublicLayout from "../../components/public/PublicLayout";

export const Pricing = () => {
  const [billingCycle, setBillingCycle] = useState("annual"); // "monthly" | "annual"
  const [openFaq, setOpenFaq] = useState(null);

  const tiers = [
    {
      name: "Starter",
      description: "For emerging startups getting started with clean digital attendance.",
      price: billingCycle === "annual" ? 0 : 0,
      period: "free forever",
      badge: "Free Tier",
      badgeColor: "bg-slate-100 text-slate-700 border-slate-200",
      features: [
        "Up to 25 Employees Included",
        "Employee Directory & 360 Dossiers",
        "Web Geofence Duty Punching",
        "Standard Leave Management",
        "Employee Self-Service (ESS)",
        "Email Support",
      ],
      ctaText: "Start Free",
      ctaLink: "/login",
      popular: false,
    },
    {
      name: "Professional",
      description: "Complete workforce operations, shift rostering, and leave governance.",
      price: billingCycle === "annual" ? 39 : 49,
      period: "/ user / month",
      badge: "Most Popular",
      badgeColor: "bg-blue-600 text-white shadow-md shadow-blue-500/20",
      features: [
        "Unlimited Employees",
        "Everything in Starter, plus:",
        "Monthly Muster Roll Matrix",
        "Multi-tier Shift Rostering",
        "5-Stage ATS Recruitment Kanban",
        "Statutory Leave Policy Engine",
        "Manager Approval Workflows (MSS)",
        "Priority Support (4-hour SLA)",
      ],
      ctaText: "Choose Professional",
      ctaLink: "/login",
      popular: true,
    },
    {
      name: "Enterprise",
      description: "Full-scale People OS with 1-click payroll and hardware biometric gateway.",
      price: billingCycle === "annual" ? 79 : 99,
      period: "/ user / month",
      badge: "Enterprise Scale",
      badgeColor: "bg-indigo-100 text-indigo-700 border-indigo-200",
      features: [
        "Everything in Professional, plus:",
        "1-Click Statutory Payroll Engine",
        "Automated EPF, ESI, TDS Form 16",
        "Biometric Hardware Gateway Integration",
        "7-Tier Location Hierarchy",
        "Interactive D3 Org Structure Chart",
        "Custom Policy Formulation & Slabs",
        "Dedicated Customer Success Manager",
      ],
      ctaText: "Deploy Enterprise",
      ctaLink: "/login",
      popular: false,
    },
  ];

  const faqs = [
    {
      q: "Can I use UabIndia HRMS for multiple branches and locations?",
      a: "Yes! UabIndia HRMS natively supports a 7-tier geographic location hierarchy (Global HQ, Zone, Region, Cluster, Facility, Floor, Department), allowing unified management across multiple cities.",
    },
    {
      q: "How does GPS Geofence attendance prevent buddy punching?",
      a: "Our GPS Geofence system validates the employee's physical device coordinates against your designated facility radius (e.g. 250m) and pairs with facial match verification to ensure 100% attendance authenticity.",
    },
    {
      q: "Are Indian statutory deductions (PF, ESI, TDS, PT) supported out-of-the-box?",
      a: "Yes, our payroll module is completely pre-configured for statutory Indian compliance, including wage ceiling checks (PF ₹15,000, ESI ₹21,000), state-wise Professional Tax slabs, and Old vs New tax regimes.",
    },
    {
      q: "Can I connect my physical biometric fingerprint or face scanners?",
      a: "Absolutely. Our Enterprise tier includes a Biometric Hardware Gateway that connects seamlessly with ZKTeco, eSSL, Realtime, and Hikvision devices to stream punch data in real-time.",
    },
  ];

  return (
    <PublicLayout>
      {/* 1. Header */}
      <section className="pt-12 pb-16 sm:pt-16 sm:pb-20 text-center bg-gradient-to-b from-blue-50/50 via-white to-[#f8fafc] border-b border-slate-200/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
            Simple & Transparent Pricing
          </span>
          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight mt-3">
            Scale Your People Operations Without Hidden Costs
          </h1>
          <p className="mt-3 text-xs sm:text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
            Choose the right tier for your organization. Pay only for active workforce members.
          </p>

          {/* Billing Switcher */}
          <div className="mt-8 inline-flex items-center gap-2 p-1 rounded-full bg-slate-100 border border-slate-200">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                billingCycle === "monthly"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingCycle("annual")}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                billingCycle === "annual"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>Annual Billing</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${billingCycle === "annual" ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-700"}`}>
                Save 20%
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. Pricing Cards Grid */}
      <section className="py-12 sm:py-16 bg-[#f8fafc] border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 items-stretch">
            {tiers.map((tier) => (
              <div
                key={tier.name}
                className={`relative rounded-2xl p-6 sm:p-8 flex flex-col justify-between transition-all ${
                  tier.popular
                    ? "bg-white border-2 border-blue-600 shadow-xl shadow-blue-600/10 ring-4 ring-blue-500/10 scale-100 lg:-translate-y-2"
                    : "bg-white border border-slate-200 shadow-sm hover:border-slate-300"
                }`}
              >
                <div>
                  {/* Badge */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-base font-extrabold text-slate-900">{tier.name}</span>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${tier.badgeColor}`}>
                      {tier.badge}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed min-h-[36px]">
                    {tier.description}
                  </p>

                  {/* Price */}
                  <div className="mt-5 pb-5 border-b border-slate-100 flex items-baseline gap-1">
                    <span className="text-3xl sm:text-4xl font-black text-slate-900">
                      ₹{tier.price}
                    </span>
                    <span className="text-xs text-slate-400 font-semibold">{tier.period}</span>
                  </div>

                  {/* Feature Checklist */}
                  <div className="mt-6 space-y-2.5 text-xs text-slate-700">
                    <div className="text-[10.5px] uppercase font-bold text-slate-400 tracking-wider">
                      Included Capabilities
                    </div>
                    {tier.features.map((feat) => (
                      <div key={feat} className="flex items-start gap-2.5">
                        <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CTA Button */}
                <div className="mt-8 pt-4">
                  <Link
                    to={tier.ctaLink}
                    className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm ${
                      tier.popular
                        ? "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/25"
                        : "bg-slate-900 hover:bg-slate-800 text-white"
                    }`}
                  >
                    <span>{tier.ctaText}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. FAQ Section */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Clear Answers
            </span>
            <h2 className="text-xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-200/90 bg-[#f8fafc] overflow-hidden transition-colors"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full p-4 text-left flex items-center justify-between text-xs font-bold text-slate-800 hover:text-blue-600 transition-colors"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 transition-transform ${
                        isOpen ? "rotate-180 text-blue-600" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 text-xs text-slate-600 leading-relaxed border-t border-slate-200/60 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};

export default Pricing;
