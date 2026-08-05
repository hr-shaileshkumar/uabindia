"use client";

import { useState } from "react";
import { Activity, Plus, Stethoscope, Users, Calendar, MapPin, HeartPulse } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { FilterBar } from "@/components/ui/filter-bar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface MobileMedicalUnit {
  id: string;
  unitCode: string;
  locationDistrict: string;
  doctorInCharge: string;
  patientsTreatedToday: number;
  totalCampPatients: number;
  campDate: string;
  status: "Active Camp" | "In Transit" | "Completed";
}

const INITIAL_MVUS: MobileMedicalUnit[] = [
  { id: "1", unitCode: "MVU-NORTH-01", locationDistrict: "Nashik Rural Camp", doctorInCharge: "Dr. Anjali Deshmukh", patientsTreatedToday: 84, totalCampPatients: 420, campDate: "2026-08-03", status: "Active Camp" },
  { id: "2", unitCode: "MVU-WEST-04", locationDistrict: "Pune District Camp 12", doctorInCharge: "Dr. Rajesh Kulkarni", patientsTreatedToday: 112, totalCampPatients: 650, campDate: "2026-08-03", status: "Active Camp" },
  { id: "3", unitCode: "MVU-SOUTH-02", locationDistrict: "Satara Camp 05", doctorInCharge: "Dr. Sunita Patil", patientsTreatedToday: 0, totalCampPatients: 380, campDate: "2026-08-02", status: "Completed" },
];

export function MVUOperationsList() {
  const [units] = useState<MobileMedicalUnit[]>(INITIAL_MVUS);
  const [search, setSearch] = useState("");

  const filtered = units.filter((u) =>
    u.unitCode.toLowerCase().includes(search.toLowerCase()) ||
    u.locationDistrict.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mobile Health Unit (MVU) Operations"
        subtitle="Manage mobile healthcare clinics, doctor rosters, patient checkups, and field medical camps"
        breadcrumbs={[
          { label: "Healthcare", href: "/healthcare" },
          { label: "MVU Camps" },
        ]}
        actions={
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Deploy Medical Camp
          </Button>
        }
      />

      <FilterBar searchPlaceholder="Search unit code or camp location..." searchValue={search} onSearchChange={setSearch} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((mvu) => (
          <Card key={mvu.id} className="hover:border-indigo-500/50 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-base font-semibold font-mono">{mvu.unitCode}</CardTitle>
                  <CardDescription className="text-xs flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-indigo-500" /> {mvu.locationDistrict}
                  </CardDescription>
                </div>
                <Badge variant={mvu.status === "Active Camp" ? "success" : "secondary"}>
                  {mvu.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Stethoscope className="h-3.5 w-3.5 text-indigo-500" /> Lead Physician</span>
                <span className="font-medium text-foreground">{mvu.doctorInCharge}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Patients Screened Today</span>
                <span className="font-bold text-emerald-600 text-sm">{mvu.patientsTreatedToday} Patients</span>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border">
                <span>Total Camp Registrations</span>
                <span className="font-semibold text-foreground">{mvu.totalCampPatients} Total</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
