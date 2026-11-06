import apiClient from "@/services/apiClient";

export interface FleetVehicle {
  id: string;
  vehicleNumber: string;
  make: string;
  model: string;
  year: number;
  vin?: string;
  assetId?: string;
  status: "Active" | "InMaintenance" | "Decommissioned" | "Dispatched";
  fuelType: string;
  currentOdometer: number;
  assignedDriverId?: string;
  assignedDriverName?: string;
  insuranceExpiryDate?: string;
  nextServiceDate?: string;
  createdAt: string;
  maintenanceCount: number;
  totalFuelCost: number;
}

export interface FleetMaintenance {
  id: string;
  vehicleId: string;
  vehicleNumber: string;
  serviceDate: string;
  serviceType: string;
  odometer: number;
  cost: number;
  vendorName?: string;
  notes?: string;
  status: "Scheduled" | "InProgress" | "Completed";
  createdAt: string;
}

export interface FleetFuelLog {
  id: string;
  vehicleId: string;
  vehicleNumber: string;
  logDate: string;
  odometer: number;
  liters: number;
  totalCost: number;
  fuelStation?: string;
  receiptNumber?: string;
  createdAt: string;
}

export interface FleetKpis {
  totalVehicles: number;
  activeVehicles: number;
  inMaintenance: number;
  totalFuelCostMonth: number;
  totalMaintenanceCostMonth: number;
}

export const fleetApi = {
  getKpis: () => apiClient.get<{ success: boolean; data: FleetKpis }>("/fleet/kpis"),
  getVehicles: (status?: string) =>
    apiClient.get<{ success: boolean; data: FleetVehicle[] }>(
      `/fleet/vehicles${status ? `?status=${encodeURIComponent(status)}` : ""}`
    ),
  getVehicleById: (id: string) =>
    apiClient.get<{ success: boolean; data: FleetVehicle }>(`/fleet/vehicles/${id}`),
  createVehicle: (data: Partial<FleetVehicle>) =>
    apiClient.post<{ success: boolean; data: FleetVehicle }>("/fleet/vehicles", data),
  updateVehicle: (id: string, data: Partial<FleetVehicle>) =>
    apiClient.put<{ success: boolean; data: FleetVehicle }>(`/fleet/vehicles/${id}`, data),
  deleteVehicle: (id: string) => apiClient.delete(`/fleet/vehicles/${id}`),

  getMaintenances: (vehicleId?: string) =>
    apiClient.get<{ success: boolean; data: FleetMaintenance[] }>(
      `/fleet/maintenance${vehicleId ? `?vehicleId=${vehicleId}` : ""}`
    ),
  createMaintenance: (data: Partial<FleetMaintenance>) =>
    apiClient.post<{ success: boolean; data: FleetMaintenance }>("/fleet/maintenance", data),

  getFuelLogs: (vehicleId?: string) =>
    apiClient.get<{ success: boolean; data: FleetFuelLog[] }>(
      `/fleet/fuel-logs${vehicleId ? `?vehicleId=${vehicleId}` : ""}`
    ),
  createFuelLog: (data: Partial<FleetFuelLog>) =>
    apiClient.post<{ success: boolean; data: FleetFuelLog }>("/fleet/fuel-logs", data),
};
