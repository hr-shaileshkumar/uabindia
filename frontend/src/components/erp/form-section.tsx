export function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-[var(--erp-radius-panel)] border border-[var(--erp-border)] bg-white p-4 shadow-[var(--erp-shadow-sm)] sm:p-5">
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--erp-primary)]">
          Request details
        </p>
        <h3 className="mt-1.5 text-lg font-semibold tracking-[-0.02em] text-slate-950">{title}</h3>
        <p className="mt-1 text-sm leading-5 text-slate-600">{description}</p>
      </div>
      {children}
    </section>
  );
}
