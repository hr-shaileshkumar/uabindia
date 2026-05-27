import type { ReactNode } from "react";

type Props = {
  label: string;
  required?: boolean;
  children: ReactNode;
  hint?: string;
};

export default function AdminFormField({ label, required = false, children, hint }: Props) {
  return (
    <div>
      <label className="erp-label">
        {label}
        {required ? " *" : ""}
      </label>
      {children}
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}
