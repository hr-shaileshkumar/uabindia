"use client";

import React from "react";

export default function ModuleIcon({ name, className }: { name?: string | null; className?: string }) {
  const sizeClass = className || "w-5 h-5";

  if (!name) {
    return (
      <svg className={sizeClass} viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <rect x="3" y="3" width="18" height="18" rx="2" />
      </svg>
    );
  }

  switch (name) {
    case "dashboard":
      return (
        <svg className={sizeClass} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 13h8V3H3v10zM13 21h8V11h-8v10z" />
        </svg>
      );
    case "employees":
      return (
        <svg className={sizeClass} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 12a4 4 0 100-8 4 4 0 000 8zM6 20v-1a4 4 0 014-4h4a4 4 0 014 4v1" />
        </svg>
      );
    case "attendance":
      return (
        <svg className={sizeClass} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l2 2M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case "leave":
      return (
        <svg className={sizeClass} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3M3 11a9 9 0 0018 0c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2z" />
        </svg>
      );
    case "payroll":
    case "payslips":
      return (
        <svg className={sizeClass} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-3 0-5 1-6 3v5h12v-5c-1-2-3-3-6-3z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4" />
        </svg>
      );
    case "training":
    case "assessments":
      return (
        <svg className={sizeClass} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2l7 4-7 4-7-4 7-4zM5 10v6a2 2 0 002 2h10a2 2 0 002-2v-6" />
        </svg>
      );
    default:
      return (
        <svg className={sizeClass} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <rect x="3" y="3" width="18" height="18" rx="2" />
        </svg>
      );
  }
}
