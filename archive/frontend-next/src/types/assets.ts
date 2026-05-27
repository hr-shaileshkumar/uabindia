// Asset Management Types

export interface AssetMaster {
  id: string;
  assetCode: string;
  assetName: string;
  assetCategory: 'Laptop' | 'Desktop' | 'Mobile' | 'Furniture' | 'Equipment' | 'Vehicle' | 'Other';
  assetType: string;
  description?: string;
  purchaseDate: Date;
  purchaseValue: number;
  depreciation: number;
  currentValue: number;
  warrantyExpiry?: Date;
  status: 'Active' | 'Inactive' | 'Disposed' | 'Under Maintenance';
  createdDate: Date;
}

export interface AssetAllocation {
  id: string;
  assetId: string;
  employeeId: string;
  allocationDate: Date;
  expectedReturnDate?: Date;
  actualReturnDate?: Date;
  condition: 'New' | 'Good' | 'Fair' | 'Poor';
  allocationReason: string;
  status: 'Active' | 'Returned' | 'Lost' | 'Damaged';
  notes?: string;
}

export interface AssetMaintenance {
  id: string;
  assetId: string;
  maintenanceDate: Date;
  maintenanceType: 'Preventive' | 'Corrective' | 'Emergency';
  description: string;
  vendor?: string;
  cost?: number;
  completionDate?: Date;
  status: 'Scheduled' | 'InProgress' | 'Completed' | 'Pending';
}

export interface AssetDepreciation {
  id: string;
  assetId: string;
  depreciationMonth: Date;
  depreciationAmount: number;
  cumulativeDepreciation: number;
  bookValue: number;
}

export interface AssetHandover {
  id: string;
  assetAllocationId: string;
  handoverDate: Date;
  handoverFrom: string;
  handoverTo: string;
  condition: 'Good' | 'Fair' | 'Poor' | 'Damaged';
  handoverNotes?: string;
  status: 'Completed' | 'Pending';
}

export interface AssetAudit {
  id: string;
  assetId: string;
  auditDate: Date;
  auditedBy: string;
  locationVerified: boolean;
  conditionMatched: boolean;
  findings?: string;
  status: 'OK' | 'Discrepancy' | 'Missing';
}

export interface CreateAssetRequest {
  assetCode: string;
  assetName: string;
  assetCategory: 'Laptop' | 'Desktop' | 'Mobile' | 'Furniture' | 'Equipment' | 'Vehicle' | 'Other';
  assetType: string;
  purchaseDate: Date;
  purchaseValue: number;
  depreciation: number;
  warrantyExpiry?: Date;
}

export interface CreateAllocationRequest {
  assetId: string;
  employeeId: string;
  allocationReason: string;
  expectedReturnDate?: Date;
}

export interface CreateMaintenanceRequest {
  assetId: string;
  maintenanceType: 'Preventive' | 'Corrective' | 'Emergency';
  description: string;
  vendor?: string;
  cost?: number;
}
