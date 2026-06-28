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
    <section className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_28px_70px_rgba(15,23,42,0.08)] sm:p-8">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--erp-primary)]">
          Request details
        </p>
        <h3 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-slate-950">{title}</h3>
        <p className="mt-2 text-sm leading-7 text-slate-600">{description}</p>
      </div>
      {children}
    </section>
  );
}
