"use client";

import { useState } from "react";
import { Plane, Plus, Calendar, MapPin, Check, X, FileText } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { FilterBar } from "@/components/ui/filter-bar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { TourRequest } from "@/types";

const INITIAL_TOURS: TourRequest[] = [
  { id: "1", employeeName: "Rahul Verma", destination: "Mumbai, India", purpose: "Client Onboarding & Training", departureDate: "2026-08-15", returnDate: "2026-08-18", estimatedCost: 28000, status: "Submitted" },
  { id: "2", employeeName: "Ananya Roy", destination: "Bengaluru, India", purpose: "Tech Summit 2026", departureDate: "2026-07-20", returnDate: "2026-07-23", estimatedCost: 35000, status: "Approved" },
  { id: "3", employeeName: "Vikram Singh", destination: "Delhi NCR", purpose: "Vendor Audit", departureDate: "2026-06-10", returnDate: "2026-06-12", estimatedCost: 15000, status: "Completed" },
];

export function TourRequestList() {
  const [tours] = useState<TourRequest[]>(INITIAL_TOURS);
  const [search, setSearch] = useState("");

  const filtered = tours.filter((t) =>
    (t.employeeName || "").toLowerCase().includes(search.toLowerCase()) ||
    t.destination.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Business Travel & Tour Management"
        subtitle="Manage employee business trips, travel approvals, advance requests & itinerary tracking"
        breadcrumbs={[
          { label: "Tours", href: "/tours" },
          { label: "All Travel Requests" },
        ]}
        actions={
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            New Travel Request
          </Button>
        }
      />

      <FilterBar searchPlaceholder="Search destination or employee..." searchValue={search} onSearchChange={setSearch} />

      <div className="space-y-3">
        {filtered.map((tour) => (
          <Card key={tour.id} className="hover:border-indigo-500/50 transition-colors">
            <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-foreground text-sm flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-indigo-500" />
                    {tour.destination}
                  </span>
                  <Badge variant={tour.status === "Approved" ? "success" : tour.status === "Submitted" ? "warning" : "secondary"}>
                    {tour.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Employee: <span className="font-medium text-foreground">{tour.employeeName}</span> • Purpose: "{tour.purpose}"
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-indigo-500" />
                  {tour.departureDate} to {tour.returnDate}
                </p>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Estimated Budget</p>
                  <p className="font-bold text-indigo-600 dark:text-indigo-400 text-base">₹{(tour.estimatedCost || 0).toLocaleString("en-IN")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
