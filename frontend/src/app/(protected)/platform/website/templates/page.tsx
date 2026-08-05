"use client";

import { useState, useMemo } from "react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import ErpHeaderSummary from "@/components/layout/ErpHeaderSummary";
import { notifySuccess } from "@/lib/notifications";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from "@/components/ui/dialog";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Search, 
  LayoutGrid, 
  List, 
  Eye, 
  CheckCircle2, 
  FileText,
  MousePointerClick,
  MonitorPlay,
  Layers
} from "lucide-react";

type TemplateCategory = "Marketing" | "Company" | "Sales" | "Content" | "Creative" | "Support";

type WebsiteTemplate = {
  id: string;
  name: string;
  category: TemplateCategory;
  description: string;
  previewColor: string;
  sections: string[];
  popularity: number;
  isNew: boolean;
};

const TEMPLATES: WebsiteTemplate[] = [
  {
    id: "tpl-001",
    name: "Landing Page",
    category: "Marketing",
    description: "High-converting modern landing page with hero, features, and clear CTAs.",
    previewColor: "linear-gradient(135deg, #0ea5e9 0%, #38bdf8 100%)",
    sections: ["Hero", "Features", "Testimonials", "Pricing", "CTA"],
    popularity: 98,
    isNew: false,
  },
  {
    id: "tpl-002",
    name: "About Us",
    category: "Company",
    description: "Tell your company story with team profiles, mission statement, and core values.",
    previewColor: "linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)",
    sections: ["Hero", "Mission", "Values", "Team", "Timeline"],
    popularity: 85,
    isNew: false,
  },
  {
    id: "tpl-003",
    name: "Contact Page",
    category: "Support",
    description: "Get in touch page featuring a contact form, interactive map, and location details.",
    previewColor: "linear-gradient(135deg, #10b981 0%, #34d399 100%)",
    sections: ["Header", "Contact Form", "Map", "Locations", "FAQ snippet"],
    popularity: 92,
    isNew: false,
  },
  {
    id: "tpl-004",
    name: "Pricing Page",
    category: "Sales",
    description: "Clear and compelling pricing tiers with feature comparisons and FAQ section.",
    previewColor: "linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)",
    sections: ["Header", "Tier Cards", "Feature Table", "FAQ", "CTA"],
    popularity: 89,
    isNew: false,
  },
  {
    id: "tpl-005",
    name: "Blog Layout",
    category: "Content",
    description: "Clean content layout with article grid, featured posts, and sidebar widgets.",
    previewColor: "linear-gradient(135deg, #ef4444 0%, #f87171 100%)",
    sections: ["Featured Post", "Grid View", "Sidebar", "Newsletter"],
    popularity: 76,
    isNew: true,
  },
  {
    id: "tpl-006",
    name: "Portfolio/Showcase",
    category: "Creative",
    description: "Visual-first gallery layout to showcase projects, case studies, or photography.",
    previewColor: "linear-gradient(135deg, #ec4899 0%, #f472b6 100%)",
    sections: ["Hero Slider", "Gallery Grid", "Testimonials", "Contact CTA"],
    popularity: 82,
    isNew: false,
  },
  {
    id: "tpl-007",
    name: "Careers Page",
    category: "Company",
    description: "Attract top talent with culture showcase, benefits, and open positions board.",
    previewColor: "linear-gradient(135deg, #06b6d4 0%, #22d3ee 100%)",
    sections: ["Hero", "Culture", "Benefits", "Open Positions", "Application"],
    popularity: 71,
    isNew: true,
  },
  {
    id: "tpl-008",
    name: "FAQ/Knowledge Base",
    category: "Support",
    description: "Organized support center with searchable accordions and category navigation.",
    previewColor: "linear-gradient(135deg, #64748b 0%, #94a3b8 100%)",
    sections: ["Search Header", "Categories", "Accordion List", "Contact Support"],
    popularity: 88,
    isNew: false,
  },
];

const CATEGORIES = ["All", ...Array.from(new Set(TEMPLATES.map((t) => t.category)))];

export default function WebsiteTemplatesPage() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [previewTemplate, setPreviewTemplate] = useState<WebsiteTemplate | null>(null);

  const filteredTemplates = useMemo(() => {
    return TEMPLATES.filter((template) => {
      const matchesSearch = template.name.toLowerCase().includes(search.toLowerCase()) || 
                            template.description.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = categoryFilter === "All" || template.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [search, categoryFilter]);

  const handleUseTemplate = (template: WebsiteTemplate) => {
    notifySuccess(`Template "${template.name}" applied successfully.`, "Template Ready");
    setPreviewTemplate(null);
  };

  const headerSummary = (
    <ErpHeaderSummary
      items={[
        { label: "Total Templates", value: TEMPLATES.length.toString() },
        { label: "Categories", value: (CATEGORIES.length - 1).toString(), tone: "info" },
        { label: "New Additions", value: TEMPLATES.filter(t => t.isNew).length.toString(), tone: "success" }
      ]}
    />
  );

  return (
    <StandardPageLayout
      title="Page Templates"
      subtitle="Manage and apply reusable page templates for your website"
      eyebrow="Platform / Website"
      icon="layers"
      meta={headerSummary}
      filters={
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 items-center gap-4">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Search templates..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="erp-input w-48"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === "All" ? "All Categories" : cat}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center rounded-md border border-slate-200 bg-slate-50 p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`flex items-center justify-center rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                viewMode === "grid" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <LayoutGrid className="mr-2 h-4 w-4" />
              Grid
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center justify-center rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                viewMode === "list" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <List className="mr-2 h-4 w-4" />
              List
            </button>
          </div>
        </div>
      }
    >
      {filteredTemplates.length === 0 ? (
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
          <Layers className="h-12 w-12 text-slate-300" />
          <h3 className="mt-4 text-lg font-semibold text-slate-900">No templates found</h3>
          <p className="mt-2 text-sm text-slate-500">
            Try adjusting your search or category filter to find what you&apos;re looking for.
          </p>
          <Button 
            variant="outline" 
            className="mt-6"
            onClick={() => {
              setSearch("");
              setCategoryFilter("All");
            }}
          >
            Clear Filters
          </Button>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md"
            >
              {/* Preview Area */}
              <div 
                className="relative h-48 w-full shrink-0"
                style={{ background: template.previewColor }}
              >
                <div className="absolute right-3 top-3 flex items-center gap-2">
                  {template.isNew && (
                    <Badge className="bg-white text-slate-900 hover:bg-slate-100 border-none shadow-sm font-semibold">
                      New
                    </Badge>
                  )}
                  <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm text-slate-700 hover:bg-white shadow-sm">
                    {template.category}
                  </Badge>
                </div>
                
                {/* Overlay with Actions */}
                <div className="absolute inset-0 flex items-center justify-center gap-3 bg-slate-900/0 opacity-0 transition-all group-hover:bg-slate-900/40 group-hover:opacity-100 backdrop-blur-[2px]">
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    className="shadow-md"
                    onClick={() => setPreviewTemplate(template)}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Preview
                  </Button>
                  <Button 
                    size="sm" 
                    className="shadow-md"
                    onClick={() => handleUseTemplate(template)}
                  >
                    <MousePointerClick className="mr-2 h-4 w-4" />
                    Use
                  </Button>
                </div>
              </div>

              {/* Content Area */}
              <div className="flex flex-1 flex-col p-5">
                <div className="flex items-start justify-between">
                  <h3 className="text-lg font-semibold text-slate-900 group-hover:text-primary transition-colors">
                    {template.name}
                  </h3>
                </div>
                <p className="mt-2 flex-1 text-sm text-slate-500 line-clamp-2">
                  {template.description}
                </p>
                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                  <div className="flex items-center text-xs text-slate-500">
                    <FileText className="mr-1.5 h-3.5 w-3.5" />
                    {template.sections.length} Sections
                  </div>
                  <div className="flex items-center text-xs text-slate-500">
                    Popularity: <span className="ml-1 font-medium text-slate-700">{template.popularity}%</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHead>Template Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Sections</TableHead>
                <TableHead>Popularity</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTemplates.map((template) => (
                <TableRow key={template.id} className="hover:bg-slate-50/50 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div 
                        className="h-10 w-10 shrink-0 rounded-md border border-slate-200 shadow-sm" 
                        style={{ background: template.previewColor }}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-900">{template.name}</span>
                          {template.isNew && (
                            <Badge variant="outline" className="text-[10px] uppercase px-1.5 py-0 h-4 border-emerald-200 bg-emerald-50 text-emerald-700">New</Badge>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 truncate max-w-xs">{template.description}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-slate-100 text-slate-700 font-normal">
                      {template.category}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800">
                      {template.sections.length}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-100">
                        <div 
                          className="h-full bg-primary" 
                          style={{ width: `${template.popularity}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-600">{template.popularity}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setPreviewTemplate(template)}>
                        Preview
                      </Button>
                      <Button size="sm" onClick={() => handleUseTemplate(template)}>
                        Use
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Preview Modal */}
      <Dialog open={!!previewTemplate} onOpenChange={(open) => !open && setPreviewTemplate(null)}>
        <DialogContent className="max-w-3xl overflow-hidden p-0 gap-0">
          {previewTemplate && (
            <>
              {/* Modal Header Preview Area */}
              <div 
                className="relative h-48 w-full sm:h-64"
                style={{ background: previewTemplate.previewColor }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="flex items-center gap-3">
                    <Badge className="bg-white/20 text-white backdrop-blur-md border-none hover:bg-white/30">
                      {previewTemplate.category}
                    </Badge>
                    {previewTemplate.isNew && (
                      <Badge className="bg-emerald-500/80 text-white backdrop-blur-md border-none">
                        New Addition
                      </Badge>
                    )}
                  </div>
                  <h2 className="mt-2 text-3xl font-bold text-white tracking-tight">
                    {previewTemplate.name}
                  </h2>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6">
                <DialogHeader className="mb-6 space-y-3">
                  <DialogTitle className="sr-only">Template Details</DialogTitle>
                  <DialogDescription className="text-base text-slate-600">
                    {previewTemplate.description}
                  </DialogDescription>
                </DialogHeader>

                <div>
                  <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500">
                    Included Sections
                  </h4>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {previewTemplate.sections.map((section, idx) => (
                      <div key={idx} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 shadow-sm">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white shadow-sm border border-slate-100 text-slate-500">
                          <MonitorPlay className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-medium text-slate-700">{section}</span>
                        <CheckCircle2 className="ml-auto h-4 w-4 text-emerald-500" />
                      </div>
                    ))}
                  </div>
                </div>

                <DialogFooter className="mt-8 border-t border-slate-100 pt-6">
                  <Button variant="outline" onClick={() => setPreviewTemplate(null)}>
                    Cancel
                  </Button>
                  <Button onClick={() => handleUseTemplate(previewTemplate)}>
                    <MousePointerClick className="mr-2 h-4 w-4" />
                    Use This Template
                  </Button>
                </DialogFooter>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </StandardPageLayout>
  );
}
