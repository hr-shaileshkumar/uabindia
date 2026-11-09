import apiClient from "@/services/apiClient";
import { PageSchema, ColumnDefinition, FormFieldDefinition } from "./types";
import { getCatalogSchema } from "./catalog";

interface SchemaCacheEntry {
  schema: PageSchema;
  timestamp: number;
}

const schemaCache = new Map<string, SchemaCacheEntry>();
const SCHEMA_CACHE_TTL_MS = 60_000;

export function invalidateSchemaCache(pageKey?: string): void {
  if (pageKey) {
    schemaCache.delete(pageKey.toLowerCase().trim());
  } else {
    schemaCache.clear();
  }
}

export async function loadPageSchema(pageKey: string, bypassCache = false): Promise<PageSchema> {
  const normalizedKey = pageKey.toLowerCase().trim();

  // Tier 0: In-Memory / Stale-While-Revalidate Cache Check
  if (!bypassCache) {
    const cached = schemaCache.get(normalizedKey);
    if (cached && Date.now() - cached.timestamp < SCHEMA_CACHE_TTL_MS) {
      return cached.schema;
    }
  }

  const cacheAndReturn = (schema: PageSchema): PageSchema => {
    schemaCache.set(normalizedKey, { schema, timestamp: Date.now() });
    return schema;
  };

  // Tier 1: Check backend Metadata / UI Pages API (published or draft custom schema)
  try {
    const res = await apiClient.get(`/metadata/pages/${encodeURIComponent(normalizedKey)}`);
    if (res.data) {
      const raw = res.data;
      const schemaJson = raw.schemaJson;
      const parsed: PageSchema = typeof schemaJson === "string" ? JSON.parse(schemaJson) : schemaJson;
      if (parsed && (parsed.columns?.length || parsed.form?.sections?.length || parsed.viewType)) {
        return cacheAndReturn({
          ...parsed,
          pageKey: raw.pageKey || normalizedKey,
          title: raw.title || parsed.title,
          subTitle: raw.subTitle || parsed.subTitle,
          apiEndpoint: parsed.apiEndpoint || raw.apiEndpoint || `/api/v1/${normalizedKey.replace(".", "/")}`,
        });
      }
    }
  } catch {
    // Continue to Tier 2
  }

  // Tier 1b: Try /api/v1/ui-pages/{pageKey}
  try {
    const res = await apiClient.get(`/ui-pages/${encodeURIComponent(normalizedKey)}`);
    if (res.data) {
      const raw = res.data;
      const schemaJson = raw.schemaJson;
      const parsed: PageSchema = typeof schemaJson === "string" ? JSON.parse(schemaJson) : schemaJson;
      if (parsed && (parsed.columns?.length || parsed.form?.sections?.length || parsed.viewType)) {
        return cacheAndReturn({
          ...parsed,
          pageKey: raw.pageKey || normalizedKey,
          title: raw.title || parsed.title,
          subTitle: raw.subTitle || parsed.subTitle,
          apiEndpoint: parsed.apiEndpoint || raw.apiEndpoint || `/api/v1/${normalizedKey.replace(".", "/")}`,
        });
      }
    }
  } catch {
    // Continue to Tier 2
  }

  // Tier 2: Built-in Standard ERP Schema Catalog (Zero hardcoded view, pure metadata)
  const catalogSchema = getCatalogSchema(normalizedKey);
  if (catalogSchema) {
    return cacheAndReturn(catalogSchema);
  }

  // Tier 3: Auto-synthesize schema on the fly from Backend Entity Reflection
  try {
    const entityName = normalizedKey.split(".").pop() || normalizedKey;
    const fieldsRes = await apiClient.get<Array<{ key: string; label: string; type: string; isRequired: boolean }>>(
      `/ui-pages/entities/${encodeURIComponent(entityName)}/fields`
    );

    if (fieldsRes.data && Array.isArray(fieldsRes.data) && fieldsRes.data.length > 0) {
      const cols: ColumnDefinition[] = fieldsRes.data.map((f) => ({
        key: f.key,
        label: f.label,
        type: (f.type as any) || "text",
        sortable: true,
        defaultVisible: true,
      }));

      const formFields: FormFieldDefinition[] = fieldsRes.data.map((f) => ({
        key: f.key,
        label: f.label,
        type: (f.type as any) || "text",
        required: f.isRequired,
        span: 1,
      }));

      return cacheAndReturn({
        pageKey: normalizedKey,
        title: entityName.charAt(0).toUpperCase() + entityName.slice(1),
        subTitle: `Dynamic metadata view for ${entityName}`,
        entityName,
        moduleKey: normalizedKey.split(".")[0] || "general",
        viewType: "table",
        apiEndpoint: `/${normalizedKey.replace(".", "/")}`,
        columns: cols,
        form: {
          sections: [
            {
              key: "general",
              label: "Entity Details",
              fields: formFields,
            },
          ],
        },
        actions: [
          { key: "create", label: "Add New", variant: "primary", icon: "Plus" },
          { key: "edit", label: "Edit", variant: "secondary", icon: "Pencil" },
          { key: "delete", label: "Delete", variant: "danger", icon: "Trash2" },
        ],
      });
    }
  } catch {
    // Ignore fallback
  }

  // Final graceful fallback if entity has zero registered fields
  return cacheAndReturn({
    pageKey: normalizedKey,
    title: normalizedKey,
    subTitle: "Dynamic Page",
    entityName: normalizedKey,
    moduleKey: "platform",
    viewType: "table",
    apiEndpoint: `/${normalizedKey.replace(".", "/")}`,
    columns: [
      { key: "code", label: "Code", width: 140 },
      { key: "name", label: "Name", width: 220 },
      { key: "status", label: "Status", type: "badge", width: 120 },
    ],
    form: {
      sections: [
        {
          key: "general",
          label: "Basic Details",
          fields: [
            { key: "code", label: "Code", type: "text", required: true, span: 1 },
            { key: "name", label: "Name / Title", type: "text", required: true, span: 1 },
            { key: "description", label: "Description", type: "textarea", span: 2 },
            { key: "isActive", label: "Active Status", type: "boolean", defaultValue: true, span: 1 },
          ],
        },
      ],
    },
    actions: [
      { key: "create", label: "Add New", variant: "primary", icon: "Plus" },
      { key: "edit", label: "Edit", variant: "secondary", icon: "Pencil" },
      { key: "delete", label: "Delete", variant: "danger", icon: "Trash2" },
    ],
  });
}
