"use client";

import { Printer } from "lucide-react";
import { erpButtonClassName } from "@/components/workspace/styles";

export function PrintButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      className={`${erpButtonClassName.secondary} text-xs cursor-pointer`}
      onClick={onClick}
      title="Print"
    >
      <Printer className="h-3.5 w-3.5" />
      Print
    </button>
  );
}
