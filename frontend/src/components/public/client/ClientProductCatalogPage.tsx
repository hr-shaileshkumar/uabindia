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
import { publicButtonClassName, publicSectionClassName } from "@/components/public/publicStyles";
import { notifySuccess } from "@/lib/notifications";
import { cn } from "@/lib/utils";

export interface ProductCatalogItem {
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

export default function ClientProductCatalogPage() {
  const { profile, headerContent, footerContent, allowedPaths } = usePublicPageData("products", "tenant");

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
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  const filteredProducts = useMemo(() => {
    return SAMPLE_CATALOG.filter((item) => {
      const matchCategory =
        selectedCategory === "All Categories" || item.category === selectedCategory;
      const matchSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [selectedCategory, searchQuery]);

  const handleOpenRfq = (product: ProductCatalogItem) => {
    setSelectedProductForRfq(product);
    setSubmittedSuccess(false);
  };

  const handleCloseRfq = () => {
    setSelectedProductForRfq(null);
    setSubmittedSuccess(false);
  };

  const handleSubmitRfq = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmittedSuccess(true);
      notifySuccess(`RFQ quotation request submitted for ${selectedProductForRfq?.name}`);
      setTimeout(() => {
        handleCloseRfq();
      }, 2000);
    }, 800);
  };

  return (
    <PublicAudiencePageFrame
      audience="tenant"
      profile={profile}
      headerContent={headerContent}
      footerContent={footerContent}
      allowedPaths={allowedPaths}
    >
      <div className={cn(publicSectionClassName, "pt-4 pb-12 sm:pt-6 sm:pb-16")}>
        {/* Header Breadcrumb & Title */}
        <div className="flex flex-col gap-2 border-b border-slate-200/80 pb-6 dark:border-slate-800">
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-cyan-400">
            <Package className="h-4 w-4" />
            <span className="uppercase tracking-wider">Client B2B Storefront & Catalog</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Official Products & Supply Line
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-3xl">
            Browse authenticated inventory, commercial pricing, availability status, and initiate fast Request for Quotation (RFQ) inquiries directly with our sales desk.
          </p>
        </div>

        {/* Filter & Search Bar */}
        <div className="mt-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Categories Tab Strip */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "shrink-0 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all",
                  selectedCategory === cat
                    ? "bg-[var(--uab-primary,#1d4ed8)] text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                )}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72 shrink-0">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by part, SKU, name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 py-1.5 text-xs text-slate-900 shadow-2xs focus:border-blue-600 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
            />
          </div>
        </div>

        {/* Products Grid */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((p) => (
            <div
              key={p.id}
              className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs transition-all duration-200 hover:border-blue-400 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
            >
              <div>
                {/* Image Cover */}
                <div className="relative h-48 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                  <img
                    src={p.imageUrl}
                    alt={p.name}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <span
                    className={cn(
                      "absolute top-3 right-3 rounded-full px-2.5 py-0.5 text-[10px] font-bold shadow-xs",
                      p.stockStatus === "In Stock" &&
                        "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300",
                      p.stockStatus === "Low Stock" &&
                        "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950 dark:text-amber-300",
                      p.stockStatus === "Made to Order" &&
                        "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950 dark:text-blue-300"
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
                  <p className="text-base font-extrabold text-slate-900 dark:text-white">
                    ₹{p.price.toLocaleString("en-IN")}
                    <span className="text-xs font-normal text-slate-500"> / {p.unit}</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenRfq(p)}
                  className={cn(publicButtonClassName.primary, "h-9 px-3.5 text-xs")}
                >
                  Request RFQ
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredProducts.length === 0 && (
          <div className="mt-12 text-center py-16 border border-dashed border-slate-300 rounded-2xl dark:border-slate-800">
            <Package className="mx-auto h-10 w-10 text-slate-400" />
            <h3 className="mt-3 text-sm font-bold text-slate-800 dark:text-slate-200">No products match your filter</h3>
            <p className="mt-1 text-xs text-slate-500">Try adjusting your search query or selecting All Categories.</p>
          </div>
        )}

        {/* RFQ Drawer / Modal */}
        {selectedProductForRfq && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
            <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={handleCloseRfq}
                className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-cyan-400">
                <Sparkles className="h-4 w-4" />
                <span>REQUEST FOR QUOTATION (RFQ)</span>
              </div>
              <h3 className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                {selectedProductForRfq.name}
              </h3>
              <p className="text-xs text-slate-500">SKU: {selectedProductForRfq.sku} • Category: {selectedProductForRfq.category}</p>

              {submittedSuccess ? (
                <div className="mt-6 text-center py-6">
                  <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
                  <p className="mt-3 text-base font-bold text-slate-900 dark:text-white">Quote Request Received</p>
                  <p className="mt-1 text-xs text-slate-500">Our commercial supply team will send a formal proforma and tax invoice within 4 hours.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmitRfq} className="mt-5 space-y-3.5">
                  <div className="rounded-xl bg-slate-50 p-3.5 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-600 dark:text-slate-300">Target Order Quantity:</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={1}
                          value={rfqQuantity}
                          onChange={(e) => setRfqQuantity(Number(e.target.value))}
                          className="w-20 rounded-lg border border-slate-300 bg-white px-2 py-1 text-right text-xs font-bold dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        />
                        <span className="text-xs font-medium text-slate-500">{selectedProductForRfq.unit}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Your Full Name *</label>
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
