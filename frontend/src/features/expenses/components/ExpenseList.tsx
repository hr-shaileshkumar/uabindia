"use client";

import { useState } from "react";
import { Wallet, Plus, FileText, Check, X, Upload } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { FilterBar } from "@/components/ui/filter-bar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SideDrawer } from "@/components/ui/side-drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Expense } from "@/types";

const INITIAL_EXPENSES: Expense[] = [
  { id: "1", employeeName: "Rahul Verma", title: "Client Dinner & Entertainment", amount: 4500, category: "Meals", date: "2026-08-01", status: "Submitted" },
  { id: "2", employeeName: "Ananya Roy", title: "Flight to Mumbai Office", amount: 12800, category: "Travel", date: "2026-07-28", status: "Approved" },
  { id: "3", employeeName: "Vikram Singh", title: "Software Subscription", amount: 3200, category: "Software", date: "2026-07-25", status: "Paid" },
];

export function ExpenseList() {
  const [expenses, setExpenses] = useState<Expense[]>(INITIAL_EXPENSES);
  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [formData, setFormData] = useState({ title: "", amount: "", category: "Travel", date: "2026-08-03" });

  const filtered = expenses.filter((e) => e.title.toLowerCase().includes(search.toLowerCase()) || (e.employeeName || "").toLowerCase().includes(search.toLowerCase()));

  const handleSave = () => {
    if (!formData.title || !formData.amount) return;
    const newExp: Expense = {
      id: String(Date.now()),
      employeeName: "Current User",
      title: formData.title,
      amount: Number(formData.amount),
      category: formData.category,
      date: formData.date,
      status: "Submitted",
    };
    setExpenses((prev) => [newExp, ...prev]);
    setDrawerOpen(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Expense Management & Reimbursements"
        subtitle="Submit, review, and approve employee business expense reports and receipts"
        breadcrumbs={[
          { label: "Expenses", href: "/expenses" },
          { label: "All Expenses" },
        ]}
        actions={
          <Button size="sm" onClick={() => setDrawerOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Submit Expense Report
          </Button>
        }
      />

      <FilterBar searchPlaceholder="Search by expense title or employee..." searchValue={search} onSearchChange={setSearch} />

      <div className="space-y-3">
        {filtered.map((exp) => (
          <Card key={exp.id} className="hover:border-indigo-500/50 transition-colors">
            <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-foreground text-sm">{exp.title}</span>
                  <Badge variant={exp.status === "Paid" ? "success" : exp.status === "Approved" ? "success" : exp.status === "Submitted" ? "warning" : "secondary"}>
                    {exp.status}
                  </Badge>
                  <Badge variant="outline">{exp.category}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Employee: <span className="font-medium text-foreground">{exp.employeeName}</span> • Date: {exp.date}
                </p>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Amount</p>
                  <p className="font-bold text-indigo-600 dark:text-indigo-400 text-base">₹{exp.amount.toLocaleString("en-IN")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <SideDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Submit New Expense Report"
        subtitle="Upload receipt and enter expense details"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDrawerOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>Submit Expense</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Expense Title *</Label>
            <Input id="title" placeholder="e.g. Travel & Flight Booking" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (INR) *</Label>
            <Input id="amount" type="number" placeholder="5000" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="date">Expense Date</Label>
            <Input id="date" type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
          </div>
        </div>
      </SideDrawer>
    </div>
  );
}
