"use client";

import { useState } from "react";
import { LayoutGrid, Menu as MenuIcon, Move, Eye, EyeOff, Plus, Shield } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface MenuItemConfig {
  id: string;
  label: string;
  route: string;
  iconName: string;
  isVisible: boolean;
  order: number;
}

const INITIAL_MENUS: MenuItemConfig[] = [
  { id: "1", label: "Dashboard Command Center", route: "/dashboard", iconName: "LayoutDashboard", isVisible: true, order: 1 },
  { id: "2", label: "Employee Self Service (ESS)", route: "/ess", iconName: "UserCheck", isVisible: true, order: 2 },
  { id: "3", label: "Human Resources (HRMS)", route: "/hrms/employees", iconName: "Users", isVisible: true, order: 3 },
  { id: "4", label: "Global Payroll Engine", route: "/payroll/runs", iconName: "CreditCard", isVisible: true, order: 4 },
  { id: "5", label: "Financial Accounting & COA", route: "/chart-of-accounts", iconName: "FileText", isVisible: true, order: 5 },
  { id: "6", label: "Supply Chain & Warehouses", route: "/inventory", iconName: "Package", isVisible: true, order: 6 },
  { id: "7", label: "CRM & Sales Deals", route: "/crm", iconName: "Building2", isVisible: true, order: 7 },
  { id: "8", label: "Fleet Logistics Management", route: "/fleet", iconName: "Truck", isVisible: true, order: 8 },
  { id: "9", label: "Healthcare MVU Field Camps", route: "/healthcare", iconName: "Stethoscope", isVisible: true, order: 9 },
];

export function MenuBuilderManager() {
  const [menus, setMenus] = useState<MenuItemConfig[]>(INITIAL_MENUS);

  const toggleVisibility = (id: string) => {
    setMenus((prev) =>
      prev.map((m) => (m.id === id ? { ...m, isVisible: !m.isVisible } : m))
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dynamic Menu & Navigation Builder"
        subtitle="Customize sidebar navigation structure, icon mapping, quick links, and role-based visibility rules"
        breadcrumbs={[
          { label: "Platform", href: "/platform/settings" },
          { label: "Menu Builder" },
        ]}
        actions={
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Add Custom Navigation Link
          </Button>
        }
      />

      <div className="space-y-2">
        {menus.map((m) => (
          <Card key={m.id} className="hover:border-indigo-500/50 transition-colors">
            <CardContent className="flex items-center justify-between p-3">
              <div className="flex items-center gap-3">
                <Move className="h-4 w-4 text-muted-foreground cursor-grab" />
                <div>
                  <p className="font-semibold text-foreground text-sm flex items-center gap-2">
                    {m.label}
                    <span className="font-mono text-xs text-muted-foreground font-normal">({m.route})</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button size="sm" variant="ghost" className="h-8 px-2 text-xs" onClick={() => toggleVisibility(m.id)}>
                  {m.isVisible ? (
                    <span className="flex items-center text-emerald-600 gap-1"><Eye className="h-3.5 w-3.5" /> Visible</span>
                  ) : (
                    <span className="flex items-center text-muted-foreground gap-1"><EyeOff className="h-3.5 w-3.5" /> Hidden</span>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
