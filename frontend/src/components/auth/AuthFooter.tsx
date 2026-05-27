"use client";

import Link from "next/link";
import { Heart } from "lucide-react";

export default function AuthFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-950 text-slate-200">
      <div className="mx-auto max-w-7xl px-5 py-16 lg:px-6">
        <div className="grid gap-10 xl:grid-cols-[1.6fr_1fr_1fr_1fr]">
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">UAB India tenant portal</p>
            <p className="max-w-xl text-sm leading-7 text-slate-300">
              Modern ERP for HRMS, payroll, finance, and operational teams with secure tenant controls.
            </p>
            <div className="flex flex-wrap gap-2">
              {['ERP Core', 'HRMS', 'Payroll', 'Finance', 'Inventory'].map((item) => (
                <span key={item} className="rounded-full border border-slate-700 bg-slate-900/70 px-3 py-1 text-xs font-medium text-slate-300">
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-sm font-semibold text-white">Product</p>
            <div className="space-y-3 text-sm text-slate-300">
              <Link href="/" className="block transition hover:text-white">Home</Link>
              <Link href="/about" className="block transition hover:text-white">About</Link>
              <Link href="/careers" className="block transition hover:text-white">Careers</Link>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-sm font-semibold text-white">Company</p>
            <div className="space-y-3 text-sm text-slate-300">
              <Link href="/contact" className="block transition hover:text-white">Contact</Link>
              <Link href="/login" className="block transition hover:text-white">Login</Link>
            </div>
          </div>

          <div className="space-y-4 text-sm text-slate-300">
            <p className="text-sm font-semibold text-white">Contact</p>
            <div className="space-y-2">
              <p className="font-semibold text-slate-100">UAB India</p>
              <p>City, State, Country</p>
              <p>operations@clientcompany.com</p>
              <p>+91 00 0000 0000</p>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-6 text-center text-xs text-slate-500">
          © {currentYear} UAB India. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
