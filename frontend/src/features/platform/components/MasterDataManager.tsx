"use client";

import { useState } from "react";
import { Globe, MapPin, DollarSign, Clock, Calendar, Plus, Search } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { FilterBar } from "@/components/ui/filter-bar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface CountryMaster {
  id: string;
  name: string;
  code: string;
  phoneCode: string;
  currency: string;
  statesCount: number;
  isActive: boolean;
}

const INITIAL_COUNTRIES: CountryMaster[] = [
  { id: "1", name: "India", code: "IN", phoneCode: "+91", currency: "INR (₹)", statesCount: 36, isActive: true },
  { id: "2", name: "United States", code: "US", phoneCode: "+1", currency: "USD ($)", statesCount: 50, isActive: true },
  { id: "3", name: "United Arab Emirates", code: "AE", phoneCode: "+971", currency: "AED", statesCount: 7, isActive: true },
  { id: "4", name: "United Kingdom", code: "GB", phoneCode: "+44", currency: "GBP (£)", statesCount: 4, isActive: true },
];

export function MasterDataManager() {
  const [countries] = useState<CountryMaster[]>(INITIAL_COUNTRIES);
  const [search, setSearch] = useState("");

  const filtered = countries.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.code.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Global Master Data Management"
        subtitle="Configure geolocation registries, country & state hierarchies, postal codes, base currencies, and global holiday calendars"
        breadcrumbs={[
          { label: "Platform", href: "/platform/settings" },
          { label: "Master Data" },
        ]}
        actions={
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Add Country / Region
          </Button>
        }
      />

      <FilterBar searchPlaceholder="Search country name or ISO code..." searchValue={search} onSearchChange={setSearch} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {filtered.map((c) => (
          <Card key={c.id} className="hover:border-indigo-500/50 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-base font-semibold font-mono flex items-center gap-2">
                    <Globe className="h-4 w-4 text-indigo-500" />
                    {c.name} ({c.code})
                  </CardTitle>
                  <CardDescription className="text-xs">Dial Code: {c.phoneCode}</CardDescription>
                </div>
                <Badge variant="success">Active</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Default Currency</span>
                <span className="font-semibold text-foreground">{c.currency}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-border">
                <span>Sub-Divisions</span>
                <span className="font-semibold text-foreground">{c.statesCount} States / Provinces</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
