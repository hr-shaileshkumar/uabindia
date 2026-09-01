"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import HeaderSummary from "@/components/layout/HeaderSummary";
import { erpButtonClassName } from "@/components/workspace/styles";
import apiClient from "@/services/apiClient";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { getApiErrorMessage } from "@/lib/api-errors";
import { Check, Zap, Shield, HardDrive, Users, ArrowRight, CreditCard } from "lucide-react";

type Plan = {
  id?: string;
  planCode: string;
  name: string;
  description: string;
  monthlyPriceInr: number;
  annualPriceInr: number;
  maxUsers: number;
  maxStorageMb: number;
  maxApiCallsPerDay: number;
  sortOrder: number;
};

type SubscriptionData = {
  planCode: string;
  status: string;
  billingCycle: string;
  amount: number;
  startDate: string;
  endDate?: string;
  trialEndsAt?: string;
  gatewayProvider?: string;
};

type UsageData = {
  activeUsers: number;
  maxUsers: number;
  storageMb: number;
  maxStorageMb: number;
  daysRemaining: number;
};

export default function LicensingOverviewPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [sub, setSub] = useState<SubscriptionData | null>(null);
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAnnual, setIsAnnual] = useState(false);
  const [checkoutPlan, setCheckoutPlan] = useState<Plan | null>(null);
  const [processing, setProcessing] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [plansRes, currentRes] = await Promise.all([
        apiClient.get<{ success: boolean; plans: Plan[] }>("/subscriptions/plans"),
        apiClient.get<{ success: boolean; subscription: SubscriptionData; usage: UsageData }>("/subscriptions/current"),
      ]);

      if (plansRes.data?.plans) setPlans(plansRes.data.plans);
      if (currentRes.data?.subscription) setSub(currentRes.data.subscription);
      if (currentRes.data?.usage) setUsage(currentRes.data.usage);
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Failed to load subscription details."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handleCheckout = async (gateway: "Razorpay" | "Stripe") => {
    if (!checkoutPlan) return;
    try {
      setProcessing(true);
      const sessionRes = await apiClient.post<{ orderId: string; amount: number; planCode: string }>(
        "/subscriptions/checkout-session",
        {
          planCode: checkoutPlan.planCode,
          billingCycle: isAnnual ? "Annual" : "Monthly",
          gateway,
        }
      );

      const paymentId = `${gateway.toLowerCase()}_pay_${Date.now()}`;
      await apiClient.post("/subscriptions/verify-payment", {
        planCode: checkoutPlan.planCode,
        billingCycle: isAnnual ? "Annual" : "Monthly",
        orderId: sessionRes.data.orderId,
        paymentId,
        gateway,
      });

      notifySuccess(`Payment verified! Upgraded to ${checkoutPlan.name}.`);
      setCheckoutPlan(null);
      await loadData();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Payment processing failed."));
    } finally {
      setProcessing(false);
    }
  };

  const inr = (val?: number) => `₹${(val ?? 0).toLocaleString("en-IN")}`;

  return (
    <StandardPageLayout
      title="SaaS Subscriptions & Licensing"
      subtitle="Manage your tenant subscription, plan tier, user seat quotas, and payment methods."
      eyebrow="Platform / SaaS Billing"
      icon="key"
      meta={
        <HeaderSummary
          items={[
            { label: "Active Plan", value: sub?.planCode?.toUpperCase() || "TRIAL", tone: "info" },
            { label: "Days Left", value: usage?.daysRemaining ?? "14", tone: "warning" },
            {
              label: "User Seats",
              value: `${usage?.activeUsers ?? 1} / ${usage?.maxUsers ?? 5}`,
              tone: "success",
            },
            {
              label: "Storage Used",
              value: `${((usage?.storageMb ?? 0) / 1024).toFixed(1)} GB / ${((usage?.maxStorageMb ?? 2048) / 1024).toFixed(0)} GB`,
              tone: "default",
            },
          ]}
        />
      }
      actions={
        <div className="flex gap-2">
          <Link href="/licensing/billing-history" className={erpButtonClassName.secondary}>
            Billing History
          </Link>
          <Link href="/licensing/subscriptions" className={erpButtonClassName.secondary}>
            Module Entitlements
          </Link>
        </div>
      }
    >
      {/* Current Quota Progress */}
      <div className="grid gap-4 md:grid-cols-2 mt-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-indigo-600" />
              <span className="text-sm font-semibold text-slate-800">User Seats Quota</span>
            </div>
            <span className="text-xs font-mono text-slate-500">
              {usage?.activeUsers ?? 1} of {usage?.maxUsers ?? 5} seats used
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, (((usage?.activeUsers ?? 1) / (usage?.maxUsers ?? 5)) * 100))}%`,
              }}
            />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <HardDrive className="h-5 w-5 text-emerald-600" />
              <span className="text-sm font-semibold text-slate-800">Cloud Storage Quota</span>
            </div>
            <span className="text-xs font-mono text-slate-500">
              {((usage?.storageMb ?? 0) / 1024).toFixed(1)} GB / {((usage?.maxStorageMb ?? 2048) / 1024).toFixed(0)} GB
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-emerald-600 h-2.5 rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, (((usage?.storageMb ?? 0) / (usage?.maxStorageMb ?? 2048)) * 100))}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Plan Billing Cycle Switcher */}
      <div className="mt-8 flex flex-col items-center justify-center">
        <h2 className="text-xl font-bold text-slate-900">Choose the Right Plan for Your Business</h2>
        <p className="text-sm text-slate-500 mt-1">Upgrade or scale your plan anytime with automated billing.</p>

        <div className="mt-4 inline-flex items-center rounded-lg bg-slate-100 p-1 border border-slate-200">
          <button
            type="button"
            className={`px-4 py-1.5 text-xs font-semibold rounded-md transition ${
              !isAnnual ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
            onClick={() => setIsAnnual(false)}
          >
            Monthly Billing
          </button>
          <button
            type="button"
            className={`px-4 py-1.5 text-xs font-semibold rounded-md transition ${
              isAnnual ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
            onClick={() => setIsAnnual(true)}
          >
            Annual Billing <span className="ml-1 text-emerald-600 font-bold">(Save 20%)</span>
          </button>
        </div>
      </div>

      {/* Pricing Matrix */}
      <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {plans.map((p) => {
          const isCurrent = (sub?.planCode || "trial").toLowerCase() === p.planCode.toLowerCase();
          const price = isAnnual ? p.annualPriceInr : p.monthlyPriceInr;

          return (
            <div
              key={p.planCode}
              className={`rounded-2xl border bg-white p-6 shadow-sm flex flex-col justify-between transition hover:shadow-md ${
                isCurrent ? "border-indigo-600 ring-2 ring-indigo-600/20" : "border-slate-200"
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-900">{p.name}</h3>
                  {isCurrent && (
                    <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-2 min-h-[32px]">{p.description}</p>

                <div className="mt-4">
                  <span className="text-2xl font-extrabold text-slate-900">{inr(price)}</span>
                  <span className="text-xs text-slate-500 font-normal"> / {isAnnual ? "year" : "month"}</span>
                </div>

                <ul className="mt-6 space-y-2.5 text-xs text-slate-600">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                    <span>Up to <strong>{p.maxUsers}</strong> User Seats</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                    <span><strong>{(p.maxStorageMb / 1024).toFixed(0)} GB</strong> Document Storage</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                    <span>Full GST &amp; Accounting Engine</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                    <span>Multi-Branch &amp; Cost Centers</span>
                  </li>
                </ul>
              </div>

              <div className="mt-8">
                {isCurrent ? (
                  <button type="button" disabled className="w-full rounded-lg bg-slate-100 py-2.5 text-xs font-semibold text-slate-500">
                    Current Plan
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setCheckoutPlan(p)}
                    className="w-full flex items-center justify-center gap-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white py-2.5 text-xs font-semibold transition"
                  >
                    Upgrade Plan <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Checkout Modal */}
      {checkoutPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">Secure SaaS Checkout</h3>
              </div>
              <button
                type="button"
                onClick={() => setCheckoutPlan(null)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                &times;
              </button>
            </div>

            <div className="mt-4 rounded-lg bg-slate-50 p-4">
              <div className="flex justify-between text-sm">
                <span className="font-semibold text-slate-800">{checkoutPlan.name} ({isAnnual ? "Annual" : "Monthly"})</span>
                <span className="font-bold text-slate-900">{inr(isAnnual ? checkoutPlan.annualPriceInr : checkoutPlan.monthlyPriceInr)}</span>
              </div>
              <p className="mt-1 text-xs text-slate-500">Includes {checkoutPlan.maxUsers} user seats &amp; {(checkoutPlan.maxStorageMb / 1024).toFixed(0)} GB storage.</p>
            </div>

            <p className="mt-4 text-xs text-slate-600">Select payment gateway to complete upgrade:</p>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={processing}
                onClick={() => void handleCheckout("Razorpay")}
                className="flex flex-col items-center justify-center rounded-xl border border-slate-200 p-3 hover:border-indigo-600 hover:bg-indigo-50/30 transition text-center"
              >
                <span className="text-xs font-bold text-blue-600">Razorpay</span>
                <span className="text-[10px] text-slate-500 mt-0.5">UPI, Cards, NetBanking</span>
              </button>

              <button
                type="button"
                disabled={processing}
                onClick={() => void handleCheckout("Stripe")}
                className="flex flex-col items-center justify-center rounded-xl border border-slate-200 p-3 hover:border-indigo-600 hover:bg-indigo-50/30 transition text-center"
              >
                <span className="text-xs font-bold text-purple-600">Stripe</span>
                <span className="text-[10px] text-slate-500 mt-0.5">Global Credit Cards</span>
              </button>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setCheckoutPlan(null)}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-4 py-2"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </StandardPageLayout>
  );
}
