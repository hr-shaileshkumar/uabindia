"use client";

import { useState } from "react";
import { Truck, Plus, Gauge, Wrench, ShieldCheck, MapPin } from "lucide-react";
import { PageHeader } from "@/design-system";
import { FilterBar } from "@/components/ui/filter-bar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Vehicle } from "@/types";

const INITIAL_VEHICLES: Vehicle[] = [
  { id: "1", registrationNumber: "MH-12-AB-1234", model: "Tata Prima 2830.K Heavy Truck", vehicleType: "Truck", driverName: "Ramesh Pawar", status: "Available", lastMaintenanceDate: "2026-07-15" },
  { id: "2", registrationNumber: "KA-01-CD-5678", model: "Mahindra Bolero Maxi Truck", vehicleType: "Pickup", driverName: "Suresh Kumar", status: "Maintenance", lastMaintenanceDate: "2026-07-28" },
  { id: "3", registrationNumber: "DL-03-EF-9012", model: "Force Traveler Medical Van", vehicleType: "Ambulance", driverName: "Amit Singh", status: "InUse", lastMaintenanceDate: "2026-06-30" },
];

export function VehicleList() {
  const [vehicles] = useState<Vehicle[]>(INITIAL_VEHICLES);
  const [search, setSearch] = useState("");

  const filtered = vehicles.filter((v) =>
    v.registrationNumber.toLowerCase().includes(search.toLowerCase()) ||
    (v.model || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fleet & Vehicle Logistics"
        subtitle="Manage corporate vehicles, driver assignments, fuel logs, maintenance schedules, and tracking."
        eyebrow="Operations / Fleet"
        icon="truck"
        stats={[
          { label: "Vehicles", value: vehicles.length },
          { label: "Available", value: vehicles.filter((v) => v.status === "Available").length, tone: "success" },
          { label: "In Maintenance", value: vehicles.filter((v) => v.status === "Maintenance").length, tone: "warning" },
        ]}
        actions={
          <Button size="sm" className="h-9 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs shadow-sm gap-1.5">
            <Plus className="h-4 w-4" />
            Add Vehicle
          </Button>
        }
      />

      <FilterBar searchPlaceholder="Search registration number or model..." searchValue={search} onSearchChange={setSearch} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((veh) => (
          <Card key={veh.id} className="hover:border-indigo-500/50 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-base font-semibold font-mono">{veh.registrationNumber}</CardTitle>
                  <CardDescription className="text-xs">{veh.model}</CardDescription>
                </div>
                <Badge variant={veh.status === "Available" ? "success" : veh.status === "InUse" ? "info" : "warning"}>
                  {veh.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Assigned Driver</span>
                <span className="font-medium text-foreground">{veh.driverName || "Unassigned"}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Vehicle Type</span>
                <Badge variant="outline">{veh.vehicleType}</Badge>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border">
                <span className="flex items-center gap-1"><Wrench className="h-3.5 w-3.5 text-indigo-500" /> Last Maintenance</span>
                <span className="font-medium text-foreground">{veh.lastMaintenanceDate || "N/A"}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
