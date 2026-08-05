"use client";

import { useState } from "react";
import { DollarSign, RefreshCw, Plus, TrendingUp, Globe, Check } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface ExchangeRate {
  id: string;
  code: string;
  name: string;
  symbol: string;
  rateToINR: number; // base currency INR
  lastUpdated: string;
  isBase: boolean;
}

const INITIAL_CURRENCIES: ExchangeRate[] = [
  { id: "1", code: "INR", name: "Indian Rupee", symbol: "₹", rateToINR: 1.0, lastUpdated: "2026-08-03", isBase: true },
  { id: "2", code: "USD", name: "US Dollar", symbol: "$", rateToINR: 83.5, lastUpdated: "2026-08-03", isBase: false },
  { id: "3", code: "EUR", name: "Euro", symbol: "€", rateToINR: 90.8, lastUpdated: "2026-08-03", isBase: false },
  { id: "4", code: "GBP", name: "British Pound", symbol: "£", rateToINR: 106.2, lastUpdated: "2026-08-03", isBase: false },
  { id: "5", code: "AED", name: "UAE Dirham", symbol: "AED", rateToINR: 22.7, lastUpdated: "2026-08-03", isBase: false },
];

export function CurrencyExchangeManager() {
  const [rates] = useState<ExchangeRate[]>(INITIAL_CURRENCIES);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Multi-Currency & Tax Management"
        subtitle="Manage global transaction currencies, live exchange rates, GST/VAT tax rates, and fiscal compliance"
        breadcrumbs={[
          { label: "Finance", href: "/finance" },
          { label: "Tax & Currency" },
        ]}
        actions={
          <Button size="sm" variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Sync FX Rates
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rates.map((curr) => (
          <Card key={curr.id} className="hover:border-indigo-500/50 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-base font-semibold font-mono flex items-center gap-2">
                    <span className="text-indigo-600 font-bold">{curr.symbol}</span>
                    {curr.code}
                  </CardTitle>
                  <CardDescription className="text-xs">{curr.name}</CardDescription>
                </div>
                {curr.isBase ? (
                  <Badge variant="success">Base Currency</Badge>
                ) : (
                  <Badge variant="outline">FX Rate</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Exchange Rate (vs INR)</span>
                <span className="font-mono font-bold text-foreground text-sm">
                  1 {curr.code} = ₹{curr.rateToINR.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border">
                <span>Last Updated</span>
                <span>{curr.lastUpdated}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
