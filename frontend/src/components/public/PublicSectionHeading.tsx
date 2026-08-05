"use client";

import { publicEyebrowClassName } from "@/components/public/publicStyles";

type PublicSectionHeadingProps = {
  eyebrow: string;
  title: string;
  subtitle: string;
  align?: "left" | "center";
  singleLine?: boolean;
};

export default function PublicSectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "left",
  singleLine = false,
}: PublicSectionHeadingProps) {
  const isCentered = align === "center" || singleLine;
  const alignment = isCentered ? "items-center text-center mx-auto" : "items-start text-left";

  return (
    <div className={`flex w-full ${singleLine ? "max-w-none px-4" : "max-w-4xl"} flex-col gap-3.5 ${alignment}`}>
      <p className={publicEyebrowClassName}>{eyebrow}</p>
      <h1
        className={`w-full text-slate-950 font-extrabold leading-none ${
          singleLine
            ? "whitespace-nowrap max-w-none text-[clamp(1.1rem,3.15vw,3.6rem)] tracking-tight text-center overflow-hidden text-ellipsis"
            : "text-balance text-3xl sm:text-4xl md:text-[2.75rem] tracking-tight"
        }`}
      >
        {title}
      </h1>
      <p className="text-pretty text-base sm:text-lg leading-relaxed text-slate-600 max-w-3xl">{subtitle}</p>
    </div>
  );
}
