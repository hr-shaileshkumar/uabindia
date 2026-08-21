"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Percent } from "lucide-react";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { CrudHeaderStats } from "@/components/erp/crud-workspace";
import { SideDrawer } from "@/components/ui/side-drawer";
import { ErpCreateButton, ErpDrawerFooter, ErpRefreshButton, ErpRowActions } from "@/components/erp/erp-page-kit";
import { salesApi } from "@/services/modules";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { getApiErrorMessage } from "@/lib/api-errors";
import { asRows, formatInr, formatSchemeDiscount, useDocumentMasters } from "@/components/erp/erp-document-kit";

type SchemeRow = {
  id: string;
  schemeCode?: string;
  schemeName?: string;
  discountType?: string;
  scope?: string;
  value?: number;
  priority?: number;
  validFrom?: string;
  validTo?: string;
  minQuantity?: number;
  status?: string;
  category?: string;
  notes?: string;
  productCount?: number;
  lines?: Array<{ itemId?: string; category?: string; value?: number }>;
};

type ProductRow = {
  id: string;
  itemCode?: string;
  itemName?: string;
  category?: string;
  sellingPrice?: number;
  schemeName?: string;
  discountType?: string;
  discountValue?: number;
  netRate?: number;
};

type SchemeForm = {
  schemeName: string;
  discountType: "Percent" | "Amount" | "SpecialPrice";
  scope: "AllItems" | "Category" | "Items";
  value: string;
  priority: string;
  validFrom: string;
  validTo: string;
  minQuantity: string;
  status: string;
  category: string;
  notes: string;
  itemIds: string[];
};

const todayIso = () => new Date().toISOString().slice(0, 10);
const plusDays = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};

const emptyForm = (): SchemeForm => ({
  schemeName: "",
  discountType: "Percent",
  scope: "Items",
  value: "10",
  priority: "10",
  validFrom: todayIso(),
  validTo: plusDays(30),
  minQuantity: "0",
  status: "Active",
  category: "",
  notes: "",
  itemIds: [],
});

const TYPE_LABEL: Record<string, string> = {
  Percent: "% off list price",
  Amount: "Rs off per unit",
  SpecialPrice: "Fixed selling price",
};

const SCOPE_LABEL: Record<string, string> = {
  AllItems: "All products",
  Category: "One category",
  Items: "Selected products",
};

const STATUS_CHIP: Record<string, string> = {
  Active: "erp-chip erp-chip-success",
  Draft: "erp-chip erp-chip-neutral",
  Inactive: "erp-chip erp-chip-danger",
};

export default function DiscountsPage() {
  const { items } = useDocumentMasters();
  const [tab, setTab] = useState<"schemes" | "products">("schemes");
  const [schemes, setSchemes] = useState<SchemeRow[]>([]);
  const [productMap, setProductMap] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<SchemeForm>(emptyForm);
  const [itemQuery, setItemQuery] = useState("");

  const categories = useMemo(
    () => [...new Set(items.map((item) => item.category).filter(Boolean))] as string[],
    [items],
  );

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [schemeRes, mapRes] = await Promise.all([
        salesApi.discounts.getAll(1, 100),
        salesApi.discounts.productMap().catch(() => ({ data: { data: [] } })),
      ]);
      setSchemes(asRows<SchemeRow>(schemeRes.data));
      setProductMap(asRows<ProductRow>(mapRes.data));
    } catch (err) {
      const message = getApiErrorMessage(err, "Failed to load discount schemes.");
      setError(message);
      notifyError(message, "Discounts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setItemQuery("");
    setDrawerOpen(true);
  };

  const openEdit = (row: SchemeRow) => {
    setEditingId(row.id);
    setForm({
      schemeName: row.schemeName || "",
      discountType: (row.discountType as SchemeForm["discountType"]) || "Percent",
      scope: (row.scope as SchemeForm["scope"]) || "Items",
      value: String(row.value ?? 0),
      priority: String(row.priority ?? 10),
      validFrom: String(row.validFrom || "").slice(0, 10) || todayIso(),
      validTo: String(row.validTo || "").slice(0, 10) || plusDays(30),
      minQuantity: String(row.minQuantity ?? 0),
      status: row.status || "Active",
      category: row.category || "",
      notes: row.notes || "",
      itemIds: (row.lines || []).map((line) => String(line.itemId || "")).filter(Boolean),
    });
    setItemQuery("");
    setDrawerOpen(true);
  };

  const save = async () => {
    if (!form.schemeName.trim()) {
      setError("Scheme name is required.");
      return;
    }
    if (form.scope === "Category" && !form.category.trim()) {
      setError("Choose the category this discount applies to.");
      return;
    }
    if (form.scope === "Items" && form.itemIds.length === 0) {
      setError("Select at least one product for this discount.");
      return;
    }

    const payload = {
      schemeName: form.schemeName.trim(),
      discountType: form.discountType,
      scope: form.scope,
      value: Number(form.value) || 0,
      priority: Number(form.priority) || 10,
      validFrom: form.validFrom,
      validTo: form.validTo,
      minQuantity: Number(form.minQuantity) || 0,
      status: form.status,
      category: form.scope === "Category" ? form.category : undefined,
      notes: form.notes || undefined,
      lines:
        form.scope === "Items"
          ? form.itemIds.map((itemId) => ({ itemId }))
          : form.scope === "Category"
            ? [{ category: form.category }]
            : [],
    };

    try {
      setSaving(true);
      setError(null);
      if (editingId) await salesApi.discounts.update(editingId, payload);
      else await salesApi.discounts.create(payload);
      setDrawerOpen(false);
      setForm(emptyForm());
      setEditingId(null);
      notifySuccess(editingId ? "Discount scheme updated." : "Discount scheme created.", "Discounts");
      await load();
    } catch (err) {
      const message = getApiErrorMessage(err, "Could not save discount scheme.");
      setError(message);
      notifyError(message, "Discounts");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    try {
      await salesApi.discounts.delete(id);
      notifySuccess("Discount scheme deleted.", "Discounts");
      await load();
    } catch (err) {
      notifyError(getApiErrorMessage(err, "Delete failed."), "Discounts");
    }
  };

  const filteredSchemes = schemes.filter((row) => {
    const query = search.toLowerCase();
    return (
      !query ||
      String(row.schemeName || "").toLowerCase().includes(query) ||
      String(row.schemeCode || "").toLowerCase().includes(query) ||
      String(row.category || "").toLowerCase().includes(query)
    );
  });

  const filteredProducts = productMap.filter((row) => {
    const query = search.toLowerCase();
    return (
      !query ||
      String(row.itemName || "").toLowerCase().includes(query) ||
      String(row.itemCode || "").toLowerCase().includes(query) ||
      String(row.category || "").toLowerCase().includes(query) ||
      String(row.schemeName || "").toLowerCase().includes(query)
    );
  });

  const itemChoices = items.filter((item) => {
    const query = itemQuery.toLowerCase();
    return !query || item.label.toLowerCase().includes(query) || (item.category || "").toLowerCase().includes(query);
  });

  const activeCount = schemes.filter((row) => row.status === "Active").length;
  const productOffers = productMap.filter((row) => row.schemeName).length;

  return (
    <StandardPageLayout
      title="Discounts"
      subtitle="Create retail-style offers: which products get a discount, what kind of discount, and for how long."
      eyebrow="Sales / Pricing"
      icon="percent"
      meta={
        <CrudHeaderStats
          items={[
            { label: "Schemes", value: schemes.length, helper: "defined" },
            { label: "Active", value: activeCount, tone: "positive" },
            { label: "Products on offer", value: productOffers, tone: "info" },
          ]}
        />
      }
      actions={
        <>
          <ErpRefreshButton onClick={() => void load()} loading={loading} />
          <ErpCreateButton label="New discount" onClick={openCreate} />
        </>
      }
      filters={
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex rounded-md border border-slate-200 p-0.5">
            <button
              type="button"
              className={`rounded px-3 py-1 text-xs font-semibold ${tab === "schemes" ? "bg-slate-900 text-white" : "text-slate-600"}`}
              onClick={() => setTab("schemes")}
            >
              Discount schemes
            </button>
            <button
              type="button"
              className={`rounded px-3 py-1 text-xs font-semibold ${tab === "products" ? "bg-slate-900 text-white" : "text-slate-600"}`}
              onClick={() => setTab("products")}
            >
              Product-wise
            </button>
          </div>
          <div className="min-w-48 flex-1">
            <label className="erp-label">Search</label>
            <input
              className="erp-input"
              placeholder={tab === "schemes" ? "Scheme name or code..." : "Item, category, or offer..."}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </div>
      }
    >
      {error ? <div className="erp-alert-error">{error}</div> : null}

      {tab === "schemes" ? (
        <div className="erp-panel">
          <div className="erp-panel-header">
            <div>
              <h2 className="erp-panel-title">Discount schemes</h2>
              <p className="mt-1 text-sm text-slate-500">
                Percent, rupee-off, or special price. Apply to all products, one category, or selected items.
              </p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="erp-table">
              <thead className="erp-thead">
                <tr>
                  <th className="erp-th">Scheme</th>
                  <th className="erp-th">Type</th>
                  <th className="erp-th">Applies to</th>
                  <th className="erp-th">Discount</th>
                  <th className="erp-th">Validity</th>
                  <th className="erp-th">Status</th>
                  <th className="erp-th" />
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="erp-td">
                      <div className="h-4 animate-pulse rounded bg-slate-100" />
                    </td>
                  </tr>
                ) : filteredSchemes.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="erp-td py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Percent className="h-10 w-10 text-slate-300" />
                        <p className="text-sm text-slate-400">No discount schemes yet. Create one to attach offers to products.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredSchemes.map((row) => (
                    <tr key={row.id} className="erp-tr">
                      <td className="erp-td">
                        <div className="font-semibold text-slate-900">{row.schemeName}</div>
                        <div className="font-mono text-xs text-slate-500">{row.schemeCode}</div>
                      </td>
                      <td className="erp-td">{TYPE_LABEL[row.discountType || ""] || row.discountType}</td>
                      <td className="erp-td">
                        {SCOPE_LABEL[row.scope || ""] || row.scope}
                        {row.scope === "Category" && row.category ? ` · ${row.category}` : ""}
                        {row.scope === "Items" ? ` · ${row.productCount || 0} products` : ""}
                      </td>
                      <td className="erp-td font-medium">{formatSchemeDiscount(row.discountType, row.value)}</td>
                      <td className="erp-td text-slate-600">
                        {String(row.validFrom || "").slice(0, 10)} → {String(row.validTo || "").slice(0, 10)}
                      </td>
                      <td className="erp-td">
                        <span className={STATUS_CHIP[row.status || "Draft"] || STATUS_CHIP.Draft}>{row.status}</span>
                      </td>
                      <td className="erp-td">
                        <ErpRowActions
                          onEdit={{ label: "Edit", onClick: () => openEdit(row) }}
                          onDelete={{ label: "Delete", onClick: () => void remove(row.id) }}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="erp-panel">
          <div className="erp-panel-header">
            <div>
              <h2 className="erp-panel-title">Product-wise discount</h2>
              <p className="mt-1 text-sm text-slate-500">
                Highest-priority active scheme wins for each product, the same way store POS pricing works.
              </p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="erp-table">
              <thead className="erp-thead">
                <tr>
                  <th className="erp-th">Item</th>
                  <th className="erp-th">Category</th>
                  <th className="erp-th">List price</th>
                  <th className="erp-th">Scheme</th>
                  <th className="erp-th">Discount</th>
                  <th className="erp-th">Net rate</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="erp-td py-16 text-center text-sm text-slate-400">
                      No products found. Add items in Inventory, then create a scheme.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((row) => (
                    <tr key={row.id} className="erp-tr">
                      <td className="erp-td">
                        <div className="font-medium text-slate-900">{row.itemName}</div>
                        <div className="font-mono text-xs text-slate-500">{row.itemCode}</div>
                      </td>
                      <td className="erp-td">{row.category || "—"}</td>
                      <td className="erp-td tabular-nums">{formatInr(row.sellingPrice)}</td>
                      <td className="erp-td">{row.schemeName || "No offer"}</td>
                      <td className="erp-td">{formatSchemeDiscount(row.discountType, row.discountValue)}</td>
                      <td className="erp-td font-semibold tabular-nums">{formatInr(row.netRate)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <SideDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editingId ? "Edit discount scheme" : "New discount scheme"}
        subtitle="Set the offer type, then choose which products it applies to."
        width="lg"
        footer={
          <ErpDrawerFooter
            onCancel={() => setDrawerOpen(false)}
            onSave={() => void save()}
            saving={saving}
            isEdit={Boolean(editingId)}
            saveLabel="Save scheme"
          />
        }
      >
        <div className="space-y-4">
          <div>
            <label className="erp-label">Scheme name</label>
            <input
              className="erp-input mt-1"
              placeholder="Weekend grocery 10%"
              value={form.schemeName}
              onChange={(event) => setForm({ ...form, schemeName: event.target.value })}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="erp-label">Discount type</label>
              <select
                className="erp-select mt-1"
                value={form.discountType}
                onChange={(event) => setForm({ ...form, discountType: event.target.value as SchemeForm["discountType"] })}
              >
                <option value="Percent">Percent off</option>
                <option value="Amount">Rupee off per unit</option>
                <option value="SpecialPrice">Special price</option>
              </select>
            </div>
            <div>
              <label className="erp-label">
                {form.discountType === "Percent" ? "Percent" : form.discountType === "Amount" ? "Rs off" : "Special price"}
              </label>
              <input
                className="erp-input mt-1"
                inputMode="decimal"
                value={form.value}
                onChange={(event) => setForm({ ...form, value: event.target.value })}
              />
            </div>
            <div>
              <label className="erp-label">Applies to</label>
              <select
                className="erp-select mt-1"
                value={form.scope}
                onChange={(event) => setForm({ ...form, scope: event.target.value as SchemeForm["scope"] })}
              >
                <option value="Items">Selected products</option>
                <option value="Category">One category</option>
                <option value="AllItems">All products</option>
              </select>
            </div>
            <div>
              <label className="erp-label">Priority</label>
              <input
                className="erp-input mt-1"
                inputMode="numeric"
                value={form.priority}
                onChange={(event) => setForm({ ...form, priority: event.target.value })}
              />
              <p className="mt-1 text-[11px] text-slate-500">Higher number wins if two schemes match the same product.</p>
            </div>
            <div>
              <label className="erp-label">Valid from</label>
              <input
                type="date"
                className="erp-input mt-1"
                value={form.validFrom}
                onChange={(event) => setForm({ ...form, validFrom: event.target.value })}
              />
            </div>
            <div>
              <label className="erp-label">Valid to</label>
              <input
                type="date"
                className="erp-input mt-1"
                value={form.validTo}
                onChange={(event) => setForm({ ...form, validTo: event.target.value })}
              />
            </div>
            <div>
              <label className="erp-label">Min qty</label>
              <input
                className="erp-input mt-1"
                inputMode="decimal"
                value={form.minQuantity}
                onChange={(event) => setForm({ ...form, minQuantity: event.target.value })}
              />
            </div>
            <div>
              <label className="erp-label">Status</label>
              <select className="erp-select mt-1" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
                <option value="Active">Active</option>
                <option value="Draft">Draft</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          {form.scope === "Category" ? (
            <div>
              <label className="erp-label">Category</label>
              <select className="erp-select mt-1" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>
                <option value="">Select category</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          {form.scope === "Items" ? (
            <div>
              <label className="erp-label">Products on this offer</label>
              <input
                className="erp-input mt-1"
                placeholder="Search items..."
                value={itemQuery}
                onChange={(event) => setItemQuery(event.target.value)}
              />
              <div className="mt-2 max-h-56 overflow-y-auto rounded-md border border-slate-200">
                {itemChoices.slice(0, 80).map((item) => {
                  const checked = form.itemIds.includes(item.id);
                  return (
                    <label key={item.id} className="flex cursor-pointer items-center gap-2 border-b border-slate-100 px-3 py-2 text-sm last:border-b-0">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          setForm((current) => ({
                            ...current,
                            itemIds: checked
                              ? current.itemIds.filter((id) => id !== item.id)
                              : [...current.itemIds, item.id],
                          }))
                        }
                      />
                      <span className="flex-1 text-slate-800">{item.label}</span>
                      {item.category ? <span className="text-xs text-slate-400">{item.category}</span> : null}
                    </label>
                  );
                })}
              </div>
              <p className="mt-1 text-[11px] text-slate-500">{form.itemIds.length} product(s) selected.</p>
            </div>
          ) : null}

          {form.scope === "AllItems" ? (
            <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              This scheme applies to every active item until a higher-priority product or category scheme matches.
            </p>
          ) : null}

          <div>
            <label className="erp-label">Notes</label>
            <input
              className="erp-input mt-1"
              value={form.notes}
              onChange={(event) => setForm({ ...form, notes: event.target.value })}
              placeholder="Weekend only, store offer, etc."
            />
          </div>
        </div>
      </SideDrawer>
    </StandardPageLayout>
  );
}
