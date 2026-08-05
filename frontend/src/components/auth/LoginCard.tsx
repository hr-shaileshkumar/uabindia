"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type LoginCardProps = {
  title: string;
  subtitle?: string;
  align?: "center" | "left";
  children: ReactNode;
  footer?: ReactNode;
};

export default function LoginCard({
  title,
  subtitle,
  align = "left",
  children,
  footer,
}: LoginCardProps) {
  const isCentered = align === "center";

  return (
    <div className={cn("relative w-full overflow-hidden rounded-[20px] bg-white border border-slate-200/80 shadow-[0_8px_32px_rgba(15,23,42,0.08)]")}>
      {/* Top accent gradient bar */}
      <div className="absolute inset-x-0 top-0 h-[3px] rounded-t-[20px] bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-600" />

      <div className="px-7 pb-7 pt-8 sm:px-9 sm:pb-9">
        <div className={cn("flex flex-col", isCentered ? "items-center text-center" : "items-start text-left")}>
          <h2 className="text-[1.55rem] font-bold tracking-tight text-slate-900 sm:text-[1.7rem]">
            {title}
          </h2>
          {subtitle && (
            <p className={cn("mt-2 text-sm leading-6 text-slate-500", isCentered ? "max-w-sm" : "max-w-lg")}>
              {subtitle}
            </p>
          )}
        </div>

        <div className="mt-6">{children}</div>

        {footer && (
          <div className="mt-6 border-t border-slate-100 pt-5 text-center text-sm text-slate-500">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}