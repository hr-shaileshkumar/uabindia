"use client";

import Link from "next/link";
import StandardPageLayout from "@/components/layout/StandardPageLayout";
import { CrudHeaderStats } from "@/components/erp/crud-workspace";
import {
  erpActionCardClassName,
  erpActionCardIconClassName,
  erpActionCardSubtitleClassName,
  erpActionCardTitleClassName,
} from "@/components/erp/erpStyles";
import { ROUTES } from "@/constants/routes";
import ModuleIcon from "@/components/ModuleIcon";

const cards = [
  {
    href: ROUTES.PLATFORM_PROJECTS,
    title: "Project masters",
    subtitle: "Create and govern company projects.",
    icon: "folder",
  },
  {
    href: ROUTES.PROJECT_TASKS,
    title: "Tasks",
    subtitle: "Assign delivery work and track status.",
    icon: "grid",
  },
  {
    href: ROUTES.PROJECT_TIMESHEETS,
    title: "Timesheets",
    subtitle: "Capture billable and non-billable hours.",
    icon: "clock",
  },
];

export default function ProjectsHubPage() {
  return (
    <StandardPageLayout
      title="Projects"
      icon="folder"
      meta={
        <CrudHeaderStats
          items={[
            { label: "Workspaces", value: 3, tone: "info" },
            { label: "Status", value: "Live", tone: "positive" },
          ]}
        />
      }
    >
      <div className="grid gap-4 md:grid-cols-3">
        {cards.map((card) => (
          <Link key={card.href} href={card.href} className={erpActionCardClassName}>
            <span className={erpActionCardIconClassName}>
              <ModuleIcon name={card.icon} className="h-4 w-4" />
            </span>
            <h3 className={`${erpActionCardTitleClassName} mt-3`}>{card.title}</h3>
            <p className={`${erpActionCardSubtitleClassName} mt-1`}>{card.subtitle}</p>
          </Link>
        ))}
      </div>
    </StandardPageLayout>
  );
}
