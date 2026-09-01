"use client";

import React, { useState, useEffect } from "react";
import apiClient from "@/services/apiClient";
import {
  Percent,
  Sparkles,
} from "lucide-react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { CrudHeaderStats } from "@/components/workspace/crud-workspace";
import { ErpRefreshButton } from "@/components/workspace/page-kit";
import { formatCurrency } from "@/lib/formatters";

export interface ItemTierPrice {
  itemId: string;
  itemCode: string;
  itemName: string;
  basePrice: number;
  minQtyTier1: number;
  priceTier1: number;
  minQtyTier2: number;
  priceTier2: number;
  minQtyTier3: number;
  priceTier3: number;
  promotionalDiscountPercent: number;
}

export interface PriceList {
  id: string;
  name: string;
  code: string;
  customerTier: "Wholesale" | "Distributor" | "Retail" | "VIP";
  currencyCode: string;
  validFrom: string;
  validTo: string;
  isActive: boolean;
  items: ItemTierPrice[];
}

export interface PriceCalculationResult {
  itemId: string;
  itemCode: string;
  itemName: string;
  quantity: number;
  baseUnitPrice: number;
  effectiveUnitPrice: number;
  volumeDiscountPercent: number;
  promotionalDiscountPercent: number;
  totalDiscountAmount: number;
  finalLineTotal: number;
  appliedRuleDescription: string;
  currencyCode: string;
}

export function PricingRulesManager() {
  const [priceLists, setPriceLists] = useState<PriceList[]>([]);
  const [selectedList, setSelectedList] = useState<PriceList | null>(null);
  const [loading, setLoading] = useState(true);

  // Live Pricing Simulator State
  const [simTier, setSimTier] = useState<string>("Wholesale");
  const [simQty, setSimQty] = useState<number>(25);
  const [simCurrency, setSimCurrency] = useState<string>("USD");
  const [simResult, setSimResult] = useState<PriceCalculationResult | null>(null);
  const [simulating, setSimulating] = useState(false);

  const fetchPriceLists = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<{ success: boolean; data: PriceList[] }>("/sales/pricing/price-lists");
      if (res.data?.data) {
        setPriceLists(res.data.data);
        if (res.data.data.length > 0 && !selectedList) {
          setSelectedList(res.data.data[0]);
        }
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchPriceLists();
  }, []);

  const handleSimulatePrice = async () => {
    setSimulating(true);
    try {
      const res = await apiClient.post<{ success: boolean; data: PriceCalculationResult }>(
        "/sales/pricing/calculate-effective-price",
        {
          tier: simTier,
          quantity: simQty,
          currency: simCurrency,
        }
      );
      if (res.data?.data) {
        setSimResult(res.data.data);
      }
    } catch {
      // Offline fallback calculation
      const base = 100;
      const volDisc = simQty >= 50 ? 15 : simQty >= 10 ? 8 : 0;
      const promo = simTier === "VIP" ? 5 : simTier === "Wholesale" ? 3 : 0;
      const totalDiscPct = volDisc + promo;
      const effective = base * (1 - totalDiscPct / 100);
      const total = effective * simQty;
      const discountAmt = (base - effective) * simQty;

      setSimResult({
        itemId: "sim-1",
        itemCode: "SKU-PRO-ENTERPRISE",
        itemName: "Enterprise Cloud License",
        quantity: simQty,
        baseUnitPrice: base,
        effectiveUnitPrice: effective,
        volumeDiscountPercent: volDisc,
        promotionalDiscountPercent: promo,
        totalDiscountAmount: discountAmt,
        finalLineTotal: total,
        appliedRuleDescription: `Applied ${volDisc}% volume break + ${promo}% ${simTier} tier discount`,
        currencyCode: simCurrency,
      });
    } finally {
      setSimulating(false);
    }
  };

  useEffect(() => {
    void handleSimulatePrice();
  }, [simTier, simQty, simCurrency]);

  return (
    <StandardPageLayout
      title="Pricing Matrix & Discount Engine"
      subtitle="Customer tier agreements, multi-level volume breaks, promotional loyalty discounts, and real-time quotation calculators."
      eyebrow="Sales & Commercial"
      icon="tags"
      meta={
        <CrudHeaderStats
          items={[
            { label: "Price Lists", value: priceLists.length, helper: "matrices" },
            {
              label: "Configured SKUs",
              value: priceLists.reduce((acc, pl) => acc + pl.items.length, 0),
              tone: "positive",
            },
            {
              label: "Tiers Supported",
              value: "4 Levels",
              tone: "info",
            },
          ]}
        />
      }
      actions={
        <ErpRefreshButton onClick={() => void fetchPriceLists()} loading={loading} />
      }
    >
      {/* Main Grid: Price Lists + Volume Breaks Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left 1 Col: Price List Selection */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-2.5">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">
              Active Price Lists ({priceLists.length})
            </h3>

            <div className="space-y-2">
              {priceLists.map((pl) => {
                const isSelected = selectedList?.id === pl.id;
                return (
                  <div
                    key={pl.id}
                    onClick={() => setSelectedList(pl)}
                    className={`p-3.5 rounded-xl border transition cursor-pointer text-xs space-y-1.5 ${
                      isSelected
                        ? "border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 shadow-xs"
                        : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900 dark:text-white">{pl.name}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                        {pl.customerTier}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                      <span>{pl.code}</span>
                      <span>{pl.items.length} Configured SKUs</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Interactive Live Price Simulator Card */}
          <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
              <Sparkles className="w-4 h-4" />
              <span>Real-Time Pricing Simulator</span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 text-[11px] font-semibold mb-1">Customer Tier</label>
                <select
                  value={simTier}
                  onChange={(e) => setSimTier(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 font-bold text-white outline-hidden"
                >
                  <option value="Wholesale">Wholesale Tier</option>
                  <option value="Distributor">Distributor Level</option>
                  <option value="VIP">VIP Key Account</option>
                  <option value="Retail">Retail Standard</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 text-[11px] font-semibold mb-1">Order Quantity (Units)</label>
                <input
                  type="number"
                  min={1}
                  value={simQty}
                  onChange={(e) => setSimQty(parseInt(e.target.value) || 1)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 font-mono font-bold text-white outline-hidden"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-[11px] font-semibold mb-1">Currency</label>
                <select
                  value={simCurrency}
                  onChange={(e) => setSimCurrency(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 font-bold text-white outline-hidden"
                >
                  <option value="USD">USD ($)</option>
                  <option value="INR">INR (₹)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>
            </div>

            {simResult && (
              <div className="p-3.5 bg-slate-800/80 rounded-xl border border-slate-700/80 space-y-2 text-xs font-mono">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Base Unit Price:</span>
                  <span className="line-through">{formatCurrency(simResult.baseUnitPrice, simResult.currencyCode)}</span>
                </div>
                <div className="flex items-center justify-between font-bold text-emerald-400">
                  <span>Effective Unit:</span>
                  <span>{formatCurrency(simResult.effectiveUnitPrice, simResult.currencyCode)}</span>
                </div>
                <div className="flex items-center justify-between text-amber-300 text-[11px]">
                  <span>Total Discount:</span>
                  <span>-{formatCurrency(simResult.totalDiscountAmount, simResult.currencyCode)}</span>
                </div>
                <div className="border-t border-slate-700 pt-2 flex items-center justify-between font-bold text-white text-sm">
                  <span>Line Total:</span>
                  <span className="text-blue-400">{formatCurrency(simResult.finalLineTotal, simResult.currencyCode)}</span>
                </div>
                <p className="text-[10px] text-slate-400 font-sans mt-1">{simResult.appliedRuleDescription}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right 2 Cols: Selected Price List Volume Matrix */}
        <div className="lg:col-span-2 space-y-4">
          {selectedList ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-3.5">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">{selectedList.name}</h2>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      Active
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                    {selectedList.code} • Target Tier: {selectedList.customerTier} • Valid until{" "}
                    {new Date(selectedList.validTo).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Volume Tiers Breakdown Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-3 px-3">Product / SKU</th>
                      <th className="py-3 px-3 text-right">Base Price</th>
                      <th className="py-3 px-3 text-right">Tier 1 (1+ Units)</th>
                      <th className="py-3 px-3 text-right">Tier 2 (10+ Units)</th>
                      <th className="py-3 px-3 text-right">Tier 3 (50+ Units)</th>
                      <th className="py-3 px-3 text-center">Promo Discount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                    {selectedList.items.map((it) => (
                      <tr key={it.itemId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="py-3 px-3 font-sans font-semibold text-slate-900 dark:text-white">
                          {it.itemName}
                          <div className="text-slate-400 font-mono text-[10px]">{it.itemCode}</div>
                        </td>
                        <td className="py-3 px-3 text-right text-slate-500 dark:text-slate-400 font-bold">
                          {formatCurrency(it.basePrice, selectedList.currencyCode)}
                        </td>
                        <td className="py-3 px-3 text-right text-slate-800 dark:text-slate-200">
                          {formatCurrency(it.priceTier1, selectedList.currencyCode)}
                        </td>
                        <td className="py-3 px-3 text-right text-blue-600 dark:text-blue-400 font-bold">
                          {formatCurrency(it.priceTier2, selectedList.currencyCode)}
                          <span className="text-[10px] text-blue-400 block font-normal">≥ {it.minQtyTier2} units</span>
                        </td>
                        <td className="py-3 px-3 text-right text-emerald-600 dark:text-emerald-400 font-bold">
                          {formatCurrency(it.priceTier3, selectedList.currencyCode)}
                          <span className="text-[10px] text-emerald-400 block font-normal">≥ {it.minQtyTier3} units</span>
                        </td>
                        <td className="py-3 px-3 text-center font-sans">
                          {it.promotionalDiscountPercent > 0 ? (
                            <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                              <Percent className="w-3 h-3" />
                              {it.promotionalDiscountPercent}% Extra
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-400 border border-dashed rounded-2xl border-slate-300 dark:border-slate-800">
              Select a price list from the left to view volume breaks and tier pricing.
            </div>
          )}
        </div>
      </div>
    </StandardPageLayout>
  );
}

export default PricingRulesManager;
