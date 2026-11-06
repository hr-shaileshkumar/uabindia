import { PageSchema } from "../types";

export const inventorySchemas: Record<string, PageSchema> = {
  "inventory.items": {
    pageKey: "inventory.items",
    title: "Inventory Master (SKUs)",
    subTitle: "Product catalog, SKU codes, valuation pricing, HSN codes, and reorder levels.",
    entityName: "Item",
    moduleKey: "inventory",
    viewType: "table",
    apiEndpoint: "/inventory/items",
    icon: "Package",
    requiredPermission: "inventory.items.read",
    columns: [
      { key: "sku", label: "SKU / Item Code", width: 140 },
      { key: "name", label: "Item Name", width: 240 },
      { key: "category", label: "Category", width: 140 },
      { key: "hsnCode", label: "HSN Code", width: 120 },
      { key: "unitOfMeasure", label: "UOM", width: 90 },
      { key: "sellingPrice", label: "Selling Price", type: "currency", width: 130 },
      { key: "stockQuantity", label: "Current Stock", type: "number", width: 120 },
      { key: "status", label: "Status", type: "badge", width: 100 },
    ],
    filters: [
      { key: "search", label: "Search SKU or name", type: "text" },
      {
        key: "category",
        label: "Category",
        type: "select",
        options: [
          { value: "RawMaterial", label: "Raw Materials" },
          { value: "FinishedGoods", label: "Finished Goods" },
          { value: "Consumable", label: "Consumables" },
          { value: "Services", label: "Services" },
        ],
      },
    ],
    form: {
      sections: [
        {
          key: "item",
          label: "Item Specifications",
          fields: [
            { key: "sku", label: "SKU / Item Code", type: "text", readOnly: true, required: false, placeholder: "⚡ Auto-generated on save", span: 1 },
            { key: "name", label: "Item Name", type: "text", required: true, span: 1 },
            {
              key: "category",
              label: "Category",
              type: "select",
              required: true,
              options: [
                { value: "RawMaterial", label: "Raw Materials" },
                { value: "FinishedGoods", label: "Finished Goods" },
                { value: "Consumable", label: "Consumables" },
                { value: "Services", label: "Services" },
              ],
              span: 1,
            },
            { key: "hsnCode", label: "HSN / SAC Code", type: "text", span: 1 },
            { key: "unitOfMeasure", label: "Unit of Measure (UOM)", type: "text", defaultValue: "Nos", span: 1 },
            { key: "costPrice", label: "Standard Cost", type: "currency", span: 1 },
            { key: "sellingPrice", label: "Selling Price", type: "currency", required: true, span: 1 },
            { key: "reorderLevel", label: "Reorder Threshold", type: "number", span: 1 },
            { key: "description", label: "Item Description", type: "textarea", span: 2 },
          ],
        },
      ],
    },
    actions: [
      { key: "create", label: "New Item", variant: "primary", icon: "Plus" },
      { key: "edit", label: "Edit", variant: "secondary", icon: "Pencil" },
      { key: "export", label: "Export Catalog", variant: "ghost", icon: "Download" },
    ],
    kpis: [
      { key: "totalSkus", label: "Total SKUs", icon: "Package", color: "indigo" },
      { key: "totalInventoryValue", label: "Total Stock Value", icon: "IndianRupee", color: "green" },
      { key: "lowStockAlerts", label: "Low Stock Items", icon: "AlertTriangle", color: "red" },
    ],
  },

  "inventory.stock-movements": {
    pageKey: "inventory.stock-movements",
    title: "Stock Movements & Ledger",
    subTitle: "Inward receipts, outward dispatches, transfers, and real-time stock balances.",
    entityName: "StockMovement",
    moduleKey: "inventory",
    viewType: "table",
    apiEndpoint: "/inventory/stock-movements",
    icon: "Boxes",
    requiredPermission: "inventory.movements.read",
    columns: [
      { key: "transactionDate", label: "Date", type: "datetime", width: 160 },
      { key: "itemSku", label: "SKU", width: 120 },
      { key: "itemName", label: "Item", width: 220 },
      { key: "movementType", label: "Type", type: "badge", width: 120 },
      { key: "quantity", label: "Quantity", type: "number", width: 110 },
      { key: "warehouseName", label: "Warehouse", width: 180 },
      { key: "referenceNumber", label: "Reference #", width: 140 },
    ],
    filters: [
      { key: "search", label: "Search SKU or reference", type: "text" },
      {
        key: "movementType",
        label: "Movement Type",
        type: "select",
        options: [
          { value: "Inward", label: "Inward (Receipt)" },
          { value: "Outward", label: "Outward (Dispatch)" },
          { value: "Transfer", label: "Transfer" },
          { value: "Adjustment", label: "Adjustment" },
        ],
      },
    ],
    actions: [
      { key: "export", label: "Export Stock Ledger", variant: "secondary", icon: "Download" },
    ],
  },
};
