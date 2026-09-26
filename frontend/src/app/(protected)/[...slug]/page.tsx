"use client";

import React, { use } from "react";
import { DynamicPage } from "@/components/dynamic/DynamicPage";

interface DynamicRouteProps {
  params: Promise<{
    slug: string[];
  }>;
}

export default function DynamicERPPage({ params }: DynamicRouteProps) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug || [];

  // Map URL slug array to canonical pageKey:
  // e.g. ["hrms", "employees"] -> "hrms.employees"
  // e.g. ["metadata", "employee-master"] -> "hrms.employees"
  // e.g. ["employee-master"] -> "hrms.employees"
  let pageKey = slug.join(".");
  if (slug.length === 1) {
    if (slug[0] === "employee-master" || slug[0] === "employees") pageKey = "hrms.employees";
    else if (slug[0] === "projects") pageKey = "projects.list";
    else if (slug[0] === "assets") pageKey = "assets.list";
    else if (slug[0] === "approvals") pageKey = "workflow.approvals";
    else if (slug[0] === "expenses") pageKey = "finance.expenses";
  } else if (slug.length === 2 && slug[0] === "metadata") {
    pageKey = slug[1];
    if (pageKey === "employee-master" || pageKey === "employee" || pageKey === "employees") {
      pageKey = "hrms.employees";
    }
  }

  return <DynamicPage pageKey={pageKey} />;
}
