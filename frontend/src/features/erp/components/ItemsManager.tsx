"use client";

import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { GlobalLoading } from "@/components/ui/GlobalLoading";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useConfirmDialog } from "@/components/ui/useConfirmDialog";
import { SideDrawer } from "@/components/ui/side-drawer";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { hrApi } from "@/services/hrApi";
import { Search, Plus, Eye, Edit3, Trash2, Package, Tag, DollarSign, Layers, ShieldAlert } from "lucide-react";

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

const formatCurrency = (value?: number) =>
  value != null ? `₹${value.toLocaleString("en-IN")}` : "-";

export default function ItemsManager() {
  const { confirm, confirmDialog } = useConfirmDialog();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Drawer state management
  const [isFormDrawerOpen, setIsFormDrawerOpen] = useState(false);
  const [isViewDrawerOpen, setIsViewDrawerOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState<ItemForm>(INITIAL_FORM);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await itemsApi.getAll();
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
    void fetchItems();
  }, []);

  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return items;
    const term = searchTerm.toLowerCase();
    return items.filter(
      (item) =>
        item.itemName.toLowerCase().includes(term) ||
        item.itemCode.toLowerCase().includes(term) ||
        item.category.toLowerCase().includes(term) ||
        (item.hsnCode && item.hsnCode.toLowerCase().includes(term))
    );
  }, [items, searchTerm]);

  const categoryCount = useMemo(
    () => new Set(items.map((i) => i.category)).size,
    [items]
  );

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "sellingPrice" ||
        name === "purchasePrice" ||
        name === "minStockLevel" ||
        name === "maxStockLevel" ||
        name === "reorderLevel"
          ? Number(value)
          : value,
    }));
  };

  const resetForm = () => {
    setFormData(INITIAL_FORM);
    setEditingId(null);
  };

  const openCreateDrawer = () => {
    resetForm();
    setIsFormDrawerOpen(true);
  };

  const openEditDrawer = (item: Item) => {
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
    setIsFormDrawerOpen(true);
  };

  const openViewDrawer = (item: Item) => {
    setSelectedItem(item);
    setIsViewDrawerOpen(true);
  };

  const handleSave = async () => {
    if (!formData.itemName.trim() || !formData.itemCode.trim()) {
      notifyError("Item name and item code are required fields.");
      return;
    }

    try {
      setLoading(true);
      if (editingId) {
        await itemsApi.update(editingId, formData);
        notifySuccess(`Item "${formData.itemName}" updated successfully.`);
      } else {
        await itemsApi.create(formData);
        notifySuccess(`Item "${formData.itemName}" created successfully.`);
      }
      setIsFormDrawerOpen(false);
      resetForm();
      await fetchItems();
      setError(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save item";
      notifyError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const ok = await confirm({
      title: `Delete Item "${name}"`,
      message: "Are you sure you want to delete this inventory item record? Linked stock movements may be affected.",
      confirmText: "Delete Record",
      variant: "danger",
    });
    if (!ok) return;

    try {
      await itemsApi.delete(id);
      notifySuccess("Item record deleted.");
      await fetchItems();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to delete item";
      notifyError(message);
    }
  };

  return (
    <StandardPageLayout
      title="Items & Inventory Master"
      subtitle="Manage product catalog, HSN codes, purchasing & selling prices, UOM, and reorder levels."
      eyebrow="Inventory / Masters"
      icon="package"
      meta={
        <>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
            {items.length} Catalog Items
          </span>
          <span className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700">
            {categoryCount} Categories
          </span>
        </>
      }
      actions={
        <Button onClick={openCreateDrawer} className="gap-2">
          <Plus className="h-4 w-4" /> Add Item
        </Button>
      }
    >
      <div className="space-y-4">
        {confirmDialog}

        <Card className="border border-slate-200/80 shadow-sm">
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <CardTitle className="text-lg font-bold text-slate-900">Product & SKU Directory</CardTitle>
              <p className="mt-0.5 text-xs text-slate-500">
                Review SKUs, HSN codes, UOM, unit prices, and reorder stock thresholds.
              </p>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search item code, name, category, HSN..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="erp-input pl-9 text-xs"
              />
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {loading && items.length === 0 ? (
              <div className="p-12">
                <GlobalLoading label="Loading catalog items..." variant="inline" />
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="erp-empty py-12">
                {searchTerm ? "No products match your search query." : "No catalog items found. Click Add Item to create the first record."}
              </div>
            ) : (
              <div className="erp-table-wrap border-0 shadow-none">
                <table className="erp-table">
                  <thead className="erp-thead">
                    <tr>
                      <th className="erp-th">Code / SKU</th>
                      <th className="erp-th">Item Name</th>
                      <th className="erp-th">Category</th>
                      <th className="erp-th">UOM</th>
                      <th className="erp-th">HSN Code</th>
                      <th className="erp-th">Purchase Price</th>
                      <th className="erp-th">Selling Price</th>
                      <th className="erp-th text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map((item) => (
                      <tr key={item.id} className="erp-tr hover:bg-slate-50/80 transition-colors">
                        <td className="erp-td font-semibold text-slate-900 font-mono text-xs">{item.itemCode}</td>
                        <td className="erp-td font-medium text-slate-900">{item.itemName}</td>
                        <td className="erp-td">
                          <Badge variant="outline" className="text-xs font-normal">
                            {item.category}
                          </Badge>
                        </td>
                        <td className="erp-td text-slate-600">{item.unitOfMeasure}</td>
                        <td className="erp-td font-mono text-xs text-slate-600">{item.hsnCode || "-"}</td>
                        <td className="erp-td font-medium text-slate-700">{formatCurrency(item.purchasePrice)}</td>
                        <td className="erp-td font-bold text-slate-900">{formatCurrency(item.sellingPrice)}</td>
                        <td className="erp-td text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-600 hover:text-slate-900" onClick={() => openViewDrawer(item)} title="View Item Details">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-blue-600 hover:text-blue-800" onClick={() => openEditDrawer(item)} title="Edit Item">
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-rose-600 hover:text-rose-800" onClick={() => void handleDelete(item.id, item.itemName)} title="Delete Item">
                              <Trash2 className="h-4 w-4" />
                            </Button>
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
      </div>

      {/* Slide-Over Drawer for Create / Edit Item Form */}
      <SideDrawer
        open={isFormDrawerOpen}
        onClose={() => setIsFormDrawerOpen(false)}
        title={editingId ? `Edit SKU: ${formData.itemCode}` : "Create New Item"}
        subtitle="Configure item master attributes, unit prices, HSN tax codes, and reorder levels."
        width="lg"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button variant="outline" onClick={() => setIsFormDrawerOpen(false)}>Cancel</Button>
            <Button onClick={() => void handleSave()} disabled={loading}>
              {editingId ? "Update Item" : "Save Item"}
            </Button>
          </div>
        }
      >
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-1 gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="erp-label">Item / SKU Code <span className="text-rose-500">*</span></label>
                <input name="itemCode" value={formData.itemCode} onChange={handleChange} placeholder="e.g. ITM-5001" className="erp-input font-mono text-xs" />
              </div>
              <div>
                <label className="erp-label">Category</label>
                <input name="category" value={formData.category} onChange={handleChange} placeholder="e.g. Electronics, Raw Material" className="erp-input" />
              </div>
            </div>

            <div>
              <label className="erp-label">Item Description / Name <span className="text-rose-500">*</span></label>
              <input name="itemName" value={formData.itemName} onChange={handleChange} placeholder="Full item catalog title" className="erp-input" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="erp-label">Unit of Measure (UOM)</label>
                <select name="unitOfMeasure" value={formData.unitOfMeasure} onChange={handleChange} className="erp-select">
                  <option value="Nos">Nos (Pieces)</option>
                  <option value="Kg">Kg (Kilograms)</option>
                  <option value="Mtr">Mtr (Meters)</option>
                  <option value="Box">Box (Boxes)</option>
                  <option value="Ltr">Ltr (Liters)</option>
                  <option value="Set">Set</option>
                </select>
              </div>
              <div>
                <label className="erp-label">HSN / SAC Code</label>
                <input name="hsnCode" value={formData.hsnCode} onChange={handleChange} placeholder="e.g. 84713010" className="erp-input font-mono text-xs" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="erp-label">Purchase Price (₹)</label>
                <input name="purchasePrice" value={formData.purchasePrice} onChange={handleChange} type="number" min={0} placeholder="0" className="erp-input" />
              </div>
              <div>
                <label className="erp-label">Selling Price (₹)</label>
                <input name="sellingPrice" value={formData.sellingPrice} onChange={handleChange} type="number" min={0} placeholder="0" className="erp-input" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="erp-label">Min Stock</label>
                <input name="minStockLevel" value={formData.minStockLevel} onChange={handleChange} type="number" min={0} placeholder="0" className="erp-input" />
              </div>
              <div>
                <label className="erp-label">Reorder Level</label>
                <input name="reorderLevel" value={formData.reorderLevel} onChange={handleChange} type="number" min={0} placeholder="0" className="erp-input" />
              </div>
              <div>
                <label className="erp-label">Max Stock</label>
                <input name="maxStockLevel" value={formData.maxStockLevel} onChange={handleChange} type="number" min={0} placeholder="0" className="erp-input" />
              </div>
            </div>
          </div>
        </div>
      </SideDrawer>

      {/* Slide-Over Drawer for Quick View Item Details */}
      <SideDrawer
        open={isViewDrawerOpen}
        onClose={() => setIsViewDrawerOpen(false)}
        title={selectedItem ? selectedItem.itemName : "Item Details"}
        subtitle={selectedItem ? `SKU: ${selectedItem.itemCode}` : ""}
        width="md"
        footer={
          <div className="flex justify-between w-full">
            <Button variant="outline" onClick={() => setIsViewDrawerOpen(false)}>Close</Button>
            {selectedItem && (
              <Button onClick={() => { setIsViewDrawerOpen(false); openEditDrawer(selectedItem); }}>
                Edit Item Record
              </Button>
            )}
          </div>
        }
      >
        {selectedItem && (
          <div className="space-y-5 py-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">SKU Catalog Profile</span>
                <Badge variant="outline">{selectedItem.category}</Badge>
              </div>
              <h3 className="text-lg font-bold text-slate-900">{selectedItem.itemName}</h3>
              <p className="text-xs text-slate-500 font-mono">Item Code: {selectedItem.itemCode}</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 bg-white">
                <Tag className="h-5 w-5 text-indigo-600 shrink-0" />
                <div>
                  <p className="text-xs text-slate-500">Unit of Measure & HSN</p>
                  <p className="text-sm font-semibold text-slate-900">{selectedItem.unitOfMeasure} (HSN: {selectedItem.hsnCode || "None"})</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 bg-white">
                <DollarSign className="h-5 w-5 text-emerald-600 shrink-0" />
                <div>
                  <p className="text-xs text-slate-500">Pricing Breakdown</p>
                  <p className="text-sm font-bold text-slate-900">
                    Selling: {formatCurrency(selectedItem.sellingPrice)} | Purchase: {formatCurrency(selectedItem.purchasePrice)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 bg-white">
                <Layers className="h-5 w-5 text-sky-600 shrink-0" />
                <div>
                  <p className="text-xs text-slate-500">Reorder Thresholds</p>
                  <p className="text-sm font-semibold text-slate-900">
                    Min: {selectedItem.minStockLevel || 0} | Reorder: {selectedItem.reorderLevel || 0} | Max: {selectedItem.maxStockLevel || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </SideDrawer>
    </StandardPageLayout>
  );
}
