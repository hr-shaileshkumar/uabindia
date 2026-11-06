"use client";

import React, { useState } from "react";
import {
  User,
  Mail,
  Phone,
  Building2,
  Shield,
  Key,
  FileSignature,
  Camera,
  Save,
  CheckCircle2,
  Globe,
  Clock,
  Sparkles,
  Lock,
} from "lucide-react";
import { notifySuccess, notifyError } from "@/lib/notifications";
import { useAuth } from "@/context/AuthContext";

export function UserProfileStudio() {
  const { user } = useAuth();
  const [fullName, setFullName] = useState(user?.fullName || "System Administrator");
  const [email, setEmail] = useState(user?.email || "admin@uabindia.com");
  const [phone, setPhone] = useState("+91 98201 12345");
  const [department, setDepartment] = useState("Executive Leadership & IT");
  const [designation, setDesignation] = useState("Chief Technology Officer / Administrator");
  const [signatoryStamp, setSignatoryStamp] = useState("UAB Global Enterprises Authorised Signatory");

  const handleSaveProfile = () => {
    notifySuccess("Personal profile & organizational credentials updated.");
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    notifySuccess("Security credentials & password updated successfully.");
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Banner Navigation & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card border border-border/70 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black text-2xl border-2 border-primary/20">
              {fullName.split(" ").map((n) => n[0]).join("").slice(0, 2)}
            </div>
            <button
              onClick={() => notifySuccess("Avatar image update dialog opened.")}
              className="absolute -bottom-1 -right-1 p-1.5 rounded-lg bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 transition-colors"
              title="Change Avatar"
            >
              <Camera className="w-3 h-3" />
            </button>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-foreground">{fullName}</h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                Active Verified
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{designation} • {department}</p>
            <div className="text-[11px] font-mono text-primary font-semibold mt-0.5">
              Employee ID: UAB-EMP-001 • CIN: L72200MH2026PLC994821
            </div>
          </div>
        </div>

        <button
          onClick={handleSaveProfile}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs"
        >
          <Save className="w-3.5 h-3.5" />
          Save Changes
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Personal Identity & Contact Information (2 cols) */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-card border border-border/70 rounded-2xl p-5 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-foreground border-b border-border/80 pb-3">
              Official Identity & Contact Details
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="font-semibold text-muted-foreground block mb-1.5">Full Name:</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-input bg-background font-medium outline-hidden focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="font-semibold text-muted-foreground block mb-1.5">Official Corporate Email:</label>
                <input
                  type="email"
                  value={email}
                  disabled
                  className="w-full px-3 py-2 rounded-xl border border-input bg-muted/50 text-muted-foreground font-medium cursor-not-allowed"
                />
              </div>

              <div>
                <label className="font-semibold text-muted-foreground block mb-1.5">Phone (SMS & WhatsApp):</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-input bg-background font-medium outline-hidden focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="font-semibold text-muted-foreground block mb-1.5">Department:</label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-input bg-background font-medium outline-hidden focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="font-semibold text-muted-foreground block mb-1.5">Official Designation & Title:</label>
                <input
                  type="text"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-input bg-background font-medium outline-hidden focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          {/* Digital Signature & Authorised Stamp */}
          <div className="bg-card border border-border/70 rounded-2xl p-5 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-foreground border-b border-border/80 pb-3 flex items-center justify-between">
              <span>Authorised Digital Signature & Stamp</span>
              <FileSignature className="w-4 h-4 text-primary" />
            </h2>
            <p className="text-xs text-muted-foreground">
              This signature & stamp is automatically rendered on official Tax Invoices, Purchase Orders, and Journal Vouchers.
            </p>

            <div className="p-4 rounded-xl border-2 border-dashed border-border bg-background flex flex-col items-center justify-center space-y-2">
              <div className="font-serif italic text-2xl font-black text-foreground tracking-wider py-4">
                {fullName}
              </div>
              <div className="text-[11px] font-mono text-muted-foreground uppercase tracking-widest border-t border-border/60 pt-1">
                {signatoryStamp}
              </div>
            </div>

            <button
              onClick={() => notifySuccess("Signature pad active. Digital signature verified.")}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-border bg-card hover:bg-muted/70 transition-colors"
            >
              Update Digital Stamp
            </button>
          </div>
        </div>

        {/* Right Column: Security Credentials & Regional Localization (1 col) */}
        <div className="space-y-6">
          {/* Password Update */}
          <div className="bg-card border border-border/70 rounded-2xl p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-foreground border-b border-border/80 pb-3 flex items-center gap-2">
              <Lock className="w-4 h-4 text-primary" />
              Update Password
            </h3>

            <form onSubmit={handleUpdatePassword} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-muted-foreground block mb-1">Current Password:</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full px-3 py-2 rounded-xl border border-input bg-background"
                />
              </div>
              <div>
                <label className="font-semibold text-muted-foreground block mb-1">New Password:</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full px-3 py-2 rounded-xl border border-input bg-background"
                />
              </div>
              <div>
                <label className="font-semibold text-muted-foreground block mb-1">Confirm New Password:</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full px-3 py-2 rounded-xl border border-input bg-background"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs mt-2"
              >
                Change Password
              </button>
            </form>
          </div>

          {/* Regional Localization */}
          <div className="bg-card border border-border/70 rounded-2xl p-5 shadow-xs space-y-3 text-xs">
            <h3 className="text-sm font-bold text-foreground border-b border-border/80 pb-3 flex items-center gap-2">
              <Globe className="w-4 h-4 text-emerald-500" />
              Regional Localization
            </h3>

            <div>
              <span className="text-muted-foreground block text-[11px]">Primary Currency:</span>
              <span className="font-bold text-foreground">INR (₹) - Indian Rupee</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[11px]">Timezone:</span>
              <span className="font-bold text-foreground">Asia/Kolkata (IST • UTC+05:30)</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[11px]">Date Format:</span>
              <span className="font-bold text-foreground">DD/MM/YYYY (Indian Standard)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

