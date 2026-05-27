"use client";

type PublicPageIntroProps = {
  eyebrow: string;
  title: string;
  subtitle: string;
  align?: "left" | "center";
};

export default function PublicPageIntro({
  eyebrow,
  title,
  subtitle,
  align = "left",
}: PublicPageIntroProps) {
  const alignment = align === "center" ? "text-center items-center" : "text-left items-start";

  return (
    <div className={`flex flex-col gap-4 ${alignment}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{eyebrow}</p>
      <h1 className="max-w-4xl text-4xl font-semibold leading-tight text-slate-900 md:text-[2.85rem]">
        {title}
      </h1>
      <p className="max-w-3xl text-base leading-7 text-slate-700 md:text-[1.02rem]">{subtitle}</p>
    </div>
  );
}
