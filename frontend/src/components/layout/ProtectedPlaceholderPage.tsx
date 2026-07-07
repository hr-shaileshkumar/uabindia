"use client";

import StandardPageLayout from "@/components/layout/StandardPageLayout";

type ProtectedPlaceholderPageProps = {
  title: string;
  subtitle: string;
  message: string;
};

export default function ProtectedPlaceholderPage({
  title,
  subtitle,
  message,
}: ProtectedPlaceholderPageProps) {
  return (
    <StandardPageLayout title={title} subtitle={subtitle}>
      <section className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center shadow-[var(--erp-shadow-sm)]">
        <p className="text-sm font-medium text-slate-500">{message}</p>
      </section>
    </StandardPageLayout>
  );
}
