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
    <div className={`flex max-w-3xl flex-col gap-4 ${alignment}`}>
      <p className={publicEyebrowClassName}>{eyebrow}</p>
      <h2 className="text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-4xl md:text-[2.85rem]">
        {title}
      </h2>
      <p className="text-base leading-7 text-slate-600 sm:text-[1.02rem]">{subtitle}</p>
    </div>
  );
}
