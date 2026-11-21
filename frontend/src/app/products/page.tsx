"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  ShoppingCart,
  Package,
  Layers,
  ArrowRight,
  CheckCircle2,
  Send,
  X,
  Sparkles,
  SlidersHorizontal,
  FileSpreadsheet,
} from "lucide-react";
import PublicAudiencePageFrame from "@/components/public/PublicAudiencePageFrame";
import { usePublicPageData } from "@/hooks/usePublicPageData";
import { useResolvedPublicAudience } from "@/hooks/useResolvedPublicAudience";
import { publicButtonClassName, publicSectionClassName } from "@/components/public/publicStyles";
import { notifySuccess } from "@/lib/notifications";
import { cn } from "@/lib/utils";

interface ProductCatalogItem {
  id: string;
  name: string;
  sku: string;
  category: "Finished Goods" | "Raw Materials" | "Machinery & Spares" | "IT & Electronics";
  price: number;
  unit: string;
  stockStatus: "In Stock" | "Low Stock" | "Made to Order";
  stockCount: number;
  leadTime: string;
  description: string;
  imageUrl: string;
}

const SAMPLE_CATALOG: ProductCatalogItem[] = [
  {
    id: "prod-1",
    name: "Industrial High-Torque Servo Motor 4.5kW",
    sku: "MOT-SRV-450",
    category: "Machinery & Spares",
    price: 34500,
    unit: "Unit",
    stockStatus: "In Stock",
    stockCount: 42,
    leadTime: "24-48 Hours",
    description: "Heavy-duty CNC automated machine servo with built-in digital encoder and IP65 enclosure.",
    imageUrl: "https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: "prod-2",
    name: "Precision Aluminum Extrusion Profile 40x40",
    sku: "AL-EXT-4040",
    category: "Raw Materials",
    price: 1850,
    unit: "Meter (3m length)",
    stockStatus: "In Stock",
    stockCount: 380,
    leadTime: "Same Day Dispatch",
    description: "Anodized T-slot aluminum framing system for machine bases, cleanroom enclosures, and assembly jigs.",
    imageUrl: "https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: "prod-3",
    name: "Enterprise Managed PoE+ Gigabit Switch 24-Port",
    sku: "NET-POE-24G",
    category: "IT & Electronics",
    price: 24900,
    unit: "Unit",
    stockStatus: "In Stock",
    stockCount: 18,
    leadTime: "1-2 Business Days",
    description: "Layer 2+ cloud-managed PoE switch with 370W power budget, 4x SFP+ 10G uplinks, and redundant power support.",
    imageUrl: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: "prod-4",
    name: "Automated Packaging Shrink Film Roll 50 Micron",
    sku: "PKG-SHR-050",
    category: "Finished Goods",
    price: 3200,
    unit: "Roll (500m)",
    stockStatus: "Low Stock",
    stockCount: 8,
    leadTime: "3-5 Days",
    description: "High-clarity polyolefin heat shrink film certified for pharmaceutical and food grade secondary packaging.",
    imageUrl: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: "prod-5",
    name: "IoT Edge Telemetry Gateway Node with 4G LTE",
    sku: "IOT-GW-4GL",
    category: "IT & Electronics",
    price: 16800,
    unit: "Unit",
    stockStatus: "In Stock",
    stockCount: 65,
    leadTime: "48 Hours",
    description: "Industrial RS-485 / Modbus to MQTT gateway node with dual SIM failover and wide operating temperature.",
    imageUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: "prod-6",
    name: "Heavy Duty Conveyor Roller Assembly 60mm Dia",
    sku: "CNV-ROL-60G",
    category: "Machinery & Spares",
    price: 950,
    unit: "Piece",
    stockStatus: "Made to Order",
    stockCount: 0,
    leadTime: "5-7 Days",
    description: "Zinc-plated gravity and driven roller assembly with precision labyrinth sealed ball bearings.",
    imageUrl: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80",
  },
];

const CATEGORIES = ["All Categories", "Machinery & Spares", "Raw Materials", "IT & Electronics", "Finished Goods"] as const;

export default function ProductsStorefrontPage() {
  const { audience } = useResolvedPublicAudience();
  const { profile, headerContent, footerContent, allowedPaths } = usePublicPageData("products", audience);

  const [selectedCategory, setSelectedCategory] = useState<string>("All Categories");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProductForRfq, setSelectedProductForRfq] = useState<ProductCatalogItem | null>(null);

  // RFQ Form State
  const [rfqQuantity, setRfqQuantity] = useState<number>(10);
  const [rfqName, setRfqName] = useState("");
  const [rfqEmail, setRfqEmail] = useState("");
  const [rfqPhone, setRfqPhone] = useState("");
  const [rfqCompany, setRfqCompany] = useState("");
  const [rfqNotes, setRfqNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rfqSuccessData, setRfqSuccessData] = useState<{ quoteRef: string } | null>(null);

  const filteredProducts = useMemo(() => {
    return SAMPLE_CATALOG.filter((item) => {
      const matchesCategory = selectedCategory === "All Categories" || item.category === selectedCategory;
      const matchesSearch =
        !searchQuery.trim() ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  const handleSubmitRfq = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rfqEmail.trim() || !rfqName.trim()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      const generatedRef = `RFQ-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      setRfqSuccessData({ quoteRef: generatedRef });
      notifySuccess(`Quotation inquiry ${generatedRef} registered in ERP Sales Desk.`);
    }, 800);
  };

  const handleCloseDrawer = () => {
    setSelectedProductForRfq(null);
    setRfqSuccessData(null);
    setRfqName("");
    setRfqEmail("");
    setRfqPhone("");
    setRfqCompany("");
    setRfqNotes("");
    setRfqQuantity(10);
  };

  return (
    <PublicAudiencePageFrame
      audience={audience}
      profile={profile}
      headerContent={headerContent}
      footerContent={footerContent}
      allowedPaths={allowedPaths}
      footerVariant="full"
    >
      <div className="bg-[#f8fafc] dark:bg-slate-950 min-h-screen pb-16">
        {/* Hero Header */}
        <div className="border-b border-slate-200/90 bg-white dark:border-slate-800 dark:bg-slate-900/60 py-12 sm:py-16">
          <div className={publicSectionClassName}>
            <div className="max-w-3xl">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                <Sparkles className="h-3.5 w-3.5" /> B2B Catalog &amp; Direct Ordering
              </span>
              <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl dark:text-white">
                Enterprise Product Storefront &amp; Stock Ledger
              </h1>
              <p className="mt-3 text-base text-slate-600 dark:text-slate-300">
                Direct procurement portal synced with real-time warehouse inventory, volume pricing, and automated GST quotation dispatch.
              </p>
            </div>

            {/* Filter & Search Bar */}
            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              {/* Category Pills */}
              <div className="flex flex-wrap items-center gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={cn(
                      "rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all",
                      selectedCategory === cat
                        ? "bg-blue-600 text-white shadow-xs"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Search Box */}
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search products, SKUs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Product Catalog Grid */}
        <div className={cn(publicSectionClassName, "mt-10")}>
          <div className="flex items-center justify-between text-xs text-slate-500 mb-6">
            <span>Showing <strong className="text-slate-900 dark:text-white">{filteredProducts.length}</strong> items</span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Live Inventory Sync Active
            </span>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProducts.map((p) => (
              <div
                key={p.id}
                className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs transition-all duration-200 hover:border-blue-400 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
              >
                <div>
                  {/* Product Image */}
                  <div className="relative aspect-[16/10] overflow-hidden bg-slate-100 dark:bg-slate-800">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <span
                      className={cn(
                        "absolute right-3 top-3 rounded-full px-2.5 py-0.5 text-[10px] font-bold shadow-xs",
                        p.stockStatus === "In Stock"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300"
                          : p.stockStatus === "Low Stock"
                          ? "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950 dark:text-amber-300"
                          : "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950 dark:text-blue-300"
                      )}
                    >
                      {p.stockStatus}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                      <span>SKU: {p.sku}</span>
                      <span className="text-blue-600 dark:text-cyan-400 font-semibold">{p.category}</span>
                    </div>

                    <h2 className="mt-2 text-base font-bold text-slate-900 group-hover:text-blue-600 dark:text-white transition-colors">
                      {p.name}
                    </h2>
                    <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400 line-clamp-2">
                      {p.description}
                    </p>

                    <div className="mt-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3 text-xs">
                      <span className="text-slate-500">Dispatch: <strong>{p.leadTime}</strong></span>
                      {p.stockCount > 0 && <span className="text-slate-500">Avail: <strong>{p.stockCount} {p.unit}</strong></span>}
                    </div>
                  </div>
                </div>

                {/* Footer Pricing & CTA */}
                <div className="border-t border-slate-100 bg-slate-50/70 p-5 dark:border-slate-800 dark:bg-slate-900/60 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Unit Rate</span>
                    <p className="text-lg font-extrabold text-slate-900 dark:text-white">
                      ₹{p.price.toLocaleString("en-IN")}{" "}
                      <span className="text-xs font-normal text-slate-500">/ {p.unit}</span>
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedProductForRfq(p)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition-colors"
                  >
                    Request Quote <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Slide-over RFQ Drawer */}
        {selectedProductForRfq && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 sm:p-6">
            <div className="relative w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 max-h-[90vh] overflow-y-auto">
              <button
                onClick={handleCloseDrawer}
                className="absolute right-5 top-5 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>

              {rfqSuccessData ? (
                <div className="py-8 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <h3 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">
                    Quotation Request Submitted!
                  </h3>
                  <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">
                    Your inquiry has been registered in the ERP Commercial Queue with Reference:
                  </p>
                  <div className="mx-auto mt-4 inline-block rounded-xl bg-blue-50 px-4 py-2 font-mono text-sm font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                    {rfqSuccessData.quoteRef}
                  </div>
                  <p className="mt-4 text-[11px] text-slate-400">
                    A formal commercial quotation with statutory GST invoice schedule has been sent to your work email.
                  </p>
                  <button
                    onClick={handleCloseDrawer}
                    className={cn(publicButtonClassName.primary, "mt-6 w-full")}
                  >
                    Done
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmitRfq} className="space-y-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-cyan-400">
                      B2B Commercial RFQ
                    </span>
                    <h3 className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                      Request Quotation for {selectedProductForRfq.name}
                    </h3>
                    <p className="text-xs text-slate-500">
                      SKU: <span className="font-mono">{selectedProductForRfq.sku}</span> · Base: ₹{selectedProductForRfq.price.toLocaleString("en-IN")}/{selectedProductForRfq.unit}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Required Quantity *</label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={rfqQuantity}
                        onChange={(e) => setRfqQuantity(Number(e.target.value))}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Estimated Value</label>
                      <div className="mt-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono font-bold text-slate-800 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200">
                        ₹{(selectedProductForRfq.price * rfqQuantity).toLocaleString("en-IN")}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Full Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="Your full name"
                        value={rfqName}
                        onChange={(e) => setRfqName(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Work Email *</label>
                      <input
                        type="email"
                        required
                        placeholder="you@company.com"
                        value={rfqEmail}
                        onChange={(e) => setRfqEmail(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Phone / Mobile</label>
                        <input
                          type="tel"
                          placeholder="+91 98765 43210"
                          value={rfqPhone}
                          onChange={(e) => setRfqPhone(e.target.value)}
                          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Company Name</label>
                        <input
                          type="text"
                          placeholder="Your company"
                          value={rfqCompany}
                          onChange={(e) => setRfqCompany(e.target.value)}
                          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Delivery Notes / Specs</label>
                      <textarea
                        rows={2}
                        placeholder="Delivery location, custom specifications, or packaging requirements..."
                        value={rfqNotes}
                        onChange={(e) => setRfqNotes(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={cn(publicButtonClassName.primary, "mt-4 w-full")}
                  >
                    <Send className="h-4 w-4" />
                    {isSubmitting ? "Submitting Inquiry..." : "Submit Formal RFQ"}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </PublicAudiencePageFrame>
  );
}
