"use client";

type PublicStatItem = {
  label: string;
  value: string;
  detail?: string;
};

type PublicStatGridProps = {
  items: PublicStatItem[];
  variant?: "light" | "dark";
};

export default function PublicStatGrid({ items, variant = "light" }: PublicStatGridProps) {
  const cardClassName =
    variant === "dark"
      ? "border-white/15 bg-white/8 text-white"
      : "border-sky-100/80 bg-white text-slate-950 shadow-[0_12px_32px_rgba(148,163,184,0.1)]";

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <article key={`${item.label}-${item.value}`} className={`rounded-[1.5rem] border p-5 ${cardClassName}`}>
          <p className={`text-[0.68rem] font-semibold uppercase tracking-[0.22em] ${variant === "dark" ? "text-slate-300" : "text-slate-500"}`}>
            {item.label}
          </p>
          <p className="mt-3 text-3xl font-semibold tracking-[-0.04em]">{item.value}</p>
          {item.detail ? <p className={`mt-2 text-sm leading-6 ${variant === "dark" ? "text-slate-200" : "text-slate-600"}`}>{item.detail}</p> : null}
        </article>
      ))}
    </div>
  );
}
