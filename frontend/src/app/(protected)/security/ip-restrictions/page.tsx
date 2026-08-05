"use client";

import { useState } from "react";
import { Shield, Plus, Lock, CheckCircle2, Globe, Trash2, Edit2 } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SideDrawer } from "@/components/ui/side-drawer";

export interface IPRule {
  id: string;
  ipRange: string;
  description: string;
  action: "ALLOW" | "BLOCK";
  createdAt: string;
}

const INITIAL_RULES: IPRule[] = [
  { id: "1", ipRange: "103.21.124.0/24", description: "Corporate HQ Primary Network (Mumbai)", action: "ALLOW", createdAt: "2026-08-01" },
  { id: "2", ipRange: "182.72.190.12/32", description: "Regional Office Gateway (Bengaluru)", action: "ALLOW", createdAt: "2026-08-02" },
  { id: "3", ipRange: "45.142.120.0/22", description: "Known Malicious Scanner IP Block", action: "BLOCK", createdAt: "2026-07-28" },
];

export default function IpRestrictionsPage() {
  const [rules, setRules] = useState<IPRule[]>(INITIAL_RULES);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [formData, setFormData] = useState({ ipRange: "", description: "", action: "ALLOW" as IPRule["action"] });

  const handleSave = () => {
    if (!formData.ipRange) return;
    const newRule: IPRule = {
      id: String(Date.now()),
      ...formData,
      createdAt: new Date().toISOString().split("T")[0],
    };
    setRules((prev) => [newRule, ...prev]);
    setDrawerOpen(false);
  };

  const handleDelete = (id: string) => {
    setRules((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="IP Whitelisting & Access Control Rules"
        subtitle="Restrict system access to corporate IP subnets, CIDR ranges, and block untrusted networks"
        breadcrumbs={[
          { label: "Security", href: "/security" },
          { label: "IP Restrictions" },
        ]}
        actions={
          <Button size="sm" className="gap-2" onClick={() => { setFormData({ ipRange: "", description: "", action: "ALLOW" }); setDrawerOpen(true); }}>
            <Plus className="h-4 w-4" />
            Add IP Access Rule
          </Button>
        }
      />

      <div className="space-y-3">
        {rules.map((rule) => (
          <Card key={rule.id} className="hover:border-indigo-500/50 transition-colors">
            <CardContent className="flex items-center justify-between p-4">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-foreground text-sm">{rule.ipRange}</span>
                  <Badge variant={rule.action === "ALLOW" ? "success" : "destructive"}>
                    {rule.action}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{rule.description} • Date Added: {rule.createdAt}</p>
              </div>

              <Button size="sm" variant="ghost" className="h-8 text-xs text-rose-500 hover:text-rose-600" onClick={() => handleDelete(rule.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <SideDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Create IP Access Rule"
        subtitle="Define IP address CIDR range and policy action"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDrawerOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save Rule</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ip">IP Address or CIDR Range *</Label>
            <Input id="ip" placeholder="e.g. 192.168.1.0/24 or 103.21.124.8" value={formData.ipRange} onChange={(e) => setFormData({ ...formData, ipRange: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="desc">Rule Description *</Label>
            <Input id="desc" placeholder="e.g. Corporate HQ Gateway" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
          </div>
        </div>
      </SideDrawer>
    </div>
  );
}
