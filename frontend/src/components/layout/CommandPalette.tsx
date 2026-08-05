"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X, Command, ArrowRight, UserPlus, FileText, Plus, Building2, Shield, Calendar, Users, Wallet, CreditCard } from "lucide-react";
import { useNavigationStore } from "@/store/navigationStore";
import { cn } from "@/lib/utils";

interface CommandItem {
  id: string;
  title: string;
  category: "Navigation" | "Quick Action" | "Admin";
  href: string;
  icon: React.ReactNode;
}

const COMMAND_ITEMS: CommandItem[] = [
  // Quick Actions
  { id: "action-1", title: "Add New Employee", category: "Quick Action", href: "/hrms/employees/new", icon: <UserPlus className="h-4 w-4 text-indigo-500" /> },
  { id: "action-2", title: "Post Journal Entry", category: "Quick Action", href: "/journal-entries", icon: <FileText className="h-4 w-4 text-emerald-500" /> },
  { id: "action-3", title: "Submit Expense Claim", category: "Quick Action", href: "/expenses", icon: <Wallet className="h-4 w-4 text-amber-500" /> },
  { id: "action-4", title: "Apply for Leave", category: "Quick Action", href: "/hrms/leave", icon: <Calendar className="h-4 w-4 text-blue-500" /> },
  { id: "action-5", title: "Provision New Tenant", category: "Quick Action", href: "/platform/tenants/new", icon: <Building2 className="h-4 w-4 text-purple-500" /> },

  // Navigation Pages
  { id: "nav-1", title: "Dashboard Command Center", category: "Navigation", href: "/dashboard", icon: <Command className="h-4 w-4" /> },
  { id: "nav-2", title: "Employee Self Service (ESS)", category: "Navigation", href: "/ess", icon: <Users className="h-4 w-4" /> },
  { id: "nav-3", title: "HRMS Employees Directory", category: "Navigation", href: "/hrms/employees", icon: <Users className="h-4 w-4" /> },
  { id: "nav-4", title: "Chart of Accounts (COA Tree)", category: "Navigation", href: "/chart-of-accounts", icon: <FileText className="h-4 w-4" /> },
  { id: "nav-5", title: "Payroll Execution Runs", category: "Navigation", href: "/payroll/runs", icon: <CreditCard className="h-4 w-4" /> },
  { id: "nav-6", title: "Business Travel & Tours", category: "Navigation", href: "/tours", icon: <Calendar className="h-4 w-4" /> },
  { id: "nav-7", title: "Project Delivery & Milestones", category: "Navigation", href: "/projects", icon: <FolderTreeIcon className="h-4 w-4" /> },
  { id: "nav-8", title: "CRM & Sales Deals", category: "Navigation", href: "/crm", icon: <Building2 className="h-4 w-4" /> },
  { id: "nav-9", title: "Fleet & Vehicle Roster", category: "Navigation", href: "/fleet", icon: <Command className="h-4 w-4" /> },
  { id: "nav-10", title: "Healthcare MVU Field Camps", category: "Navigation", href: "/healthcare", icon: <Users className="h-4 w-4" /> },
  { id: "nav-11", title: "Document Vault & Storage", category: "Navigation", href: "/documents", icon: <FileText className="h-4 w-4" /> },

  // Admin
  { id: "admin-1", title: "Tenant Management", category: "Admin", href: "/platform/tenants", icon: <Building2 className="h-4 w-4" /> },
  { id: "admin-2", title: "Role & Permission Matrix", category: "Admin", href: "/platform/roles", icon: <Shield className="h-4 w-4" /> },
  { id: "admin-3", title: "Platform Audit Logs", category: "Admin", href: "/platform/audit-logs", icon: <FileText className="h-4 w-4" /> },
];

function FolderTreeIcon({ className }: { className?: string }) {
  return <Command className={className} />;
}

export function CommandPalette() {
  const router = useRouter();
  const searchOpen = useNavigationStore((state) => state.isSearchOpen);
  const setSearchOpen = useNavigationStore((state) => state.setSearchOpen);
  const [query, setQuery] = useState("");

  // Listen for Ctrl+K or Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(!searchOpen);
      }
      if (e.key === "Escape" && searchOpen) {
        setSearchOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [searchOpen, setSearchOpen]);

  if (!searchOpen) return null;

  const filtered = COMMAND_ITEMS.filter(
    (item) =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.category.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (href: string) => {
    setSearchOpen(false);
    setQuery("");
    router.push(href);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-xl rounded-xl border border-border bg-background shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 border-b border-border bg-muted/30">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground mr-3" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pages, modules, or quick actions... (CTRL+K)"
            className="w-full h-12 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            autoFocus
          />
          {query && (
            <button onClick={() => setQuery("")} className="p-1 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Search Results List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filtered.length > 0 ? (
            filtered.map((item) => (
              <button
                key={item.id}
                onClick={() => handleSelect(item.href)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-muted/60 transition-colors text-left group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-1.5 rounded-md bg-muted text-foreground group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    {item.icon}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                    <p className="text-[10px] text-muted-foreground">{item.category}</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </button>
            ))
          ) : (
            <div className="py-8 text-center text-sm text-muted-foreground italic">
              No matching pages or actions found for "{query}"
            </div>
          )}
        </div>

        {/* Command Palette Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-border bg-muted/30 text-[11px] text-muted-foreground">
          <span>Navigate with <kbd className="px-1 py-0.5 rounded bg-muted border border-border">↑</kbd> <kbd className="px-1 py-0.5 rounded bg-muted border border-border">↓</kbd></span>
          <span>Open with <kbd className="px-1 py-0.5 rounded bg-muted border border-border">CTRL + K</kbd></span>
          <span>Close with <kbd className="px-1 py-0.5 rounded bg-muted border border-border">ESC</kbd></span>
        </div>
      </div>
    </div>
  );
}
