import { erpSectionEyebrowClassName } from "@/components/erp/erpStyles";

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
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4">
        <p className={erpSectionEyebrowClassName}>Request details</p>
        <h3 className="mt-1.5 text-lg font-semibold tracking-tight text-slate-900">{title}</h3>
        <p className="mt-1 text-sm leading-5 text-slate-600">{description}</p>
      </div>
      {children}
    </section>
  );
}
