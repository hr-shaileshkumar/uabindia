"use client";

import { publicEyebrowClassName } from "@/components/public/publicStyles";

type PublicSectionHeadingProps = {
  eyebrow: string;
  title: string;
  subtitle: string;
  align?: "left" | "center";
};

export default function PublicSectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "left",
}: PublicSectionHeadingProps) {
  const alignment = align === "center" ? "items-center text-center" : "items-start text-left";

  return (
    <div className={`flex max-w-2xl flex-col gap-3 ${alignment}`}>
      <p className={publicEyebrowClassName}>{eyebrow}</p>
      <h2 className="text-balance text-3xl leading-[1.02] font-semibold tracking-[-0.06em] text-slate-950 sm:text-4xl md:text-[2.75rem]">
        {title}
      </h2>
      <p className="text-pretty text-base leading-8 text-slate-600">{subtitle}</p>
    </div>
  );
}
