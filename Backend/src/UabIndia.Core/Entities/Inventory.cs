using System;
using System.Collections.Generic;

namespace UabIndia.Core.Entities
{
    // Inventory Items/Products
    public class Item : BaseEntity
    {
        public Guid? CompanyId { get; set; }
        public Guid? ProjectId { get; set; }
        public string ItemCode { get; set; } = string.Empty;
        public string ItemName { get; set; } = string.Empty;
        public string ItemType { get; set; } = "Stockable"; // Stockable, Service, Consumable
        public string? Category { get; set; }
        public string? SubCategory { get; set; }
        public string? Description { get; set; }
        public string UnitOfMeasure { get; set; } = "Pcs"; // Pcs, Kg, Ltr, Box, etc.
        public string? HSNCode { get; set; }
        public decimal PurchasePrice { get; set; }
        public decimal SellingPrice { get; set; }
        public decimal MRP { get; set; }
        public decimal MinStockLevel { get; set; }
        public decimal MaxStockLevel { get; set; }
        public decimal ReorderLevel { get; set; }
        public decimal ReorderQuantity { get; set; }
        public decimal CurrentStock { get; set; }
        public string? ImageUrl { get; set; }
        public string? Barcode { get; set; }
        public bool IsTaxable { get; set; } = true;
        public decimal TaxRate { get; set; } = 18; // GST %
        public bool IsActive { get; set; } = true;
        public Guid? DefaultVendorId { get; set; }
        public Vendor? DefaultVendor { get; set; }
    }

    // Warehouses
    public class Warehouse : BaseEntity
    {
        public Guid? CompanyId { get; set; }
        public Guid? ProjectId { get; set; }
        public string WarehouseCode { get; set; } = string.Empty;
        public string WarehouseName { get; set; } = string.Empty;
        public string? Address { get; set; }
        public string? City { get; set; }
        public string? State { get; set; }
        public string? Country { get; set; } = "India";
        public string? PostalCode { get; set; }
        public string? ContactPerson { get; set; }
        public string? PhoneNumber { get; set; }
        public string? Email { get; set; }
        public bool IsDefault { get; set; }
        public bool IsActive { get; set; } = true;
    }

    // Stock Movement/Transactions
    public class StockMovement : BaseEntity
    {
        public Guid? CompanyId { get; set; }
        public Guid? ProjectId { get; set; }
        public string MovementNumber { get; set; } = string.Empty;
        public DateTime MovementDate { get; set; }
        public string MovementType { get; set; } = string.Empty; // In, Out, Transfer, Adjustment
        public Guid ItemId { get; set; }
        public Item Item { get; set; } = null!;
        public Guid? WarehouseId { get; set; }
        public Warehouse? Warehouse { get; set; }
        public decimal Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal TotalValue { get; set; }
        public string? ReferenceType { get; set; } // PurchaseOrder, SalesOrder, Transfer, Adjustment
        public Guid? ReferenceId { get; set; }
        public string? ReferenceNumber { get; set; }
        public string? Remarks { get; set; }
        public Guid? FromWarehouseId { get; set; }
        public Guid? ToWarehouseId { get; set; }
    }

    // Stock Balance (Current stock per item per warehouse)
    public class StockBalance : BaseEntity
    {
        public Guid? CompanyId { get; set; }
        public Guid ItemId { get; set; }
        public Item Item { get; set; } = null!;
        public Guid WarehouseId { get; set; }
        public Warehouse Warehouse { get; set; } = null!;
        public decimal QuantityOnHand { get; set; }
        public decimal QuantityReserved { get; set; }
        public decimal QuantityAvailable { get; set; }
        public decimal AverageUnitCost { get; set; }
        public decimal TotalValue { get; set; }
        public DateTime LastUpdated { get; set; }
    }
}
