"use client";

import { useEffect, useState } from "react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Edit, Eye, EyeOff } from "lucide-react";
import { notifyError, notifySuccess } from "@/lib/notifications";
import WebsitePageEditor from "@/components/admin/website/WebsitePageEditor";

interface WebsitePage {
  id: string;
  pageType: string;
  title: string;
  contentJson: string;
  isPublished: boolean;
  tenantId?: string;
  tenantName?: string;
}

type WebsiteTenantGroup = {
  tenant: string;
  pages: WebsitePage[];
};

type WebsitePagesResponse = WebsitePage[] | { tenants?: WebsiteTenantGroup[] };

const PAGE_TYPES = [
  { key: "header", label: "Header" },
  { key: "home", label: "Home Page" },
  { key: "about", label: "About Page" },
  { key: "contact", label: "Contact Page" },
  { key: "career", label: "Career Page" },
  { key: "login", label: "Login Page" },
  { key: "footer", label: "Footer" },
];

export default function WebsitePagesPage() {
  const [pages, setPages] = useState<WebsitePage[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPage, setEditingPage] = useState<WebsitePage | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    checkSuperAdmin();
    loadPages();
  }, []);

  const checkSuperAdmin = () => {
    // Assuming we can get this from context or API
    // For now, hardcode or fetch
    setIsSuperAdmin(true); // TODO: implement proper check
  };

  const loadPages = async () => {
    try {
      const response = await fetch("/api/v1/website/pages");
      if (response.ok) {
        const data = (await response.json()) as WebsitePagesResponse;
        const pageList: WebsitePage[] = hasTenantGroups(data)
          ? data.tenants.flatMap((tenantGroup) =>
              tenantGroup.pages.map((page) => ({ ...page, tenantName: tenantGroup.tenant }))
            )
          : Array.isArray(data)
            ? data
            : [];
        setPages(pageList);
      }
    } catch {
      notifyError("Failed to load website pages");
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async (page: WebsitePage, publish: boolean) => {
    try {
      const params = new URLSearchParams();
      if (isSuperAdmin && page.tenantId) {
        params.append('tenantId', page.tenantId);
      }
      const url = `${publish
        ? `/api/v1/website/pages/${page.pageType}/publish`
        : `/api/v1/website/pages/${page.pageType}/unpublish`}?${params.toString()}`;
      const response = await fetch(url, { method: "POST" });
      if (response.ok) {
        setPages(prev => prev.map(p => p.id === page.id ? { ...p, isPublished: publish } : p));
        notifySuccess(`Page ${publish ? "published" : "unpublished"}`);
      } else {
        notifyError("Failed to update publish status");
      }
    } catch {
      notifyError("Failed to update publish status");
    }
  };

  const handleSavePage = async (page: WebsitePage, title: string, contentJson: string) => {
    try {
      const body: { title: string; contentJson: string; tenantId?: string } = { title, contentJson };
      if (isSuperAdmin && page.tenantId) {
        body.tenantId = page.tenantId;
      }
      const response = await fetch(`/api/v1/website/pages/${page.pageType}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (response.ok) {
        setPages(prev => prev.map(p => p.id === page.id ? { ...p, title, contentJson } : p));
        notifySuccess("Page saved successfully");
        setEditingPage(null);
      } else {
        notifyError("Failed to save page");
      }
    } catch {
      notifyError("Failed to save page");
    }
  };

  if (loading) {
    return (
      <StandardPageLayout title="Website Pages" subtitle="Manage your public website content">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading...</div>
        </div>
      </StandardPageLayout>
    );
  }

  // Group pages by tenant if super admin
  const groupedPages = isSuperAdmin
    ? pages.reduce((acc, page) => {
        const key = page.tenantName || "Unknown Tenant";
        if (!acc[key]) acc[key] = [];
        acc[key].push(page);
        return acc;
      }, {} as Record<string, WebsitePage[]>)
    : { "Current Tenant": pages };

  return (
    <StandardPageLayout title="Website Pages" subtitle="Manage your public website content">
      {Object.entries(groupedPages).map(([tenantName, tenantPages]) => (
        <div key={tenantName} className="mb-8">
          {isSuperAdmin && <h3 className="text-lg font-semibold mb-4">{tenantName}</h3>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {PAGE_TYPES.map(({ key, label }) => {
              const page = tenantPages.find(p => p.pageType === key) || { id: `${key}-${tenantName}`, pageType: key, title: "", contentJson: "{}", isPublished: false };
              return (
                <Card key={`${key}-${tenantName}`}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      {label}
                      <span className={`rounded-full px-2 py-1 text-xs font-semibold ${page.isPublished ? "bg-slate-100 text-slate-700" : "bg-slate-100 text-slate-500"}`}>
                        {page.isPublished ? "Published" : "Draft"}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium">{page.title || "No title set"}</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {page.contentJson !== "{}" ? "Content configured" : "No content"}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingPage(page)}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePublish(page, !page.isPublished)}
                        >
                          {page.isPublished ? (
                            <>
                              <EyeOff className="w-4 h-4 mr-2" />
                              Unpublish
                            </>
                          ) : (
                            <>
                              <Eye className="w-4 h-4 mr-2" />
                              Publish
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ))}

      {editingPage && (
        <WebsitePageEditor
          pageType={editingPage.pageType}
          initialTitle={editingPage.title || ""}
          initialContent={editingPage.contentJson || "{}"}
          onSave={(title, content) => handleSavePage(editingPage, title, content)}
          onClose={() => setEditingPage(null)}
        />
      )}
    </StandardPageLayout>
  );
}

function hasTenantGroups(data: WebsitePagesResponse): data is { tenants: WebsiteTenantGroup[] } {
  return !Array.isArray(data) && Array.isArray(data.tenants);
}
