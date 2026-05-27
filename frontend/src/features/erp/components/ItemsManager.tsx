"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useConfirmDialog } from "@/components/ui/useConfirmDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StandardPageLayout from "@/components/layout/StandardPageLayout";

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

type ItemsManagerProps = {
  api: any;
};

export default function ItemsManager({ api }: ItemsManagerProps) {
  const { confirm, confirmDialog } = useConfirmDialog();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("list");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ItemForm>({
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
  });

  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await api.getAll();
      setItems(response.data?.data || []);
      setError(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to fetch items";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const response = await api.getAll();
        setItems(response.data?.data || []);
        setError(null);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to fetch items";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [api]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: ["sellingPrice", "purchasePrice", "minStockLevel", "maxStockLevel", "reorderLevel"].includes(name)
        ? Number(value)
        : value,
    }));
  };

  const resetForm = () => {
    setFormData({
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
    });
  };

  const handleSave = async () => {
    if (!formData.itemName.trim() || !formData.itemCode.trim()) {
      setError("Item name and code are required");
      return;
    }

    try {
      setLoading(true);
      if (editingId) {
        await api.update(editingId, formData);
      } else {
        await api.create(formData);
      }

      setActiveTab("list");
      setEditingId(null);
      resetForm();
      await fetchItems();
      setError(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save item";
      setError(message);
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
    if (!ok) return;
    try {
      await api.delete(id);
      await fetchItems();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to delete item";
      setError(message);
    }
  };

  return (
    <StandardPageLayout title="Items" subtitle="Inventory and product master">
      <div className="space-y-4 p-4">
        {confirmDialog}
        {error && (
          <div className="erp-alert-error">
            <p className="font-medium">{error}</p>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="list">Item List</TabsTrigger>
            <TabsTrigger value="form">{editingId ? "Edit Item" : "New Item"}</TabsTrigger>
          </TabsList>

          <TabsContent value="list">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Item Catalog</CardTitle>
                <Button onClick={() => { setEditingId(null); resetForm(); setActiveTab("form"); }}>Add Item</Button>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="erp-loading">Loading items…</div>
                ) : items.length === 0 ? (
                  <div className="erp-empty">No items found.</div>
                ) : (
                  <div className="erp-table-wrap border-0 shadow-none">
                    <table className="erp-table">
                      <thead className="erp-thead">
                        <tr>
                          <th className="erp-th">Code</th>
                          <th className="erp-th">Name</th>
                          <th className="erp-th">Category</th>
                          <th className="erp-th">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item) => (
                          <tr key={item.id} className="erp-tr">
                            <td className="erp-td font-medium text-slate-900">{item.itemCode}</td>
                            <td className="erp-td">{item.itemName}</td>
                            <td className="erp-td text-slate-600">{item.category}</td>
                            <td className="erp-td">
                              <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={() => handleEdit(item)}>Edit</Button>
                                <Button variant="destructive" size="sm" onClick={() => void handleDelete(item.id)}>Delete</Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="form">
            <Card>
              <CardHeader>
                <CardTitle>{editingId ? "Edit Item" : "Create Item"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <input name="itemCode" value={formData.itemCode} onChange={handleChange} placeholder="Item Code" className="erp-input" />
                  <input name="itemName" value={formData.itemName} onChange={handleChange} placeholder="Item Name" className="erp-input" />
                  <input name="category" value={formData.category} onChange={handleChange} placeholder="Category" className="erp-input" />
                  <input name="unitOfMeasure" value={formData.unitOfMeasure} onChange={handleChange} placeholder="Unit" className="erp-input" />
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setActiveTab("list")}>Cancel</Button>
                  <Button onClick={() => void handleSave()} disabled={loading}>{editingId ? "Update Item" : "Save Item"}</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </StandardPageLayout>
  );
}
