"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import { hrApi } from "@/lib/hrApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

export default function ItemsPage() {
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
      const response = await hrApi.erp.items.getAll();
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
    fetchItems();
  }, []);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: [
        "sellingPrice",
        "purchasePrice",
        "minStockLevel",
        "maxStockLevel",
        "reorderLevel",
      ].includes(name)
        ? Number(value)
        : value,
    }));
  };

  const handleSave = async () => {
    if (!formData.itemName.trim() || !formData.itemCode.trim()) {
      setError("Item name and code are required");
      return;
    }

    try {
      setLoading(true);
      const payload = {
        itemCode: formData.itemCode,
        itemName: formData.itemName,
        category: formData.category,
        unitOfMeasure: formData.unitOfMeasure,
        sellingPrice: formData.sellingPrice,
        purchasePrice: formData.purchasePrice,
        hsnCode: formData.hsnCode,
        minStockLevel: formData.minStockLevel,
        maxStockLevel: formData.maxStockLevel,
        reorderLevel: formData.reorderLevel,
      };

      if (editingId) {
        await hrApi.erp.items.update(editingId, payload);
      } else {
        await hrApi.erp.items.create(payload);
      }

      setActiveTab("list");
      setEditingId(null);
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
    if (!confirm("Are you sure you want to delete this item?")) return;
    try {
      await hrApi.erp.items.delete(id);
      await fetchItems();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to delete item";
      setError(message);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Items</h1>
        <p className="text-sm text-gray-600 mt-1">Inventory and product master</p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-red-700 font-medium">{error}</p>
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
              <Button onClick={() => setActiveTab("form")}>Add Item</Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="py-10 text-center text-gray-500">Loading items...</div>
              ) : items.length === 0 ? (
                <div className="py-10 text-center text-gray-500">No items found.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium text-gray-600">Code</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-600">Name</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-600">Category</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-600">UOM</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-600">Selling Price</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {items.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-900">{item.itemCode}</td>
                          <td className="px-4 py-3 text-gray-700">{item.itemName}</td>
                          <td className="px-4 py-3 text-gray-600">{item.category}</td>
                          <td className="px-4 py-3 text-gray-600">{item.unitOfMeasure}</td>
                          <td className="px-4 py-3 text-gray-600">₹{item.sellingPrice.toLocaleString()}</td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" onClick={() => handleEdit(item)}>Edit</Button>
                              <Button variant="destructive" size="sm" onClick={() => handleDelete(item.id)}>Delete</Button>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Item Code</label>
                  <input
                    name="itemCode"
                    value={formData.itemCode}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Item Name</label>
                  <input
                    name="itemName"
                    value={formData.itemName}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Category</label>
                  <input
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Unit of Measure</label>
                  <input
                    name="unitOfMeasure"
                    value={formData.unitOfMeasure}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Selling Price</label>
                  <input
                    name="sellingPrice"
                    type="number"
                    value={formData.sellingPrice}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Purchase Price</label>
                  <input
                    name="purchasePrice"
                    type="number"
                    value={formData.purchasePrice}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">HSN Code</label>
                  <input
                    name="hsnCode"
                    value={formData.hsnCode}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Reorder Level</label>
                  <input
                    name="reorderLevel"
                    type="number"
                    value={formData.reorderLevel}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Min Stock Level</label>
                  <input
                    name="minStockLevel"
                    type="number"
                    value={formData.minStockLevel}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Max Stock Level</label>
                  <input
                    name="maxStockLevel"
                    type="number"
                    value={formData.maxStockLevel}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setActiveTab("list")}>Cancel</Button>
                <Button onClick={handleSave} disabled={loading}>
                  {editingId ? "Update Item" : "Save Item"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
