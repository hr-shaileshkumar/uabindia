"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Copy,
  ExternalLink,
  FileCode,
  FilePlus,
  Globe,
  Layers,
  MoreVertical,
  Pencil,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react";
import { notifySuccess } from "@/lib/notifications";
import { cn } from "@/lib/utils";

export interface ManagedPageItem {
  id: string;
  title: string;
  slug: string;
  template: "Standard Landing" | "Full-Width Hero" | "Catalog Grid" | "Contact Form" | "Legal Document";
  status: "Published" | "Draft" | "Scheduled";
  lastModified: string;
  views: number;
  isSystem?: boolean;
}

const INITIAL_PAGES: ManagedPageItem[] = [
  {
    id: "page-home",
    title: "Home Page (Root)",
    slug: "/",
    template: "Full-Width Hero",
    status: "Published",
    lastModified: "Today, 10:45 AM",
    views: 1420,
    isSystem: true,
  },
  {
    id: "page-about",
    title: "About Corporate Organization",
    slug: "/about",
    template: "Standard Landing",
    status: "Published",
    lastModified: "Yesterday",
    views: 432,
    isSystem: true,
  },
  {
    id: "page-products",
    title: "B2B Products & Enterprise Catalog",
    slug: "/products",
    template: "Catalog Grid",
    status: "Published",
    lastModified: "3 days ago",
    views: 890,
    isSystem: true,
  },
  {
    id: "page-pricing",
    title: "Subscription & Enterprise Pricing",
    slug: "/pricing",
    template: "Standard Landing",
    status: "Published",
    lastModified: "1 week ago",
    views: 654,
    isSystem: true,
  },
  {
    id: "page-careers",
    title: "Careers & Open Positions",
    slug: "/careers",
    template: "Standard Landing",
    status: "Published",
    lastModified: "2 weeks ago",
    views: 290,
    isSystem: true,
  },
  {
    id: "page-contact",
    title: "Contact & Strategic Support",
    slug: "/contact",
    template: "Contact Form",
    status: "Published",
    lastModified: "Yesterday",
    views: 512,
    isSystem: true,
  },
  {
    id: "page-privacy",
    title: "Privacy Policy & DPDP Indian Compliance",
    slug: "/privacy",
    template: "Legal Document",
    status: "Published",
    lastModified: "1 month ago",
    views: 124,
    isSystem: true,
  },
  {
    id: "page-terms",
    title: "Master Terms of Service & SLA",
    slug: "/terms",
    template: "Legal Document",
    status: "Published",
    lastModified: "1 month ago",
    views: 98,
    isSystem: true,
  },
];

export default function WebsitePagesManager() {
  const [pages, setPages] = useState<ManagedPageItem[]>(INITIAL_PAGES);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("All");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Page Form State
  const [newTitle, setNewTitle] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newTemplate, setNewTemplate] = useState<ManagedPageItem["template"]>("Standard Landing");

  const filteredPages = pages.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.slug.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "All" || p.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleCreatePage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const formattedSlug = newSlug.startsWith("/") ? newSlug : `/${newSlug.trim().toLowerCase().replace(/\s+/g, "-")}`;
    const newPage: ManagedPageItem = {
      id: `page-${Date.now()}`,
      title: newTitle.trim(),
      slug: formattedSlug,
      template: newTemplate,
      status: "Draft",
      lastModified: "Just now",
      views: 0,
      isSystem: false,
    };

    setPages([newPage, ...pages]);
    setIsAddModalOpen(false);
    setNewTitle("");
    setNewSlug("");
    notifySuccess(`Page Created: "${newPage.title}"`, `New page initialized as a Draft at ${newPage.slug}.`);
  };

  const handleDuplicatePage = (page: ManagedPageItem) => {
    const duplicate: ManagedPageItem = {
      id: `page-${Date.now()}`,
      title: `${page.title} (Copy)`,
      slug: `${page.slug}-copy`,
      template: page.template,
      status: "Draft",
      lastModified: "Just now",
      views: 0,
      isSystem: false,
    };
    setPages([duplicate, ...pages]);
    notifySuccess("Page Duplicated", `Cloned page "${duplicate.title}" as Draft.`);
  };

  const handleDeletePage = (id: string, title: string) => {
    setPages(pages.filter((p) => p.id !== id));
    notifySuccess("Page Removed", `Deleted page "${title}".`);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
              <FileCode className="h-3.5 w-3.5" />
              <span>Multi-Page CMS Engine</span>
            </div>
            <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
              Website Pages & Content Architecture
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              WordPress-grade page routing, custom slugs, automated SEO indexing, and instant visual editing for enterprise tenants.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/administration/website"
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <Layers className="h-4 w-4" />
              <span>Visual Customizer</span>
            </Link>

            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-5 text-xs font-bold text-white shadow-xs hover:bg-blue-700 cursor-pointer transition-all"
            >
              <FilePlus className="h-4 w-4" />
              <span>Add New Page</span>
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
          <div className="relative max-w-sm flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by page title or slug..."
              className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-4 text-xs text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-800 dark:bg-slate-850 dark:text-white"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500">Status:</span>
            {["All", "Published", "Draft"].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setFilterStatus(st)}
                className={cn(
                  "rounded-lg px-2.5 py-1 text-xs font-semibold transition-all",
                  filterStatus === st
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                )}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Pages Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-850/60 dark:text-slate-400">
              <tr>
                <th className="py-3.5 pl-6 pr-4">Page Title & Slug</th>
                <th className="py-3.5 px-4">Layout Template</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Traffic (Views)</th>
                <th className="py-3.5 px-4">Last Modified</th>
                <th className="py-3.5 pl-4 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredPages.map((page) => (
                <tr key={page.id} className="group hover:bg-slate-50/80 dark:hover:bg-slate-850/50 transition-colors">
                  <td className="py-4 pl-6 pr-4">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                        <Globe className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white">{page.title}</span>
                          {page.isSystem && (
                            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9.5px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                              System
                            </span>
                          )}
                        </div>
                        <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">{page.slug}</span>
                      </div>
                    </div>
                  </td>

                  <td className="py-4 px-4">
                    <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300">
                      {page.template}
                    </span>
                  </td>

                  <td className="py-4 px-4">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold",
                        page.status === "Published"
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
                          : "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400"
                      )}
                    >
                      <span
                        className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          page.status === "Published" ? "bg-emerald-500" : "bg-amber-500"
                        )}
                      />
                      <span>{page.status}</span>
                    </span>
                  </td>

                  <td className="py-4 px-4 font-mono font-semibold text-slate-700 dark:text-slate-300">
                    {page.views.toLocaleString()}
                  </td>

                  <td className="py-4 px-4 text-slate-500 dark:text-slate-400">
                    {page.lastModified}
                  </td>

                  <td className="py-4 pl-4 pr-6 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link
                        href={page.slug}
                        target="_blank"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                        title="Open Live URL"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>

                      <Link
                        href="/administration/website"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-blue-600 hover:bg-blue-50 dark:border-slate-800 dark:text-blue-400 dark:hover:bg-blue-950"
                        title="Customize in Visual Editor"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Link>

                      <button
                        type="button"
                        onClick={() => handleDuplicatePage(page)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white cursor-pointer"
                        title="Duplicate Page"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>

                      {!page.isSystem && (
                        <button
                          type="button"
                          onClick={() => handleDeletePage(page.id, page.title)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-950 dark:text-red-400 dark:hover:bg-red-950/60 cursor-pointer"
                          title="Delete Page"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add New Page Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Create New Website Page
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Provision a new route with instant SEO indexing and enterprise layout preset.
            </p>

            <form onSubmit={handleCreatePage} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Page Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => {
                    setNewTitle(e.target.value);
                    if (!newSlug) {
                      setNewSlug(`/${e.target.value.toLowerCase().replace(/\s+/g, "-")}`);
                    }
                  }}
                  placeholder="e.g. Strategic Partnerships"
                  className="mt-1 h-10 w-full rounded-xl border border-slate-300 px-3.5 text-xs text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">URL Slug</label>
                <input
                  type="text"
                  required
                  value={newSlug}
                  onChange={(e) => setNewSlug(e.target.value)}
                  placeholder="/partnerships"
                  className="mt-1 h-10 w-full rounded-xl border border-slate-300 px-3.5 font-mono text-xs text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Layout Template</label>
                <select
                  value={newTemplate}
                  onChange={(e) => setNewTemplate(e.target.value as ManagedPageItem["template"])}
                  className="mt-1 h-10 w-full rounded-xl border border-slate-300 px-3.5 text-xs text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="Standard Landing">Standard Landing (Header + Hero + Content)</option>
                  <option value="Full-Width Hero">Full-Width Hero (Split Banner + Cockpit Preview)</option>
                  <option value="Catalog Grid">Catalog Grid (Products, Filters, RFQ Inquiry)</option>
                  <option value="Contact Form">Contact Form (Inquiry Capture + Google Maps)</option>
                  <option value="Legal Document">Legal Document (Policy Text + Table of Contents)</option>
                </select>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 cursor-pointer"
                >
                  Create Page
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
