"use client";

import Link from "next/link";
import { useEffect, useState, type ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useConfirmDialog } from "@/components/ui/useConfirmDialog";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { CrudCard, CrudHeaderStats } from "@/components/erp/crud-workspace";
import { ROUTES } from "@/constants/routes";
import { hrApi } from "@/services/hrApi";

type Item = {
  id: string;
  itemCode: string;
  itemName: string;
  category: string;
  unitOfMeasure: string;
  sellingPrice: number;
  purchasePrice?: number;
  hsnCode?: string;
  minStockLevel?: number;
  maxStockLevel?: number;
  reorderLevel?: number;
};

type ItemForm = {
  itemCode: string;
  itemName: string;
  category: string;
  unitOfMeasure: string;
  sellingPrice: number;
  purchasePrice: number;
  hsnCode: string;
  minStockLevel: number;
  maxStockLevel: number;
  reorderLevel: number;
};

const itemsApi = hrApi.erp.items;

const INITIAL_FORM: ItemForm = {
  itemCode: "",
  itemName: "",
  category: "General",
  unitOfMeasure: "Nos",
  sellingPrice: 0,
  purchasePrice: 0,
  hsnCode: "",
  minStockLevel: 0,
  maxStockLevel: 0,
  reorderLevel: 0,
};

const formatCurrency = (value?: number) => `Rs ${(value || 0).toLocaleString("en-IN")}`;

export default function ItemsManager() {
  const { confirm, confirmDialog } = useConfirmDialog();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("list");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ItemForm>(INITIAL_FORM);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await itemsApi.getAll();
      setItems(response.data?.data || []);
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to fetch items.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchItems();
  }, []);

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: ["sellingPrice", "purchasePrice", "minStockLevel", "maxStockLevel", "reorderLevel"].includes(
        name,
      )
        ? Number(value)
        : value,
    }));
  };

  const resetForm = () => {
    setFormData(INITIAL_FORM);
  };

  const handleSave = async () => {
    if (!formData.itemName.trim() || !formData.itemCode.trim()) {
      setError("Item name and item code are required.");
      return;
    }

    try {
      setLoading(true);
      if (editingId) {
        await itemsApi.update(editingId, formData);
      } else {
        await itemsApi.create(formData);
      }

      setActiveTab("list");
      setEditingId(null);
      resetForm();
      await fetchItems();
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save item.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item: Item) => {
    setFormData({
      itemCode: item.itemCode,
      itemName: item.itemName,
      category: item.category,
      unitOfMeasure: item.unitOfMeasure,
      sellingPrice: item.sellingPrice,
      purchasePrice: item.purchasePrice || 0,
      hsnCode: item.hsnCode || "",
      minStockLevel: item.minStockLevel || 0,
      maxStockLevel: item.maxStockLevel || 0,
      reorderLevel: item.reorderLevel || 0,
    });
    setEditingId(item.id);
    setActiveTab("form");
  };

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: "Delete item",
      message: "Permanently delete this item? This action cannot be undone.",
      confirmText: "Delete",
      variant: "danger",
    });
    if (!ok) {
      return;
    }

    try {
      await itemsApi.delete(id);
      await fetchItems();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete item.");
    }
  };

  const categories = new Set(items.map((item) => item.category).filter(Boolean)).size;
  const stockReady = items.filter((item) => Number(item.minStockLevel || 0) > 0).length;
  const taxTagged = items.filter((item) => Boolean(item.hsnCode)).length;

  return (
    <StandardPageLayout
      title="Items"
      subtitle="Maintain the item master used by procurement, sales, warehouse, and stock-control workflows."
      eyebrow="Inventory / Catalog"
      icon="box"
      meta={
        <CrudHeaderStats
          items={[
            { label: "Items", value: items.length, helper: "catalog" },
            { label: "Categories", value: categories, tone: "info" },
            { label: "Stock Ready", value: stockReady, tone: "positive" },
            { label: "HSN", value: taxTagged, tone: "warning" },
          ]}
        />
      }
      actions={
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => {
              setEditingId(null);
              resetForm();
              setActiveTab("form");
            }}
          >
            Add Item
          </Button>
          <Link href={ROUTES.INVENTORY_HOME} className="erp-action-btn erp-action-btn-secondary">
            Back to inventory
          </Link>
        </div>
      }
    >
      <div className="space-y-4">
        {confirmDialog}
        {error && <div className="erp-alert-error">{error}</div>}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="erp-tabs-list">
            <TabsTrigger
              value="list"
              className="erp-tab-trigger data-[state=active]:erp-tab-trigger-active"
            >
              Item Register
            </TabsTrigger>
            <TabsTrigger
              value="form"
              className="erp-tab-trigger data-[state=active]:erp-tab-trigger-active"
            >
              {editingId ? "Edit Item" : "New Item"}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list">
            <CrudCard
              title="Item Catalog"
              description="Keep the item master dense. Show identity, pricing, tax tagging, and stock controls in one table."
              actions={
                <Button
                  onClick={() => {
                    setEditingId(null);
                    resetForm();
                    setActiveTab("form");
                  }}
                >
                  Add Item
                </Button>
              }
            >
                {loading ? (
                  <div className="erp-loading">Loading items...</div>
                ) : items.length === 0 ? (
                  <div className="erp-empty">No items found.</div>
                ) : (
                  <div className="erp-table-wrap border-0 shadow-none">
                    <table className="erp-table">
                      <thead className="erp-thead">
                        <tr>
                          <th className="erp-th">Code</th>
                          <th className="erp-th">Item</th>
                          <th className="erp-th">Category</th>
                          <th className="erp-th">UOM</th>
                          <th className="erp-th">Price</th>
                          <th className="erp-th">Stock Rules</th>
                          <th className="erp-th">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item) => (
                          <tr key={item.id} className="erp-tr">
                            <td className="erp-td font-medium text-slate-900">{item.itemCode}</td>
                            <td className="erp-td">
                              <p className="font-semibold text-slate-900">{item.itemName}</p>
                              <p className="text-xs text-slate-500">
                                {item.hsnCode ? `HSN ${item.hsnCode}` : "No HSN mapping"}
                              </p>
                            </td>
                            <td className="erp-td text-slate-600">{item.category}</td>
                            <td className="erp-td text-slate-600">{item.unitOfMeasure}</td>
                            <td className="erp-td">
                              <p className="font-medium text-slate-900">
                                {formatCurrency(item.sellingPrice)}
                              </p>
                              <p className="text-xs text-slate-500">
                                Buy {formatCurrency(item.purchasePrice)}
                              </p>
                            </td>
                            <td className="erp-td text-xs text-slate-600">
                              Min {item.minStockLevel || 0} / Reorder {item.reorderLevel || 0}
                            </td>
                            <td className="erp-td">
                              <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={() => handleEdit(item)}>
                                  Edit
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => void handleDelete(item.id)}
                                >
                                  Delete
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
            </CrudCard>
          </TabsContent>

          <TabsContent value="form">
            <Card className="erp-panel">
              <CardHeader className="border-b border-slate-100 bg-white/75">
                <CardTitle>{editingId ? "Edit Item" : "Create Item"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <div>
                    <label className="erp-label">Item Code</label>
                    <input
                      name="itemCode"
                      value={formData.itemCode}
                      onChange={handleChange}
                      placeholder="ITEM-001"
                      className="erp-input"
                    />
                  </div>
                  <div>
                    <label className="erp-label">Item Name</label>
                    <input
                      name="itemName"
                      value={formData.itemName}
                      onChange={handleChange}
                      placeholder="Product or material name"
                      className="erp-input"
                    />
                  </div>
                  <div>
                    <label className="erp-label">Category</label>
                    <input
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      placeholder="General"
                      className="erp-input"
                    />
                  </div>
                  <div>
                    <label className="erp-label">Unit of Measure</label>
                    <input
                      name="unitOfMeasure"
                      value={formData.unitOfMeasure}
                      onChange={handleChange}
                      placeholder="Nos"
                      className="erp-input"
                    />
                  </div>
                  <div>
                    <label className="erp-label">Selling Price</label>
                    <input
                      name="sellingPrice"
                      type="number"
                      min={0}
                      value={formData.sellingPrice}
                      onChange={handleChange}
                      className="erp-input"
                    />
                  </div>
                  <div>
                    <label className="erp-label">Purchase Price</label>
                    <input
                      name="purchasePrice"
                      type="number"
                      min={0}
                      value={formData.purchasePrice}
                      onChange={handleChange}
                      className="erp-input"
                    />
                  </div>
                  <div>
                    <label className="erp-label">HSN Code</label>
                    <input
                      name="hsnCode"
                      value={formData.hsnCode}
                      onChange={handleChange}
                      placeholder="Optional tax code"
                      className="erp-input"
                    />
                  </div>
                  <div>
                    <label className="erp-label">Min Stock Level</label>
                    <input
                      name="minStockLevel"
                      type="number"
                      min={0}
                      value={formData.minStockLevel}
                      onChange={handleChange}
                      className="erp-input"
                    />
                  </div>
                  <div>
                    <label className="erp-label">Reorder Level</label>
                    <input
                      name="reorderLevel"
                      type="number"
                      min={0}
                      value={formData.reorderLevel}
                      onChange={handleChange}
                      className="erp-input"
                    />
                  </div>
                  <div>
                    <label className="erp-label">Max Stock Level</label>
                    <input
                      name="maxStockLevel"
                      type="number"
                      min={0}
                      value={formData.maxStockLevel}
                      onChange={handleChange}
                      className="erp-input"
                    />
                  </div>
                </div>

                <div className="erp-form-actions">
                  <Button variant="outline" onClick={() => setActiveTab("list")}>
                    Cancel
                  </Button>
                  <Button onClick={() => void handleSave()} disabled={loading}>
                    {editingId ? "Update Item" : "Save Item"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </StandardPageLayout>
  );
}
