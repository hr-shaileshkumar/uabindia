"use client";

import { DynamicPage } from "@/components/dynamic/DynamicPage";

export default function EmployeeNewPage() {
  return <DynamicPage pageKey="hrms.employees" initialDrawerMode="create" />;
}