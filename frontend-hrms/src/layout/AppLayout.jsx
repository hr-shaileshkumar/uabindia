import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import CommandPalette from "../components/common/CommandPalette";
import QuickActionModal from "../components/common/QuickActionModal";

export const AppLayout = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [quickActionOpen, setQuickActionOpen] = useState(false);
  const [isSidebarCompact, setIsSidebarCompact] = useState(() => {
    try {
      return localStorage.getItem("hrms_sidebar_compact") === "true";
    } catch (e) {
      return false;
    }
  });

  const handleToggleCompact = () => {
    setIsSidebarCompact((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("hrms_sidebar_compact", String(next));
      } catch (e) {}
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col antialiased">
      {/* Sidebar (Desktop fixed + Mobile slide-over) */}
      <Sidebar
        isMobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
        onOpenCommandPalette={() => setCommandPaletteOpen(true)}
        isSidebarCompact={isSidebarCompact}
        onToggleCompact={handleToggleCompact}
      />

      {/* Main Container (Shifted right on desktop by sidebar width: 64 when expanded, 16 when compact) */}
      <div
        className={`${
          isSidebarCompact ? "lg:pl-16" : "lg:pl-64"
        } flex flex-col flex-1 min-w-0 transition-all duration-200`}
      >
        <Topbar
          onMobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
          onOpenCommandPalette={() => setCommandPaletteOpen(true)}
          onOpenQuickAction={() => setQuickActionOpen(true)}
        />

        <main className="flex-1 p-3 sm:p-4 lg:p-5 max-w-[1440px] w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Global Modals */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />

      <QuickActionModal
        isOpen={quickActionOpen}
        onClose={() => setQuickActionOpen(false)}
      />
    </div>
  );
};

export default AppLayout;
