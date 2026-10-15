"use client";

import React from "react";

const W = 1.75;

export default function ModuleIcon({ name, className }: { name?: string | null; className?: string }) {
  const sz = (className || "w-5 h-5") + " transition-transform duration-300 hover:scale-115 hover:rotate-6";
  const p = { strokeLinecap: "round" as const, strokeLinejoin: "round" as const, strokeWidth: W };

  if (!name) {
    return (
      <svg className={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth={W} />
      </svg>
    );
  }

  switch (name) {
    case "dashboard":
      return (
        <svg className={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <rect x="3" y="3" width="7" height="7" rx="1" {...p} />
          <rect x="14" y="3" width="7" height="7" rx="1" {...p} />
          <rect x="3" y="14" width="7" height="7" rx="1" {...p} />
          <rect x="14" y="14" width="7" height="7" rx="1" {...p} />
        </svg>
      );
    case "grid":
      return (
        <svg className={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="5" cy="5" r="1.5" {...p} />
          <circle cx="12" cy="5" r="1.5" {...p} />
          <circle cx="19" cy="5" r="1.5" {...p} />
          <circle cx="5" cy="12" r="1.5" {...p} />
          <circle cx="12" cy="12" r="1.5" {...p} />
          <circle cx="19" cy="12" r="1.5" {...p} />
          <circle cx="5" cy="19" r="1.5" {...p} />
          <circle cx="12" cy="19" r="1.5" {...p} />
          <circle cx="19" cy="19" r="1.5" {...p} />
        </svg>
      );
    case "user":
    case "employees":
    case "users":
      return (
        <svg className={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path {...p} d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
          <circle cx="9" cy="7" r="4" {...p} />
          <path {...p} d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
        </svg>
      );
    case "user-plus":
      return (
        <svg className={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path {...p} d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
          <circle cx="9" cy="7" r="4" {...p} />
          <line x1="19" y1="8" x2="19" y2="14" {...p} />
          <line x1="16" y1="11" x2="22" y2="11" {...p} />
        </svg>
      );
    case "user-minus":
      return (
        <svg className={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path {...p} d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
          <circle cx="9" cy="7" r="4" {...p} />
          <line x1="16" y1="11" x2="22" y2="11" {...p} />
        </svg>
      );
    case "attendance":
      return (
        <svg className={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="12" cy="12" r="9" {...p} />
          <path {...p} d="M12 7v5l3 3" />
        </svg>
      );
    case "clock":
      return (
        <svg className={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="12" cy="12" r="9" {...p} />
          <path {...p} d="M12 7v5l2.5 2.5" />
        </svg>
      );
    case "timer":
      return (
        <svg className={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path {...p} d="M9 2h6M12 2v3" />
          <circle cx="12" cy="13" r="7" {...p} />
          <path {...p} d="M12 10v3l2 2" />
        </svg>
      );
    case "hourglass":
      return (
        <svg className={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path {...p} d="M5 2h14M5 22h14" />
          <path {...p} d="M17 22v-5.172a2 2 0 00-.586-1.414L12 11m0 0L7.586 7.586A2 2 0 017 6.172V2m5 9l4.414 3.414A2 2 0 0117 17.828V22M7 22v-4.172a2 2 0 01.586-1.414L12 13" />
        </svg>
      );
    case "leave":
      return (
        <svg className={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <rect x="3" y="4" width="18" height="17" rx="2" {...p} />
          <path {...p} d="M16 2v4M8 2v4M3 10h18" />
          <path {...p} d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" />
        </svg>
      );
    case "calendar-check":
      return (
        <svg className={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <rect x="3" y="4" width="18" height="17" rx="2" {...p} />
          <path {...p} d="M16 2v4M8 2v4M3 10h18" />
          <path {...p} d="M9 15l2 2 4-4" />
        </svg>
      );
    case "file":
      return (
        <svg className={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path {...p} d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6" />
        </svg>
      );
    case "file-text":
      return (
        <svg className={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path {...p} d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M9 13h6M9 17h4" />
        </svg>
      );
    case "document":
      return (
        <svg className={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path {...p} d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M8 13h8M8 17h5" />
        </svg>
      );
    case "clipboard":
      return (
        <svg className={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path {...p} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
          <rect x="9" y="3" width="6" height="4" rx="1" {...p} />
          <path {...p} d="M9 12h6M9 16h4" />
        </svg>
      );
    case "clipboard-check":
      return (
        <svg className={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path {...p} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
          <rect x="9" y="3" width="6" height="4" rx="1" {...p} />
          <path {...p} d="M9 12l2 2 4-4" />
        </svg>
      );
    case "journal":
      return (
        <svg className={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path {...p} d="M4 19.5A2.5 2.5 0 016.5 17H20V3H6.5A2.5 2.5 0 004 5.5v13z" />
          <path {...p} d="M4 19.5A2.5 2.5 0 016.5 22H20v-5H6.5a2.5 2.5 0 000 5z" />
          <path {...p} d="M8 7h8M8 11h6" />
        </svg>
      );
    case "folder":
      return (
        <svg className={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path {...p} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
      );
    case "credit-card":
      return (
        <svg className={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <rect x="2" y="5" width="20" height="14" rx="2" {...p} />
          <path {...p} d="M2 10h20M6 15h4" />
        </svg>
      );
    case "receipt":
      return (
        <svg className={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path {...p} d="M4 2v20l3-2 2 2 2-2 2 2 2-2 3 2V2l-3 2-2-2-2 2-2-2-2 2-3-2z" />
          <path {...p} d="M9 8h6M9 12h6M9 16h3" />
        </svg>
      );
    case "wallet":
      return (
        <svg className={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path {...p} d="M20 7H5a2 2 0 00-2 2v10a2 2 0 002 2h15a1 1 0 001-1V8a1 1 0 00-1-1zm0 0V5a2 2 0 00-2-2H7a2 2 0 00-2 2v2" />
          <circle cx="17" cy="13" r="1" fill="currentColor" />
        </svg>
      );
    case "calculator":
      return (
        <svg className={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <rect x="4" y="2" width="16" height="20" rx="2" {...p} />
          <path {...p} d="M8 6h8M8 10h2M12 10h2M16 10h.01M8 14h2M12 14h2M16 14h2M8 18h2M12 18h6" />
        </svg>
      );
    case "bank":
      return (
        <svg className={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path {...p} d="M3 22v-1h18v1M3 10v9M7 10v9M11 10v9M15 10v9M19 10v9M2 10h20M12 2L2 8h20L12 2z" />
        </svg>
      );
    case "payroll":
    case "payslips":
      return (
        <svg className={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <rect x="2" y="6" width="20" height="12" rx="2" {...p} />
          <path {...p} d="M6 10h.01M6 14h4M14 14h4" />
          <circle cx="14" cy="10" r="2" {...p} />
        </svg>
      );
    case "truck":
      return (
        <svg className={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path {...p} d="M1 3h15v13H1zM16 8h4l3 3v5h-7V8z" />
          <circle cx="5.5" cy="18.5" r="2.5" {...p} />
          <circle cx="18.5" cy="18.5" r="2.5" {...p} />
        </svg>
      );
    case "shopping-cart":
      return (
        <svg className={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path {...p} d="M1 1h4l2.68 13.39a2 2 0 001.99 1.61H19a2 2 0 001.98-1.76l1.02-7.24H6" />
          <circle cx="9" cy="21" r="1" {...p} />
          <circle cx="20" cy="21" r="1" {...p} />
        </svg>
      );
    case "shopping-bag":
      return (
        <svg className={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path {...p} d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4H6zM3 6h18" />
          <path {...p} d="M16 10a4 4 0 01-8 0" />
        </svg>
      );
    case "box":
      return (
        <svg className={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path {...p} d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
          <path {...p} d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" />
        </svg>
      );
    case "warehouse":
      return (
        <svg className={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path {...p} d="M2 20h20M3 20V8l9-5 9 5v12" />
          <path {...p} d="M9 20v-5a3 3 0 016 0v5" />
          <path {...p} d="M9 10h6M9 14h6" />
        </svg>
      );
    case "trending-up":
      return (
        <svg className={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path {...p} d="M23 6l-9.5 9.5-5-5L1 18" />
          <path {...p} d="M17 6h6v6" />
        </svg>
      );
    case "sliders":
      return (
        <svg className={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <line x1="4" y1="21" x2="4" y2="14" {...p} />
          <line x1="4" y1="10" x2="4" y2="3" {...p} />
          <line x1="12" y1="21" x2="12" y2="12" {...p} />
          <line x1="12" y1="8" x2="12" y2="3" {...p} />
          <line x1="20" y1="21" x2="20" y2="16" {...p} />
          <line x1="20" y1="12" x2="20" y2="3" {...p} />
          <line x1="1" y1="14" x2="7" y2="14" {...p} />
          <line x1="9" y1="8" x2="15" y2="8" {...p} />
          <line x1="17" y1="16" x2="23" y2="16" {...p} />
        </svg>
      );
    case "arrow-right-left":
      return (
        <svg className={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path {...p} d="M17 4l4 4-4 4M7 20l-4-4 4-4" />
          <path {...p} d="M3 8h18M3 16h18" />
        </svg>
      );
    case "rotate-ccw":
      return (
        <svg className={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path {...p} d="M1 4v6h6" />
          <path {...p} d="M3.51 15a9 9 0 102.13-9.36L1 10" />
        </svg>
      );
    case "award":
      return (
        <svg className={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="12" cy="8" r="6" {...p} />
          <path {...p} d="M8.21 13.89L7 22l5-3 5 3-1.21-8.11" />
        </svg>
      );
    case "monitor":
      return (
        <svg className={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <rect x="2" y="3" width="20" height="14" rx="2" {...p} />
          <path {...p} d="M8 21h8M12 17v4" />
        </svg>
      );
    case "search":
      return (
        <svg className={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="11" cy="11" r="7" {...p} />
          <path {...p} d="M21 21l-4.35-4.35" />
        </svg>
      );
    case "bar-chart":
      return (
        <svg className={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path {...p} d="M18 20V10M12 20V4M6 20v-6" />
        </svg>
      );
    case "training":
      return (
        <svg className={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path {...p} d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2zM22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
        </svg>
      );
    case "play-circle":
      return (
        <svg className={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="12" cy="12" r="10" {...p} />
          <path {...p} d="M10 8l6 4-6 4V8z" />
        </svg>
      );
    case "gift":
      return (
        <svg className={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path {...p} d="M20 12v10H4V12" />
          <path {...p} d="M2 7h20v5H2z" />
          <path {...p} d="M12 22V7M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z" />
        </svg>
      );
    case "layers":
      return (
        <svg className={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path {...p} d="M12 2L2 7l10 5 10-5-10-5z" />
          <path {...p} d="M2 12l10 5 10-5M2 17l10 5 10-5" />
        </svg>
      );
    case "puzzle":
      return (
        <svg className={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path {...p} d="M20.5 11H19V7c0-1.1-.9-2-2-2h-4V3.5a2.5 2.5 0 00-5 0V5H4c-1.1 0-2 .9-2 2v4h1.5a2.5 2.5 0 010 5H2v4c0 1.1.9 2 2 2h4v-1.5a2.5 2.5 0 015 0V21h4c1.1 0 2-.9 2-2v-4h-1.5a2.5 2.5 0 010-5z" />
        </svg>
      );
    case "briefcase":
      return (
        <svg className={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <rect x="2" y="7" width="20" height="14" rx="2" {...p} />
          <path {...p} d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2M8 12h8" />
        </svg>
      );
    case "building":
      return (
        <svg className={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path {...p} d="M3 21V5a2 2 0 012-2h14a2 2 0 012 2v16" />
          <path {...p} d="M3 21h18M9 7h1m4 0h1M9 11h1m4 0h1M9 15h1m4 0h1M11 21v-4h2v4" />
        </svg>
      );
    case "key":
      return (
        <svg className={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="7.5" cy="15.5" r="5.5" {...p} />
          <path {...p} d="M21 2l-9.6 9.6M15.5 7.5l2 2M19 4l2 2" />
        </svg>
      );
    case "database":
      return (
        <svg className={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <ellipse cx="12" cy="5" rx="9" ry="3" {...p} />
          <path {...p} d="M3 5v5c0 1.66 4.03 3 9 3s9-1.34 9-3V5" />
          <path {...p} d="M3 10v5c0 1.66 4.03 3 9 3s9-1.34 9-3v-5" />
          <path {...p} d="M3 15v4c0 1.66 4.03 3 9 3s9-1.34 9-3v-4" />
        </svg>
      );
    case "flag":
      return (
        <svg className={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path {...p} d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
          <line x1="4" y1="22" x2="4" y2="15" {...p} />
        </svg>
      );
    case "workflow":
      return (
        <svg className={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <rect x="2" y="2" width="6" height="6" rx="1" {...p} />
          <rect x="16" y="9" width="6" height="6" rx="1" {...p} />
          <rect x="2" y="16" width="6" height="6" rx="1" {...p} />
          <path {...p} d="M8 5h4a4 4 0 014 4M8 19h4a4 4 0 004-4v-1" />
        </svg>
      );
    case "activity":
      return (
        <svg className={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path {...p} d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
      );
    case "settings":
      return (
        <svg className={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="12" cy="12" r="3" {...p} />
          <path {...p} d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
        </svg>
      );
    case "mail":
      return (
        <svg className={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path {...p} d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
          <path {...p} d="M22 6l-10 7L2 6" />
        </svg>
      );
    case "trash":
      return (
        <svg className={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path {...p} d="M3 6h18M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M10 11v6M14 11v6" />
        </svg>
      );
    case "shield":
      return (
        <svg className={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path {...p} d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path {...p} d="M9 12l2 2 4-4" />
        </svg>
      );
    case "lock":
      return (
        <svg className={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <rect x="3" y="11" width="18" height="11" rx="2" {...p} />
          <path {...p} d="M7 11V7a5 5 0 0110 0v4" />
        </svg>
      );
    case "smartphone":
      return (
        <svg className={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <rect x="5" y="2" width="14" height="20" rx="2" {...p} />
          <line x1="12" y1="18" x2="12.01" y2="18" {...p} />
        </svg>
      );
    case "globe":
      return (
        <svg className={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="12" cy="12" r="10" {...p} />
          <path {...p} d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
        </svg>
      );
    case "webhook":
      return (
        <svg className={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path {...p} d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
          <path {...p} d="M15 3h6v6" />
          <path {...p} d="M10 14L21 3" />
        </svg>
      );
    case "plug":
      return (
        <svg className={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path {...p} d="M12 22v-4" />
          <path {...p} d="M8 8H4a1 1 0 00-1 1v5a5 5 0 0010 0V9a1 1 0 00-1-1H8z" />
          <path {...p} d="M8 8V2M12 8V2" />
        </svg>
      );
    case "ticket":
      return (
        <svg className={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path {...p} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 000 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 000-4V7a2 2 0 00-2-2H5z" />
        </svg>
      );
    case "alert-triangle":
      return (
        <svg className={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path {...p} d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" {...p} />
          <line x1="12" y1="17" x2="12.01" y2="17" {...p} />
        </svg>
      );
    case "help-circle":
      return (
        <svg className={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="12" cy="12" r="10" {...p} />
          <path {...p} d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
          <line x1="12" y1="17" x2="12.01" y2="17" {...p} />
        </svg>
      );
    case "bell":
      return (
        <svg className={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path {...p} d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path {...p} d="M13.73 21a2 2 0 01-3.46 0" />
        </svg>
      );
    case "megaphone":
      return (
        <svg className={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path {...p} d="M11 5L6 9H2v6h4l5 4V5z" />
          <path {...p} d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07" />
        </svg>
      );
    case "message-sq":
      return (
        <svg className={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path {...p} d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" />
        </svg>
      );
    case "check-circle":
      return (
        <svg className={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path {...p} d="M22 11.08V12a10 10 0 11-5.93-9.14" />
          <path {...p} d="M22 4L12 14.01l-3-3" />
        </svg>
      );
    case "contact-round":
    case "crm":
      return (
        <svg className={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="12" cy="12" r="10" {...p} />
          <circle cx="12" cy="10" r="3" {...p} />
          <path {...p} d="M7 20.662V19a2 2 0 012-2h6a2 2 0 012 2v1.662" />
        </svg>
      );
    case "git-branch":
      return (
        <svg className={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <line x1="6" y1="3" x2="6" y2="15" {...p} />
          <circle cx="18" cy="6" r="3" {...p} />
          <circle cx="6" cy="18" r="3" {...p} />
          <path {...p} d="M18 9a9 9 0 01-9 9" />
        </svg>
      );
    case "settings-2":
      return (
        <svg className={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path {...p} d="M20 7h-9M14 17H5M17 12H3M7 7H3" />
          <circle cx="17" cy="7" r="3" {...p} />
          <circle cx="7" cy="12" r="3" {...p} />
          <circle cx="14" cy="17" r="3" {...p} />
        </svg>
      );
    case "calendar":
      return (
        <svg className={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" {...p} />
          <line x1="16" y1="2" x2="16" y2="6" {...p} />
          <line x1="8" y1="2" x2="8" y2="6" {...p} />
          <line x1="3" y1="10" x2="21" y2="10" {...p} />
        </svg>
      );
    case "percent":
      return (
        <svg className={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <line x1="19" y1="5" x2="5" y2="19" {...p} />
          <circle cx="6.5" cy="6.5" r="2.5" {...p} />
          <circle cx="17.5" cy="17.5" r="2.5" {...p} />
        </svg>
      );
    case "kanban":
      return (
        <svg className={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <rect x="3" y="3" width="5" height="18" rx="1" {...p} />
          <rect x="10" y="3" width="5" height="11" rx="1" {...p} />
          <rect x="17" y="3" width="5" height="15" rx="1" {...p} />
        </svg>
      );
    case "compass":
      return (
        <svg className={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="12" cy="12" r="10" {...p} />
          <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" {...p} />
        </svg>
      );
    case "bot":
      return (
        <svg className={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path {...p} d="M12 8V4H8" />
          <rect x="4" y="8" width="16" height="12" rx="2" {...p} />
          <path {...p} d="M2 14h2M20 14h2M9 13v2M15 13v2" />
        </svg>
      );
    case "factory":
      return (
        <svg className={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path {...p} d="M2 20a2 2 0 002 2h16a2 2 0 002-2V8l-7 5V8l-7 5V4L2 20z" />
          <path {...p} d="M17 18h1M12 18h1M7 18h1" />
        </svg>
      );
    case "file-spreadsheet":
      return (
        <svg className={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path {...p} d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6" />
          <path {...p} d="M8 13h8M8 17h8M12 9v12" />
        </svg>
      );
    case "pie-chart":
      return (
        <svg className={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path {...p} d="M21.21 15.89A10 10 0 118 2.83M22 12A10 10 0 0012 2v10z" />
        </svg>
      );
    case "sparkles":
      return (
        <svg className={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path {...p} d="M12 3l1.912 5.885L20 10.8l-4.5 4.385 1.062 6.2L12 18.277 7.438 21.385l1.062-6.2L4 10.8l6.088-1.915L12 3z" />
        </svg>
      );
    case "line-chart":
      return (
        <svg className={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path {...p} d="M3 3v18h18M19 9l-5 5-4-4-3 3" />
        </svg>
      );
    default: {
      return (
        <svg className={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path {...p} d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M9 13h6M9 17h4" />
        </svg>
      );
    }
  }
}

