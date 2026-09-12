export type WarehouseRow = {
  id: string;
  warehouseCode: string;
  warehouseName: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  contactPerson?: string;
  phoneNumber?: string;
  email?: string;
  isDefault: boolean;
  isActive: boolean;
};

export type WarehouseFormData = {
  warehouseCode: string;
  warehouseName: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  contactPerson: string;
  phoneNumber: string;
  email: string;
  isDefault: boolean;
  isActive: boolean;
};

export const emptyWarehouseForm = (): WarehouseFormData => ({
  warehouseCode: "",
  warehouseName: "",
  address: "",
  city: "",
  state: "",
  country: "India",
  postalCode: "",
  contactPerson: "",
  phoneNumber: "",
  email: "",
  isDefault: false,
  isActive: true,
});
