"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

type QuickCopyProps = {
  text: string;
  label?: string;
  className?: string;
  showText?: boolean;
};

export function QuickCopyButton({
  text,
  label,
  className,
  showText = false,
}: QuickCopyProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // fallback
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={copied ? "Copied to clipboard!" : `Copy ${label || text}`}
      className={cn(
        "group inline-flex items-center gap-1 text-slate-500 hover:text-slate-900 transition-colors",
        className
      )}
    >
      {showText && <span className="font-mono text-xs">{text}</span>}
      <span className="inline-flex h-5 w-5 items-center justify-center rounded hover:bg-slate-100 text-slate-400 group-hover:text-slate-700 transition-colors">
        {copied ? (
          <Check className="h-3 w-3 text-emerald-600 animate-in zoom-in duration-150" />
        ) : (
          <Copy className="h-3 w-3" />
        )}
      </span>
      <span className="sr-only">Copy</span>
    </button>
  );
}
