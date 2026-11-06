"use client";

import {
  Wrench,
  Truck,
  MapPin,
  ClipboardCheck,
  CalendarDays,
  UserCheck,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { UabModuleDashboard } from "@/components/dynamic/UabModuleDashboard";

const LINKS = [
  { href: "/fleet", label: "Fleet & Vehicle Dispatch", icon: Truck, desc: "Vehicle telemetry, driver assignments & trip logs" },
  { href: "/projects/tasks", label: "Field Tasks & Work Orders", icon: ClipboardCheck, desc: "On-site job execution & milestone checklists" },
  { href: "/helpdesk/tickets", label: "Customer Service Tickets", icon: Wrench, desc: "Service requests, onsite repairs & warranty claims" },
  { href: "/hrms/attendance", label: "Field Crew Attendance", icon: UserCheck, desc: "Geo-fenced attendance & field check-ins" },
];

export default function FieldServicePage() {
  return (
    <UabModuleDashboard
      moduleKey="field-service"
      title="Field Service & Telemetry"
      subtitle="Manage field technicians, on-site service orders, equipment dispatch, and mobile workforce telemetry."
      eyebrow="Field Operations"
      icon={Wrench}
      color="from-amber-600 via-orange-600 to-red-600"
      kpis={[
        { label: "Active Field Crews", value: "14 Crews", icon: UserCheck, tone: "positive" },
        { label: "Open Work Orders", value: "38 Orders", icon: ClipboardCheck, tone: "info" },
        { label: "Vehicles En Route", value: "9 Units", icon: Truck, tone: "positive" },
        { label: "Avg Resolution Time", value: "2.4 hrs", icon: Clock, tone: "neutral" },
      ]}
      links={LINKS}
      linksTitle="Field Service Portals"
    />
  );
}

