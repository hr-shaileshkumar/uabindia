"use client";

import { publicEyebrowClassName, publicPanelClassName } from "@/components/public/publicStyles";

type PublicInfoPanelProps = {
  eyebrow: string;
  title: string;
  summary: string;
  points?: string[];
  stats?: Array<{ label: string; value: string }>;
};

export default function PublicInfoPanel({ eyebrow, title, summary, points = [], stats }: PublicInfoPanelProps) {
  return (
    <div className={publicPanelClassName}>
      <p className={publicEyebrowClassName}>{eyebrow}</p>
      <h2 className="mt-3 text-xl font-semibold tracking-tight text-slate-900">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">{summary}</p>

      {stats && stats.length > 0 ? (
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {stats.map((item) => (
            <div key={item.label} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
              <p className="text-lg font-semibold text-slate-900">{item.value}</p>
              <p className="text-xs text-slate-500">{item.label}</p>
            </div>
          ))}
        </div>
      ) : null}

      {points.length > 0 ? (
        <ul className="mt-5 space-y-2">
          {points.map((point) => (
            <li key={point} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700">
              {point}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
